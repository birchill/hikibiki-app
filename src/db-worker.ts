import { KanjiDatabase } from './database';
import {
  notifyDbStateUpdated,
  notifyUpdateStateUpdated,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

const db = new KanjiDatabase();

// Do the initial state update once we have loaded the database

db.ready.then(() => {
  self.postMessage(notifyDbStateUpdated(db.state));
  self.postMessage(notifyUpdateStateUpdated(db.updateState));
});

const proxyDb = new Proxy(db, {
  set: function(obj, prop, value) {
    (obj as any)[prop] = value;

    try {
      switch (prop) {
        case 'state':
          self.postMessage(notifyDbStateUpdated(db.state));
          break;

        case 'updateState':
          self.postMessage(notifyUpdateStateUpdated(db.updateState));
          break;
      }
    } catch (e) {
      console.log('Error posting message');
      console.log(e);
      return false;
    }

    return true;
  },
});

onmessage = (evt: MessageEvent) => {
  switch ((evt.data as WorkerMessage).type) {
    case 'update':
      proxyDb.update();
      break;
  }
};
