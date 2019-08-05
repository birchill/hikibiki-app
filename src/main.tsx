import { h, render } from 'preact';

import { DatabaseVersion } from './common';
import { updateDb, WorkerMessage } from './worker-messages';
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
      console.log(
        `Got updated database state: ${JSON.stringify(evt.data.state)}`
      );
      databaseState = evt.data.state;
      update();
      break;

    case 'dbversionupdated':
      console.log(
        `Got updated database version: ${JSON.stringify(evt.data.version)}`
      );
      databaseVersion = evt.data.version;
      update();
      break;

    case 'updatestateupdated':
      console.log(
        `Got updated update state: ${JSON.stringify(evt.data.state)}`
      );
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

let rootNode: Element | undefined;

function update() {
  rootNode = render(
    <App
      databaseState={databaseState}
      databaseVersion={databaseVersion}
      updateState={updateState}
    />,
    document.body,
    rootNode
  );
}

update();
