import { h, Component } from 'preact';

import { DatabaseStatus } from './components/DatabaseStatus';
import { updateDb, WorkerMessage } from './worker-messages';
import { DatabaseState } from './database';
import { UpdateState } from './update-state';

const dbWorker = new Worker('db-worker.js');

let databaseState: DatabaseState = DatabaseState.Initializing;
let updateState: UpdateState = { state: 'idle', lastCheck: null };

dbWorker.onmessage = (evt: MessageEvent) => {
  switch ((evt.data as WorkerMessage).type) {
    case 'dbstateupdated':
      console.log(
        `Got updated database state: ${JSON.stringify(evt.data.state)}`
      );
      break;

    case 'updatestateupdated':
      console.log(
        `Got updated update state: ${JSON.stringify(evt.data.state)}`
      );
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

export class App extends Component {
  render() {
    return (
      <DatabaseStatus databaseState={databaseState} updateState={updateState} />
    );
  }
}
