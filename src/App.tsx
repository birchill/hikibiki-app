import { h, Component } from 'preact';

import { DownloadState } from './DownloadState';
import { DatabaseStatus } from './DatabaseStatus';
import { updateDb, WorkerMessage } from './worker-messages';

// TypeScript typings are missing this it seems
//
// TODO: Move this somewhere better
declare global {
  interface Worker {
    onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null;
  }
}

const downloadState = DownloadState.Initializing;

const dbWorker = new Worker('db-worker.js');

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

// TODO: Move these typings somewhere else

declare global {
  type IdleRequestCallback = (deadline: IdleDeadline) => void;

  interface IdleDeadline {
    timeRemaining: () => number;
    readonly didTimeout: boolean;
  }

  interface IdleRequestCallbackOptions {
    timeout?: number;
  }

  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      options?: IdleRequestCallbackOptions
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

window.requestIdleCallback(
  () => {
    dbWorker.postMessage(updateDb());
  },
  { timeout: 4000 }
);

export class App extends Component {
  render() {
    return <DatabaseStatus downloadState={downloadState} />;
  }
}
