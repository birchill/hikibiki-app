import {
  DataSeries,
  JpdictFullTextDatabase,
  toUpdateErrorState,
  UpdateErrorState,
  updateWithRetry,
} from '@birchill/jpdict-idb';

import {
  notifyDbStateUpdated,
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
    typeof db.words.version === 'undefined' ||
    typeof db.kanji.version === 'undefined' ||
    typeof db.radicals.version === 'undefined' ||
    typeof db.names.version === 'undefined'
  ) {
    return;
  }

  const combinedState: CombinedDatabaseState = {
    words: {
      ...db.words,
      updateError: lastUpdateError.words,
    },
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

function initDb(): JpdictFullTextDatabase {
  const result = new JpdictFullTextDatabase();
  result.addChangeListener(doDbStateNotification);
  return result;
}

onmessage = (evt: MessageEvent) => {
  // We seem to get random events here occasionally. Not sure where they come
  // from.
  if (!evt.data) {
    return;
  }

  const message: WorkerMessage = evt.data;

  switch (message.type) {
    case 'update':
      updateWithRetry({
        db,
        series: message.series,
        lang: message.lang,
        onUpdateComplete: () => onUpdateComplete({ series: message.series }),
        onUpdateError: (params) =>
          onUpdateError({ ...params, series: message.series }),
      });
      break;

    case 'cancelupdate':
      db.cancelUpdate(message.series);
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
  }
};

let lastUpdateError: {
  [series in DataSeries]: UpdateErrorState | undefined;
} = {
  words: undefined,
  kanji: undefined,
  radicals: undefined,
  names: undefined,
};

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
