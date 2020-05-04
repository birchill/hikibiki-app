import { h, render } from 'preact';
import {
  DatabaseVersion,
  DatabaseState,
  KanjiResult,
  UpdateErrorState,
  UpdateState,
} from '@birchill/hikibiki-data';
import Rollbar from 'rollbar';

import { DB_LANGUAGES } from './db-languages';
import { WorkerMessage } from './worker-messages';
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

  let databaseState: DatabaseState = DatabaseState.Initializing;
  let databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  } = {};
  let updateState: UpdateState = { state: 'idle', lastCheck: null };
  let updateError: UpdateErrorState | undefined;
  let entries: Array<KanjiResult> = [];

  dbWorker.onmessage = (evt: MessageEvent) => {
    switch ((evt.data as WorkerMessage).type) {
      case 'dbstateupdated':
        const { state } = evt.data;
        if (
          databaseState !== DatabaseState.Ok &&
          state.databaseState === DatabaseState.Ok
        ) {
          runQuery();
        } else if (entries.length && state.databaseState !== DatabaseState.Ok) {
          entries = [];
        }

        if (!updateError && !!state.updateError) {
          const { name, message } = state.updateError;
          rollbar.error(`${name}: ${message}`, state.updateError);
        }

        databaseState = state.databaseState;
        updateState = state.updateState;
        updateError = state.updateError;
        databaseVersions = state.versions;
        if (databaseState !== DatabaseState.Unavailable) {
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

    // Check if we have an existing language selected
    let preferredLang: string | null = null;
    if (databaseVersions.kanjidb) {
      preferredLang = databaseVersions.kanjidb.lang;
    }
    if (!preferredLang) {
      // Otherwise use the user's most preferred language
      const userLanguages = navigator.languages.map((lang) =>
        lang.substring(0, 2)
      );
      for (const lang of userLanguages) {
        if (DB_LANGUAGES.includes(lang)) {
          preferredLang = lang;
          break;
        }
      }
    }

    if (preferredLang) {
      await setPreferredLang(preferredLang);
    }

    if (window.requestIdleCallback) {
      window.requestIdleCallback(updateDb, { timeout: 4000 });
    } else {
      window.setTimeout(updateDb, 1000);
    }
  }

  dbWorker.onmessageerror = (evt: MessageEvent) => {
    console.log(`Worker error: ${JSON.stringify(evt)}`);
    rollbar.error(`Worker error: ${JSON.stringify(evt)}`);
  };

  const updateDb = () => {
    if (databaseState === DatabaseState.Unavailable) {
      dbWorker.postMessage(messages.rebuildDb());
    } else {
      dbWorker.postMessage(messages.forceUpdateDb());
    }
  };

  const cancelDbUpdate = () => {
    dbWorker.postMessage(messages.cancelDbUpdate());
  };

  const destroyDb = () => {
    dbWorker.postMessage(messages.destroyDb());
  };

  async function setPreferredLang(lang: string | null): Promise<boolean> {
    dbWorker.postMessage(messages.setPreferredLang({ lang }));

    return new Promise((resolve, reject) => {
      const checkForResult = (evt: MessageEvent) => {
        const workerMessage = evt.data;
        if (workerMessage.type !== 'setpreferredlangresult') {
          return;
        }

        // Check it wasn't an overlapping request
        if (workerMessage.lang !== lang) {
          return;
        }

        dbWorker.removeEventListener('message', checkForResult);
        if (!workerMessage.ok) {
          reject();
        }
        resolve();
      };

      dbWorker.addEventListener('message', checkForResult);
    });
  }

  async function onSetLang(lang: string) {
    await setPreferredLang(lang);
    updateDb();
  }

  const params = new URL(document.location.href).searchParams;
  let q = params.get('q');

  function runQuery() {
    if (q) {
      dbWorker.postMessage(messages.query({ kanji: [...q] }));
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
      dbWorker.postMessage(messages.query({ kanji: [...q] }));
    } else {
      entries = [];
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
        databaseVersions={databaseVersions}
        updateState={updateState}
        updateError={updateError}
        entries={entries}
        search={q || undefined}
        onUpdateSearch={onUpdateSearch}
        onUpdateDb={updateDb}
        onCancelDbUpdate={cancelDbUpdate}
        onDestroyDb={destroyDb}
        onSetLang={onSetLang}
      />,
      document.body
    );
  }

  update();
})();
