import { KanjiDatabase } from './database';
import { toCloneable } from './update-state';
import {
  notifyDbStateUpdated,
  notifyUpdateStateUpdated,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

const db = new KanjiDatabase();

const proxyDb = new Proxy(db, {
  set: function(obj, prop, value) {
    (obj as any)[prop] = value;

    try {
      switch (prop) {
        case 'state':
          self.postMessage(notifyDbStateUpdated(db.state));
          break;

        case 'updateState':
          self.postMessage(
            notifyUpdateStateUpdated(toCloneable(db.updateState))
          );
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
