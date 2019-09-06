import { RadicalEntryLine, RadicalDeletionLine } from './bushudb';
import { DatabaseVersion } from './common';
import { DownloadEvent } from './download';
import { KanjiEntryLine, KanjiDeletionLine } from './kanjidb';
import {
  getIdForKanjiRecord,
  getIdForRadicalRecord,
  toKanjiRecord,
  toRadicalRecord,
  DatabaseVersionRecord,
  KanjiStore,
  KanjiRecord,
  RadicalRecord,
} from './store';
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

const inProgressUpdates: Map<
  KanjiStore,
  ReadableStreamDefaultReader<DownloadEvent<any, any>>
> = new Map();

export async function updateKanji(
  options: UpdateOptions<KanjiEntryLine, KanjiDeletionLine>
) {
  return update<KanjiEntryLine, KanjiDeletionLine, KanjiRecord, number>({
    ...options,
    table: options.store.kanji,
    toRecord: toKanjiRecord,
    getId: getIdForKanjiRecord,
    versionId: 1,
  });
}

export async function updateRadicals(
  options: UpdateOptions<RadicalEntryLine, RadicalDeletionLine>
) {
  return update<RadicalEntryLine, RadicalDeletionLine, RadicalRecord, string>({
    ...options,
    table: options.store.bushu,
    toRecord: toRadicalRecord,
    getId: getIdForRadicalRecord,
    versionId: 2,
  });
}

export interface UpdateOptions<EntryLine, DeletionLine> {
  downloadStream: ReadableStream<DownloadEvent<EntryLine, DeletionLine>>;
  store: KanjiStore;
  callback: UpdateCallback;
}

async function update<
  EntryLine extends Omit<object, 'type'>,
  DeletionLine,
  RecordType,
  IdType extends number | string
>({
  downloadStream,
  store,
  table,
  toRecord,
  getId,
  versionId,
  callback,
}: {
  downloadStream: ReadableStream<DownloadEvent<EntryLine, DeletionLine>>;
  store: KanjiStore;
  table: Dexie.Table<RecordType, IdType>;
  toRecord: (e: EntryLine) => RecordType;
  getId: (e: DeletionLine) => IdType;
  versionId: 1 | 2;
  callback: UpdateCallback;
}) {
  if (inProgressUpdates.has(store)) {
    throw new Error('Overlapping calls to update');
  }

  const reader = downloadStream.getReader();

  inProgressUpdates.set(store, reader);

  let recordsToPut: Array<RecordType> = [];
  let recordsToDelete: Array<IdType> = [];

  let currentVersion: DatabaseVersion | undefined;
  let partialVersion: boolean = false;

  const finishCurrentVersion = async () => {
    if (!currentVersion) {
      return;
    }

    callback({
      type: 'finishdownload',
      version: currentVersion,
    });

    const versionRecord: DatabaseVersionRecord = {
      id: versionId,
      ...currentVersion,
    };

    await store.transaction('rw', table, store.dbVersion, async () => {
      if (!partialVersion) {
        await table.clear();
      } else {
        await table.bulkDelete(recordsToDelete);
      }
      await table.bulkPut(recordsToPut);
      await store.dbVersion.put(versionRecord);
    });

    recordsToPut = [];
    recordsToDelete = [];

    currentVersion = undefined;
    partialVersion = false;
  };

  while (true) {
    let readResult: ReadableStreamReadResult<
      DownloadEvent<EntryLine, DeletionLine>
    >;
    try {
      readResult = await reader.read();
    } catch (e) {
      reader.releaseLock();
      inProgressUpdates.delete(store);
      throw e;
    }

    const { done, value } = readResult;

    if (done) {
      if (inProgressUpdates.has(store)) {
        await finishCurrentVersion();
        inProgressUpdates.delete(store);
      }
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
          // The following hack is here until I work out how to fix this
          // properly:
          //
          //   https://stackoverflow.com/questions/57815891/how-to-define-an-object-type-that-does-not-include-a-specific-member
          //
          const recordToPut = toRecord((stripFields(value, [
            'type',
          ]) as any) as EntryLine);
          recordsToPut.push(recordToPut);
        }
        break;

      case 'deletion':
        console.assert(
          partialVersion,
          'Should not get deletion events if we are doing a full update'
        );
        recordsToDelete.push(getId(value));
        break;

      case 'progress':
        callback(value);
        break;
    }
  }
}

export function cancelUpdate(store: KanjiStore): boolean {
  const reader = inProgressUpdates.get(store);
  if (!reader) {
    return false;
  }

  inProgressUpdates.delete(store);
  reader.cancel();
  return true;
}
