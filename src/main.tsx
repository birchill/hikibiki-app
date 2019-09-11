import { h, render } from 'preact';

import { DatabaseVersion } from './common';
import { DatabaseState, KanjiResult } from './database';
import { DB_LANGUAGES } from './db-languages';
import { CloneableUpdateState } from './update-state';
import { WorkerMessage } from './worker-messages';
import * as messages from './worker-messages';

import { App } from './components/App';

const dbWorker = new Worker('db-worker.js');

let databaseState: DatabaseState = DatabaseState.Initializing;
let databaseVersions: {
  kanjidb?: DatabaseVersion;
  bushudb?: DatabaseVersion;
} = {};
let updateState: CloneableUpdateState = { state: 'idle', lastCheck: null };
let entries: Array<KanjiResult> = [];

dbWorker.onmessage = (evt: MessageEvent) => {
  switch ((evt.data as WorkerMessage).type) {
    case 'dbstateupdated':
      if (
        databaseState !== DatabaseState.Ok &&
        evt.data.state === DatabaseState.Ok
      ) {
        runQuery();
      } else if (entries.length && evt.data.state !== DatabaseState.Ok) {
        entries = [];
      }
      databaseState = evt.data.state;
      update();
      break;

    case 'dbversionsupdated':
      databaseVersions = evt.data.versions;
      // We don't do the initial database update until we've resolved the
      // database version since otherwise we won't know what language to
      // request.
      runInitialDbUpdate();
      update();
      break;

    case 'updatestateupdated':
      updateState = evt.data.state;
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
    const userLanguages = navigator.languages.map(lang => lang.substring(0, 2));
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

  window.requestIdleCallback(updateDb, { timeout: 4000 });
}

dbWorker.onmessageerror = (evt: MessageEvent) => {
  console.log(`Worker error: ${JSON.stringify(evt)}`);
};

const updateDb = () => {
  dbWorker.postMessage(messages.updateDb());
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
const kanji = params.get('kanji');

function runQuery() {
  if (kanji) {
    dbWorker.postMessage(messages.query({ kanji: [...kanji] }));
  }
}

let rootNode: Element | undefined;

function update() {
  rootNode = render(
    <App
      databaseState={databaseState}
      databaseVersions={databaseVersions}
      updateState={updateState}
      entries={entries}
      onUpdateDb={updateDb}
      onCancelDbUpdate={cancelDbUpdate}
      onDestroyDb={destroyDb}
      onSetLang={onSetLang}
    />,
    document.body,
    rootNode
  );
}

update();
