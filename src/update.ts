import { KanjiStore } from './store';
import { DownloadEvent } from './download';
import { UpdateAction } from './update-actions';
import { stripFields } from './utils';

export type UpdateCallback = (action: UpdateAction) => void;

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
      return;
    }

    // TODO: Since IDB transactions are not tied to Promises properly yet and we
    // can't keep a transaction alive while waiting on a stream we are basically
    // forced to either:
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
    // b) Create a parallel copy of the databases and swap them in.
    //
    // c) Accumulate all the data in memory first and then use regular
    //    transactions to apply it.
    //
    // d) Some combination of the above. (e.g. do (b) for full updates and (c)
    //    for partial updates.)
    //
    // (d) is probably optimal but does introduce more complexity

    switch (value.type) {
      case 'version':
        // XXX If we get a VersionEvent, start a new transaction on both the
        // kanji and version object stores.
        //
        // If it's a partial version, then clear out the whole kanji object
        // store.
        callback({
          type: 'startdownload',
          version: stripFields(value, ['type', 'partial']),
        });
        break;

      case 'entry':
        // If it's a partial version use add() instead of put().
        break;

      case 'deletion':
        // Assert this is a partial version
        break;

      case 'progress':
        callback(value);
        break;
    }
  }
}
