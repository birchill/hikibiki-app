import { h, render } from 'preact';
import {
  DataSeries,
  DataSeriesState,
  KanjiResult,
  MajorDataSeries,
  NameResult,
} from '@birchill/hikibiki-data';
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
    kanji: { ...initialDataSeriesState },
    radicals: { ...initialDataSeriesState },
    names: { ...initialDataSeriesState },
  };

  let entries: { kanji: Array<KanjiResult>; names: Array<NameResult> } = {
    kanji: [],
    names: [],
  };

  dbWorker.onmessage = (evt: MessageEvent) => {
    switch ((evt.data as WorkerMessage).type) {
      case 'dbstateupdated':
        const { state } = evt.data;

        // Check if we need to update any query results as a
        // result of databases become available or unavailable.
        const majorDataSeries: Array<MajorDataSeries> = ['kanji', 'names'];
        for (const series of majorDataSeries) {
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
        const dataSeries: Array<DataSeries> = ['kanji', 'radicals', 'names'];
        for (const series of dataSeries) {
          if (
            !databaseState[series].updateError &&
            !!state[series].updateError
          ) {
            const { name, message } = state.updateError;
            rollbar.error(`${name}: ${message}`, state.updateError);
          }
        }

        databaseState = state;

        // Generally if one data series is unavailable, they are all
        // unavailable, but if at least one is available, run the update.
        const hasAvailableData = dataSeries.some(
          (series) =>
            databaseState[series].state !== DataSeriesState.Unavailable
        );
        if (hasAvailableData) {
          runInitialDbUpdate();
        }
        update();
        break;

      case 'queryresult':
        entries = evt.data.results;
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

  function getPreferredLang() {
    // Check if we have an existing language selected
    if (databaseState.kanji.state === DataSeriesState.Ok) {
      return databaseState.kanji.version!.lang;
    }

    // Otherwise use the user's most preferred language
    const userLanguages = navigator.languages.map((lang) =>
      lang.substring(0, 2)
    );
    for (const lang of userLanguages) {
      if (DB_LANGUAGES.includes(lang)) {
        return lang;
      }
    }

    return 'en';
  }

  dbWorker.onmessageerror = (evt: MessageEvent) => {
    console.log(`Worker error: ${JSON.stringify(evt)}`);
    rollbar.error(`Worker error: ${JSON.stringify(evt)}`);
  };

  const updateDb = ({
    series,
    lang: requestedLang,
  }: { series?: MajorDataSeries; lang?: string } = {}) => {
    // We use this same callback to trigger re-building the database when it is
    // unavailable.
    //
    // TODO: Move this somewhere common (maybe even export from hikibiki-data)
    const dataSeries: Array<DataSeries> = ['kanji', 'radicals', 'names'];
    const isUnavailable = dataSeries.some(
      (series) => databaseState[series].state === DataSeriesState.Unavailable
    );
    if (isUnavailable) {
      dbWorker.postMessage(messages.rebuildDb());
      return;
    }

    const lang = requestedLang || getPreferredLang();

    if (series) {
      dbWorker.postMessage(messages.forceUpdateDb({ series, lang }));
    } else {
      dbWorker.postMessage(messages.forceUpdateDb({ series: 'kanji', lang }));

      // We only download the names dictionary if the user chooses to.
      //
      // TODO: We should have a better way of remembering if a data series
      // is enabled or not, rather than just checking if there's data there or
      // not.
      if (databaseState.names.state === DataSeriesState.Ok) {
        dbWorker.postMessage(messages.forceUpdateDb({ series: 'names', lang }));
      }
    }
  };

  const cancelDbUpdate = ({ series }: { series: MajorDataSeries }) => {
    dbWorker.postMessage(messages.cancelDbUpdate({ series }));
  };

  async function onSetLang(lang: string) {
    // TODO: Actually store this in local storage so that even if we disable all
    // the data stores we don't forget it.
    updateDb({ lang });
  }

  const params = new URL(document.location.href).searchParams;
  let q = params.get('q');

  function runQuery({ series }: { series: MajorDataSeries }) {
    if (!q) {
      return;
    }

    switch (series) {
      case 'kanji':
        dbWorker.postMessage(messages.query({ kanji: [...q] }));
        break;

      case 'names':
        dbWorker.postMessage(messages.query({ names: q }));
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
      // TODO: This would also benefit from some local setting telling us which
      // data series are supposed to be enabled.
      if (databaseState.kanji.state === DataSeriesState.Ok) {
        runQuery({ series: 'kanji' });
      }
      if (databaseState.names.state === DataSeriesState.Ok) {
        runQuery({ series: 'names' });
      }
    } else {
      entries = {
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
        entries={entries}
        search={q || undefined}
        onUpdateSearch={onUpdateSearch}
        onUpdateDb={updateDb}
        onCancelDbUpdate={cancelDbUpdate}
        onSetLang={onSetLang}
      />,
      document.body
    );
  }

  update();
})();
