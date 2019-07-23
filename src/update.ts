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
