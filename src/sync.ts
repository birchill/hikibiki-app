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
  // If we get a VersionEvent, start a new transaction on both the kanji and
  // version object stores.
  //
  // If it's a partial version, then clear out the whole kanji object store and
  // use add() instead of put().
  //
  // Handle DeleteEvents too
}
