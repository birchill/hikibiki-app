import { KanjiDatabase } from './database';
import {
  notifyDbStateUpdated,
  notifyDbVersionsUpdated,
  notifyQueryResult,
  notifySetPreferredLangResult,
  notifyUpdateStateUpdated,
  ResolvedDbVersions,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

const db = new KanjiDatabase();

// Do the initial state update once we have loaded the database

db.ready.then(() => {
  self.postMessage(notifyDbStateUpdated(db.state));
  console.assert(
    typeof db.dbVersions.kanjidb !== 'undefined' &&
      typeof db.dbVersions.bushudb !== 'undefined',
    'Database versions should be resolved by the time we are ready'
  );
  self.postMessage(
    notifyDbVersionsUpdated(db.dbVersions as ResolvedDbVersions)
  );
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

        case 'dbVersions':
          // Wait until we have finished initializing before reporting the
          // database versions.
          if (
            typeof db.dbVersions.kanjidb !== 'undefined' &&
            typeof db.dbVersions.bushudb !== 'undefined'
          ) {
            self.postMessage(
              notifyDbVersionsUpdated(db.dbVersions as ResolvedDbVersions)
            );
          }
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
  // We seem to get random events here occasionally. Not sure where they come
  // from.
  if (!evt.data) {
    return;
  }

  switch ((evt.data as WorkerMessage).type) {
    case 'update':
      proxyDb.update();
      break;

    case 'cancelupdate':
      proxyDb.cancelUpdate();
      break;

    case 'destroy':
      proxyDb.destroy();
      break;

    case 'query':
      proxyDb.getKanji(evt.data.kanji).then(result => {
        self.postMessage(notifyQueryResult(result));
      });
      break;

    case 'setpreferredlang':
      proxyDb.setPreferredLang(evt.data.lang).then(
        () => {
          self.postMessage(
            notifySetPreferredLangResult({ ok: true, lang: evt.data.lang })
          );
        },
        () => {
          self.postMessage(
            notifySetPreferredLangResult({ ok: false, lang: evt.data.lang })
          );
        }
      );
      break;
  }
};
