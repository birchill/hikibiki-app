import { DatabaseVersion } from './common';
import { KanjiStore, KanjiRecord, DatabaseVersionRecord } from './store';
import { DownloadEvent } from './download';
import { UpdateAction } from './update-actions';
import { stripFields } from './utils';

export type UpdateCallback = (action: UpdateAction) => void;

// Since IDB transactions are not tied to Promises properly yet and we can't
// keep a transaction alive while waiting on a stream we are basically forced to
// either:
//
// a) Abandon using transactions and live with the performance penalty of
//    doing so and the possibility of the DB being in an inconsistent state
//    (e.g. saying it is update-to-date with version X but actually having
//    part of version X+1 applied).
//
//    The latter is particularly bad when it comes to full updates since we
//    could delete everything and then only partially apply the new update
//    leaving us with an incomplete database.
//
// b) Abandon using transactions and create a parallel copy of the databases
//    and swap them in when done, thus avoiding at least the possibility of
//    being in an inconsistent state.
//
//    Unfortunately this is basically impossible to do with IndexedDB.
//    IndexedDB 2.0 allows renaming tables but only during version update so
//    we'd have to update the schema every time we do a full update even if the
//    update is only a data update.
//
// c) Accumulate all the data in memory first and then use regular
//    transactions to apply it.
//
// Considering that Dexie's bulkPut() is nearly an order of magnitude faster
// than doing a series of put() operations in a transaction means (c) is very
// attractive.
//
// (See https://jsfiddle.net/birtles/q2tgrh85/3/ for a rough benchmark.)
//
// However, we plan to use this in situations where we are downloading other
// dictionaries in parallel. In that case we'd rather not accumulate all the
// data for multiple dictionaries in memory at once. Ideally we'd like to batch
// changes for full updates, write them to a temporary database, then swap it in
// at the last moment but as described in (b) above that's really awkward with
// IndexedDB. So, for now, we just have to recommend only updating once database
// at a time to limit memory usage.

export async function update({
  downloadStream,
  store,
  callback,
}: {
  downloadStream: ReadableStream<DownloadEvent>;
  store: KanjiStore;
  callback: UpdateCallback;
}) {
  const reader = downloadStream.getReader();

  let recordsToPut: Array<KanjiRecord> = [];
  let recordsToDelete: Array<number> = [];

  let currentVersion: DatabaseVersion | undefined;
  let partialVersion: boolean = false;

  const finishCurrentVersion = async () => {
    if (!currentVersion) {
      return;
    }

    const versionRecord: DatabaseVersionRecord = {
      id: 1,
      ...currentVersion,
    };

    await store.transaction('rw', store.kanji, store.dbVersion, async () => {
      if (!partialVersion) {
        await store.kanji.clear();
      } else {
        await store.kanji.bulkDelete(recordsToDelete);
      }
      await store.kanji.bulkPut(recordsToPut);
      await store.dbVersion.put(versionRecord);
    });

    recordsToPut = [];
    recordsToDelete = [];

    callback({
      type: 'finishdownload',
      version: currentVersion,
    });

    currentVersion = undefined;
    partialVersion = false;
  };

  while (true) {
    let readResult: ReadableStreamReadResult<DownloadEvent>;
    try {
      readResult = await reader.read();
    } catch (e) {
      reader.releaseLock();
      throw e;
    }

    const { done, value } = readResult;

    if (done) {
      await finishCurrentVersion();
      return;
    }

    switch (value.type) {
      case 'version':
        await finishCurrentVersion();

        currentVersion = stripFields(value, ['type', 'partial']);
        partialVersion = value.partial;

        callback({
          type: 'startdownload',
          version: currentVersion,
        });
        break;

      case 'entry':
        {
          const recordToPut: KanjiRecord = {
            ...stripFields(value, ['type']),
            c: value.c.codePointAt(0) as number,
          };
          recordsToPut.push(recordToPut);
        }
        break;

      case 'deletion':
        console.assert(
          partialVersion,
          'Should not get deletion events if we are doing a full update'
        );
        recordsToDelete.push(value.c.codePointAt(0) as number);
        break;

      case 'progress':
        callback(value);
        break;
    }
  }
}
