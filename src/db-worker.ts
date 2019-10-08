import {
  CloneableUpdateState,
  DownloadError,
  KanjiDatabase,
  UpdateState,
} from '@birchill/hikibiki-sync';
import {
  notifyDbStateUpdated,
  notifyQueryResult,
  notifySetPreferredLangResult,
  CombinedDatabaseState,
  ResolvedDbVersions,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

const db = new KanjiDatabase();

db.onChange = () => {
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
    updateState: toCloneable(db.updateState),
    versions: db.dbVersions as ResolvedDbVersions,
  };

  try {
    self.postMessage(notifyDbStateUpdated(combinedState));
  } catch (e) {
    console.log('Error posting message');
    console.log(e);
  }
};

onmessage = (evt: MessageEvent) => {
  // We seem to get random events here occasionally. Not sure where they come
  // from.
  if (!evt.data) {
    return;
  }

  switch ((evt.data as WorkerMessage).type) {
    case 'update':
      db.update();
      break;

    case 'cancelupdate':
      db.cancelUpdate();
      break;

    case 'destroy':
      db.destroy();
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

// Turn the object into something we can postMessage
const toCloneable = (state: UpdateState): CloneableUpdateState => {
  if (state.state === 'error') {
    return {
      ...state,
      error: {
        name: state.error.name,
        message: state.error.message,
        code:
          state.error instanceof DownloadError ? state.error.code : undefined,
      },
    };
  }

  return state;
};
