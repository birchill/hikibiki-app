import {
  KanjiDatabase,
  toUpdateErrorState,
  UpdateErrorState,
  updateWithRetry,
} from '@birchill/hikibiki-data';

import { debounce } from './debounce';
import {
  notifyDbStateUpdated,
  notifyQueryResult,
  notifySetPreferredLangResult,
  CombinedDatabaseState,
  ResolvedDbVersions,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

// Debounce notifications since often we'll get an notification that the update
// state has been updated quickly followed by a callback to onUpdateError.
const doDbStateNotification = debounce(() => {
  // Wait until we have finished resolving the database versions before
  // reporting anything.
  if (
    typeof db.dbVersions.kanjidb === 'undefined' ||
    typeof db.dbVersions.bushudb === 'undefined'
  ) {
    return;
  }

  const combinedState: CombinedDatabaseState = {
    databaseState: db.state,
    updateState: db.updateState,
    updateError: lastUpdateError,
    versions: db.dbVersions as ResolvedDbVersions,
  };

  try {
    self.postMessage(notifyDbStateUpdated(combinedState));
  } catch (e) {
    console.log('Error posting message');
    console.log(e);
  }
}, 0);

let db = initDb();

function initDb(): KanjiDatabase {
  const result = new KanjiDatabase();
  result.addChangeListener(doDbStateNotification);
  return result;
}

onmessage = (evt: MessageEvent) => {
  // We seem to get random events here occasionally. Not sure where they come
  // from.
  if (!evt.data) {
    return;
  }

  switch ((evt.data as WorkerMessage).type) {
    case 'update':
      updateWithRetry({ db, onUpdateComplete, onUpdateError });
      break;

    case 'forceupdate':
      updateWithRetry({
        db,
        forceUpdate: true,
        onUpdateComplete,
        onUpdateError,
      });
      break;

    case 'cancelupdate':
      db.cancelUpdate();
      break;

    case 'destroy':
      db.destroy();
      break;

    case 'rebuild':
      db.destroy()
        .then(() => {
          db = initDb();
        })
        .catch(e => {
          console.error('Error rebuilding database');
          console.error(e);
        });
      break;

    case 'query':
      db.getKanji(evt.data.kanji).then(result => {
        self.postMessage(notifyQueryResult(result));
      });
      break;

    case 'setpreferredlang':
      db.setPreferredLang(evt.data.lang).then(
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

let lastUpdateError: UpdateErrorState | undefined;

function onUpdateComplete() {
  lastUpdateError = undefined;
  doDbStateNotification();
}

function onUpdateError(params: {
  error: Error;
  nextRetry?: Date;
  retryCount?: number;
}) {
  lastUpdateError = toUpdateErrorState(params);
  doDbStateNotification();
}
