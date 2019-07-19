import { KanjiStore } from './store';
import { DownloadEvent } from './download';
import { UpdateAction } from './update-actions';

export type SyncCallback = (action: UpdateAction) => void;

// Takes a ReadableStream<DownloadEvent> and a database and applies the
// events to the database
export async function sync({
  downloadStream,
  store,
  callback,
}: {
  downloadStream: ReadableStream<DownloadEvent>;
  store: KanjiStore;
  callback: SyncCallback;
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

    switch (value.type) {
      case 'version':
        // XXX If we get a VersionEvent, start a new transaction on both the
        // kanji and version object stores.
        //
        // If it's a partial version, then clear out the whole kanji object
        // store.
        callback({ type: 'startdownload', version: { ...value } });
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
