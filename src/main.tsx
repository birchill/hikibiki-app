import { h, render } from 'preact';
import {
  allDataSeries,
  allMajorDataSeries,
  getKanji,
  getNames,
  getWords,
  isMajorDataSeries,
  DataSeriesState,
  KanjiResult,
  MajorDataSeries,
  NameResult,
  WordResult,
} from '@birchill/hikibiki-data';
import { get, set, Store } from 'idb-keyval';
import Rollbar from 'rollbar';

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

(function main() {
  if (!hasReadableStreamSupport()) {
    render(
      <UnsupportedBrowser missingFeatures={['ReadableStream constructor']} />,
      document.body
    );
    return;
  }

  const dbWorker = new Worker('./db-worker', { type: 'module' });
  const rollbar = new Rollbar({
    accessToken: 'c5e59969fd504e6c8b9064f67beb9e93',
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      environment: process.env.NODE_ENV,
    },
  });

  const initialDataSeriesState: DataSeriesInfo = {
    state: DataSeriesState.Initializing,
    version: null,
    updateState: {
      state: 'idle',
      lastCheck: null,
    },
  };
  let databaseState: CombinedDatabaseState = {
    words: { ...initialDataSeriesState },
    kanji: { ...initialDataSeriesState },
    radicals: { ...initialDataSeriesState },
    names: { ...initialDataSeriesState },
  };

  const settingsStore = new Store('hikibiki', 'settings');

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
    if (enabled && databaseState[series].state === DataSeriesState.Empty) {
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
    if (databaseState.words.state === DataSeriesState.Ok) {
      return databaseState.words.version!.lang;
    }

    // However, we shipped support for the kanji database first so try that
    // next.
    if (databaseState.kanji.state === DataSeriesState.Ok) {
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

        // Check if we need to update any query results as a
        // result of databases become available or unavailable.
        for (const series of allMajorDataSeries) {
          const wasOk =
            series === 'kanji'
              ? databaseState.kanji.state === DataSeriesState.Ok &&
                databaseState.radicals.state === DataSeriesState.Ok
              : databaseState[series].state === DataSeriesState.Ok;
          const isOk =
            series === 'kanji'
              ? state.kanji.state === DataSeriesState.Ok &&
                state.radicals.state === DataSeriesState.Ok
              : state[series].state === DataSeriesState.Ok;

          if (!wasOk && isOk) {
            runQuery({ series });
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

        // Generally if one data series is unavailable, they are all
        // unavailable, but if at least one is available, run the update.
        const hasAvailableData = allDataSeries.some(
          (series) =>
            databaseState[series].state !== DataSeriesState.Unavailable
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
      (series) => databaseState[series].state === DataSeriesState.Unavailable
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

  function runQuery({ series }: { series: MajorDataSeries }) {
    if (!q) {
      return;
    }

    switch (series) {
      case 'words':
        getWords(q, { matchType: 'startsWith', limit: 20 }).then((result) => {
          entries = { ...entries, words: result };
          update();
        });
        break;

      case 'kanji':
        getKanji({
          kanji: [...q],
          lang: databaseState.kanji.version?.lang || 'en',
        }).then((result) => {
          entries = { ...entries, kanji: result };
          update();
        });
        break;

      case 'names':
        getNames(q).then((result) => {
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
    search: string;
    historyMode?: 'replace' | 'push' | 'skip';
  }) {
    // Ignore redundant changes since this might arise due to differences in
    // browsers handling compositionend events.
    if (q === search) {
      return;
    }

    q = search;
    if (q) {
      if (
        enabledSeries.has('words') &&
        databaseState.words.state === DataSeriesState.Ok
      ) {
        runQuery({ series: 'words' });
      }
      if (
        enabledSeries.has('kanji') &&
        databaseState.kanji.state === DataSeriesState.Ok
      ) {
        runQuery({ series: 'kanji' });
      }
      if (
        enabledSeries.has('names') &&
        databaseState.names.state === DataSeriesState.Ok
      ) {
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
      params.set('q', search);
    } else {
      params.delete('q');
    }

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
    const search = new URL(document.location.href).searchParams.get('q') ?? '';
    onUpdateSearch({ search, historyMode: 'skip' });
  });

  function update() {
    render(
      <App
        databaseState={databaseState}
        enabledSeries={enabledSeries}
        lang={getLangToUse()}
        entries={entries}
        search={q || undefined}
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
