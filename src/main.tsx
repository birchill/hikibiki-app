import { h, render } from 'preact';

import { DatabaseVersion } from './common';
import { WorkerMessage } from './worker-messages';
import * as messages from './worker-messages';
import { DatabaseState } from './database';
import { CloneableUpdateState } from './update-state';

import { App } from './components/App';

const dbWorker = new Worker('db-worker.js');

let databaseState: DatabaseState = DatabaseState.Initializing;
let databaseVersion: DatabaseVersion | undefined;
let updateState: CloneableUpdateState = { state: 'idle', lastCheck: null };

dbWorker.onmessage = (evt: MessageEvent) => {
  switch ((evt.data as WorkerMessage).type) {
    case 'dbstateupdated':
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

let rootNode: Element | undefined;

function update() {
  rootNode = render(
    <App
      databaseState={databaseState}
      databaseVersion={databaseVersion}
      updateState={updateState}
      onUpdateDb={updateDb}
      onCancelDbUpdate={cancelDbUpdate}
      onDestroyDb={destroyDb}
    />,
    document.body,
    rootNode
  );
}

update();
