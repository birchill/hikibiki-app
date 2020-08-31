import {
  DataSeries,
  JpdictDatabase,
  toUpdateErrorState,
  UpdateErrorState,
  updateWithRetry,
} from '@birchill/hikibiki-data';

import {
  notifyDbStateUpdated,
  notifyQueryKanjiResult,
  notifyQueryNamesResult,
  CombinedDatabaseState,
  WorkerMessage,
} from './worker-messages';

declare var self: DedicatedWorkerGlobalScope;

// We used to debounce notifications here since often we'll get an notification
// that the update state has been updated quickly followed by a callback to
// onUpdateError.
//
// However, that same debouncing would cause all our download progress events to
// be coalesced and we'd see no progress at all.
//
// Perhaps we need to debounce on the receiving end instead?
const doDbStateNotification = () => {
  // Wait until we have finished resolving the database versions before
  // reporting anything.
  if (
    typeof db.kanji.version === 'undefined' ||
    typeof db.radicals.version === 'undefined' ||
    typeof db.names.version === 'undefined'
  ) {
    return;
  }

  const combinedState: CombinedDatabaseState = {
    kanji: {
      ...db.kanji,
      updateError: lastUpdateError.kanji,
    },
    radicals: {
      ...db.radicals,
      updateError: lastUpdateError.radicals,
    },
    names: {
      ...db.names,
      updateError: lastUpdateError.names,
    },
  };

  try {
    self.postMessage(notifyDbStateUpdated(combinedState));
  } catch (e) {
    console.log('Error posting message');
    console.log(e);
  }
};

let db = initDb();

function initDb(): JpdictDatabase {
  const result = new JpdictDatabase();
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
      updateWithRetry({
        db,
        series: evt.data.series,
        lang: evt.data.lang,
        onUpdateComplete: () => onUpdateComplete({ series: evt.data.series }),
        onUpdateError: (params) =>
          onUpdateError({ ...params, series: evt.data.series }),
      });
      break;

    case 'forceupdate':
      updateWithRetry({
        db,
        series: evt.data.series,
        lang: evt.data.lang,
        forceUpdate: true,
        onUpdateComplete: () => onUpdateComplete({ series: evt.data.series }),
        onUpdateError: (params) =>
          onUpdateError({ ...params, series: evt.data.series }),
      });
      break;

    case 'cancelupdate':
      db.cancelUpdate({ series: evt.data.series });
      break;

    case 'destroy':
      db.destroy();
      break;

    case 'rebuild':
      db.destroy()
        .then(() => {
          db = initDb();
        })
        .catch((e) => {
          console.error('Error rebuilding database');
          console.error(e);
        });
      break;

    case 'query':
      if (evt.data.kanji) {
        db.getKanji(evt.data.kanji).then((result) => {
          self.postMessage(notifyQueryKanjiResult(result));
        });
      }
      if (evt.data.names) {
        db.getNames(evt.data.names).then((result) => {
          self.postMessage(notifyQueryNamesResult(result));
        });
      }
      break;
  }
};

let lastUpdateError: {
  [series in DataSeries]: UpdateErrorState | undefined;
} = { kanji: undefined, radicals: undefined, names: undefined };

function onUpdateComplete({ series }: { series: DataSeries }) {
  lastUpdateError[series] = undefined;
  doDbStateNotification();
}

function onUpdateError(params: {
  series: DataSeries;
  error: Error;
  nextRetry?: Date;
  retryCount?: number;
}) {
  lastUpdateError[params.series] = toUpdateErrorState(params);
  doDbStateNotification();
}
