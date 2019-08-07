import { h, render } from 'preact';

import { DatabaseVersion, KanjiEntry } from './common';
import { WorkerMessage } from './worker-messages';
import * as messages from './worker-messages';
import { DatabaseState } from './database';
import { CloneableUpdateState } from './update-state';

import { App } from './components/App';

const dbWorker = new Worker('db-worker.js');

let databaseState: DatabaseState = DatabaseState.Initializing;
let databaseVersion: DatabaseVersion | undefined;
let updateState: CloneableUpdateState = { state: 'idle', lastCheck: null };
let entries: Array<KanjiEntry> = [];

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

    case 'dbversionupdated':
      databaseVersion = evt.data.version;
      update();
      break;

    case 'updatestateupdated':
      updateState = evt.data.state;
      update();
      break;

    case 'queryresult':
      entries = evt.data.entries;
      update();
      break;
  }
};

dbWorker.onmessageerror = (evt: MessageEvent) => {
  console.log(`Worker error: ${JSON.stringify(evt)}`);
};

window.requestIdleCallback(
  () => {
    dbWorker.postMessage(updateDb());
  },
  { timeout: 4000 }
);

const updateDb = () => {
  dbWorker.postMessage(messages.updateDb());
};

const cancelDbUpdate = () => {
  dbWorker.postMessage(messages.cancelDbUpdate());
};

const destroyDb = () => {
  dbWorker.postMessage(messages.destroyDb());
};

const params = new URL(document.location.href).searchParams;
const kanji = params.get('kanji');

function runQuery() {
  if (kanji) {
    dbWorker.postMessage(messages.query({ kanji: [...kanji] }));
  }
}

runQuery();

let rootNode: Element | undefined;

function update() {
  rootNode = render(
    <App
      databaseState={databaseState}
      databaseVersion={databaseVersion}
      updateState={updateState}
      entries={entries}
      onUpdateDb={updateDb}
      onCancelDbUpdate={cancelDbUpdate}
      onDestroyDb={destroyDb}
    />,
    document.body,
    rootNode
  );
}

update();
