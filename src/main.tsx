import { h, render } from 'preact';
import {
  allDataSeries,
  allMajorDataSeries,
  getKanji,
  getNames,
  getWords,
  getWordsWithGloss,
  isMajorDataSeries,
  CrossReference,
  KanjiResult,
  MajorDataSeries,
  NameResult,
  WordResult,
  getWordsByCrossReference,
  DataVersion,
} from '@birchill/jpdict-idb';
import { get, set, createStore } from 'idb-keyval';
import Rollbar from 'rollbar';

import {
  crossReferenceFromQueryString,
  updateQueryStringFromCrossReference,
} from './cross-reference';
import { DB_LANGUAGES } from './db-languages';
import {
  CombinedDatabaseState,
  DataSeriesInfo,
  WorkerMessage,
} from './worker-messages';
import * as messages from './worker-messages';
import { hasReadableStreamSupport } from './browser-support';

import { App } from './components/App';
import { UnsupportedBrowser } from './components/UnsupportedBrowser';

import './index.css';
import { hasJapanese } from './japanese';

(function main() {
  if (!hasReadableStreamSupport()) {
    render(
      <UnsupportedBrowser missingFeatures={['ReadableStream constructor']} />,
      document.body
    );
    return;
  }

  const dbWorker = new Worker(new URL('./db-worker', import.meta.url), {
    type: 'module' /* webpackChunkName: 'worker' */,
  });
  const rollbar = new Rollbar({
    accessToken: 'c5e59969fd504e6c8b9064f67beb9e93',
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      environment: process.env.NODE_ENV,
    },
  });

  if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('Service worker registration failed:', error);
    });
  }

  const initialDataSeriesState: DataSeriesInfo = {
    state: 'init',
    version: null,
    updateState: {
      type: 'idle',
      lastCheck: null,
    },
  };
  let databaseState: CombinedDatabaseState = {
    words: { ...initialDataSeriesState },
    kanji: { ...initialDataSeriesState },
    radicals: { ...initialDataSeriesState },
    names: { ...initialDataSeriesState },
  };

  const settingsStore = createStore('hikibiki', 'settings');

  // Enabled series
  const enabledSeries: Set<MajorDataSeries> = new Set(['words', 'kanji']);
  get('series', settingsStore).then((storedSeries: string | undefined) => {
    if (typeof storedSeries === 'undefined') {
      return;
    }

    enabledSeries.clear();
    for (const series of storedSeries.split(',')) {
      if (isMajorDataSeries(series)) {
        enabledSeries.add(series);
      }
    }
  });

  async function onToggleSeries({
    series,
    enabled,
  }: {
    series: MajorDataSeries;
    enabled: boolean;
  }) {
    // Update local storage
    if (enabled) {
      enabledSeries.add(series);
    } else {
      enabledSeries.delete(series);
    }
    set('series', [...enabledSeries].join(','), settingsStore);

    // If we enabled something, run an update if there's no data available.
    if (enabled && databaseState[series].state === 'empty') {
      updateDb({ series });
    }

    // If we enabled something, re-run the query in case the search term was
    // altered while it was disabled.
    if (enabled) {
      runQuery({ series });
    }

    // Re-render
    update();
  }

  // Preferred lang
  let preferredLang: string | undefined;
  get('lang', settingsStore).then((lang: string | undefined) => {
    if (lang && DB_LANGUAGES.includes(lang)) {
      preferredLang = lang;
    }
  });

  function getLangToUse(): string {
    // Check for an explicit user setting
    if (preferredLang) {
      return preferredLang;
    }

    // Otherwise check if we have downloaded some particular language.
    // (The words database supports the largest range of languages so use
    // that first).
    if (databaseState.words.state === 'ok') {
      return databaseState.words.version!.lang;
    }

    // However, we shipped support for the kanji database first so try that
    // next.
    if (databaseState.kanji.state === 'ok') {
      return databaseState.kanji.version!.lang;
    }

    // Otherwise try the user's most preferred language
    const userLanguages = navigator.languages.map((lang) =>
      lang.substring(0, 2)
    );
    for (const lang of userLanguages) {
      if (DB_LANGUAGES.includes(lang)) {
        return lang;
      }
    }

    // Finally fall back to English since all databases support that.
    return 'en';
  }

  async function onSetLang(lang: string) {
    if (!DB_LANGUAGES.includes(lang)) {
      throw new Error(`Unsupported language requested: ${lang}`);
    }

    if (lang === getLangToUse()) {
      return;
    }

    preferredLang = lang;
    set('lang', lang, settingsStore);

    updateDb();
    update();
  }

  let entries: {
    words: Array<WordResult>;
    kanji: Array<KanjiResult>;
    names: Array<NameResult>;
  } = {
    words: [],
    kanji: [],
    names: [],
  };

  dbWorker.onmessage = (evt: MessageEvent) => {
    switch ((evt.data as WorkerMessage).type) {
      case 'dbstateupdated':
        const { state } = evt.data;

        // Check if we need to update any query results as a result of databases
        // becoming available or unavailable or updating their version.
        const queriesToRun: Array<MajorDataSeries> = [];
        for (const series of allMajorDataSeries) {
          const wasOk =
            series === 'kanji'
              ? databaseState.kanji.state === 'ok' &&
                databaseState.radicals.state === 'ok'
              : databaseState[series].state === 'ok';
          const isOk =
            series === 'kanji'
              ? state.kanji.state === 'ok' && state.radicals.state === 'ok'
              : state[series].state === 'ok';

          const versionAsString = (version: DataVersion | null) =>
            version
              ? `${version.major}.${version.minor}.${version.patch}:${version.lang}`
              : `null`;
          const prevVersion = versionAsString(databaseState[series].version);
          const newVersion = versionAsString(state[series].version);

          if (
            (!wasOk && isOk) ||
            (wasOk && isOk && prevVersion !== newVersion)
          ) {
            // Defer this until after we've updated databaseState
            queriesToRun.push(series);
          } else if (entries[series].length && !isOk) {
            entries[series] = [];
          }
        }

        // Check if there are any update errors to report
        for (const series of allDataSeries) {
          if (
            !databaseState[series].updateError &&
            !!state[series].updateError &&
            state[series].updateError.name !== 'AbortError'
          ) {
            const { name, message } = state[series].updateError;
            rollbar.error(`${name}: ${message}`, state.updateError);
          }
        }

        databaseState = state;

        // Update query results
        for (const series of queriesToRun) {
          runQuery({ series });
        }

        // Generally if one data series is unavailable, they are all
        // unavailable, but if at least one is available, run the update.
        const hasAvailableData = allDataSeries.some(
          (series) => databaseState[series].state !== 'unavailable'
        );
        if (hasAvailableData) {
          runInitialDbUpdate();
        }
        update();
        break;
    }
  };

  let triggeredInitialUpdate = false;

  async function runInitialDbUpdate() {
    if (triggeredInitialUpdate) {
      return;
    }

    triggeredInitialUpdate = true;

    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => updateDb(), { timeout: 4000 });
    } else {
      window.setTimeout(updateDb, 1000);
    }
  }

  dbWorker.onmessageerror = (evt: MessageEvent) => {
    console.log(`Worker error: ${JSON.stringify(evt)}`);
    rollbar.error(`Worker error: ${JSON.stringify(evt)}`);
  };

  const updateDb = ({ series }: { series?: MajorDataSeries } = {}) => {
    // We use this same callback to trigger re-building the database when it is
    // unavailable.
    const isUnavailable = allDataSeries.some(
      (series) => databaseState[series].state === 'unavailable'
    );
    if (isUnavailable) {
      dbWorker.postMessage(messages.rebuildDb());
      return;
    }

    const lang = getLangToUse();

    if (series) {
      dbWorker.postMessage(messages.forceUpdateDb({ series, lang }));
    } else {
      for (const series of [...enabledSeries]) {
        dbWorker.postMessage(messages.forceUpdateDb({ series, lang }));
      }
    }
  };

  const cancelDbUpdate = ({ series }: { series: MajorDataSeries }) => {
    dbWorker.postMessage(messages.cancelDbUpdate({ series }));
  };

  const params = new URL(document.location.href).searchParams;
  let q = params.get('q');
  let xref = !q ? crossReferenceFromQueryString(params) : undefined;

  function getSearchTerm({ series }: { series: MajorDataSeries }) {
    let result: string | undefined;

    if (xref) {
      const k = (xref as any).k as string | undefined;
      const r = (xref as any).r as string | undefined;
      if (series === 'kanji') {
        result = k;
      } else if (series === 'names') {
        result = k || r;
      }
    } else {
      result = q!;
    }

    return result;
  }

  function runQuery({ series }: { series: MajorDataSeries }) {
    if (!q && !xref) {
      return;
    }

    // Handle an actual cross-reference search first
    if (xref && series === 'words') {
      getWordsByCrossReference(xref).then((result) => {
        entries = { ...entries, words: result };
        update();
      });
      return;
    }

    // Do fallback for all other types
    const search = getSearchTerm({ series });
    if (!search) {
      return;
    }

    switch (series) {
      case 'words':
        if (hasJapanese(search)) {
          getWords(search, { matchType: 'startsWith', limit: 20 }).then(
            (result) => {
              // Check for overlapping queries (which can happen when the user
              // types quickly)
              if (search !== getSearchTerm({ series })) {
                return;
              }
              entries = { ...entries, words: result };
              update();
            }
          );
        } else {
          const lang = databaseState.words.version?.lang || 'en';
          getWordsWithGloss(search, lang, 20).then((result) => {
            if (search !== getSearchTerm({ series })) {
              return;
            }
            entries = { ...entries, words: result };
            update();
          });
        }
        break;

      case 'kanji':
        getKanji({
          kanji: [...search],
          lang: databaseState.kanji.version?.lang || 'en',
        }).then((result) => {
          if (search !== getSearchTerm({ series })) {
            return;
          }
          entries = { ...entries, kanji: result };
          update();
        });
        break;

      case 'names':
        getNames(search).then((result) => {
          if (search !== getSearchTerm({ series })) {
            return;
          }
          entries = { ...entries, names: result };
          update();
        });
        break;
    }
  }

  function onUpdateSearch({
    search,
    historyMode = 'replace',
  }: {
    search: string | CrossReference;
    historyMode?: 'replace' | 'push' | 'skip';
  }) {
    // Ignore redundant changes since this might arise due to differences in
    // browsers handling compositionend events.
    if (q === search) {
      return;
    }

    // Update local state
    if (typeof search === 'string') {
      q = search;
      xref = undefined;
    } else {
      q = null;
      xref = search;
    }

    if (q || xref) {
      if (enabledSeries.has('words') && databaseState.words.state === 'ok') {
        runQuery({ series: 'words' });
      }
      if (enabledSeries.has('kanji') && databaseState.kanji.state === 'ok') {
        runQuery({ series: 'kanji' });
      }
      if (enabledSeries.has('names') && databaseState.names.state === 'ok') {
        runQuery({ series: 'names' });
      }
    } else {
      entries = {
        words: [],
        kanji: [],
        names: [],
      };
    }
    update();

    if (historyMode === 'skip') {
      return;
    }

    // Update the location
    const url = new URL(document.location.href);
    const params = url.searchParams;
    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }
    updateQueryStringFromCrossReference(xref, params);

    switch (historyMode) {
      case 'push':
        history.pushState({}, '', url.href);
        break;

      case 'replace':
        history.replaceState({}, '', url.href);
        break;
    }
  }

  window.addEventListener('popstate', (evt) => {
    const params = new URL(document.location.href).searchParams;
    let search: string | CrossReference = params.get('q') ?? '';
    if (!search) {
      search = crossReferenceFromQueryString(params) || '';
    }
    onUpdateSearch({ search, historyMode: 'skip' });
  });

  function update() {
    let search: string | undefined;
    if (q) {
      search = q;
    } else if (xref) {
      const k = (xref as any).k as string | undefined;
      const r = (xref as any).r as string | undefined;
      search = k || r || undefined;
    }

    render(
      <App
        databaseState={databaseState}
        enabledSeries={enabledSeries}
        lang={getLangToUse()}
        entries={entries}
        search={search}
        onUpdateSearch={onUpdateSearch}
        onUpdateDb={updateDb}
        onCancelDbUpdate={cancelDbUpdate}
        onSetLang={onSetLang}
        onToggleSeries={onToggleSeries}
      />,
      document.body
    );
  }

  update();
})();
