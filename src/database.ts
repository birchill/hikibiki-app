import { DatabaseVersion, KanjiEntry } from './common';
import { download } from './download';
import { isKanjiEntryLine, isKanjiDeletionLine } from './kanjidb';
import { KanjiStore, KanjiRecord } from './store';
import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { reducer as updateReducer } from './update-reducer';
import { update, cancelUpdate } from './update';
import { stripFields } from './utils';

export const enum DatabaseState {
  // We don't know yet if we have a database or not
  Initializing,
  // No data has been stored yet
  Empty,
  // We have data, but it's not usable
  OutOfDate,
  // We have data and it's usable
  Ok,
}

export class KanjiDatabase {
  state: DatabaseState = DatabaseState.Initializing;
  updateState: UpdateState = { state: 'idle', lastCheck: null };
  store: KanjiStore;
  dbVersion: DatabaseVersion | undefined;

  private readyPromise: Promise<void>;
  private inProgressUpdate: Promise<void> | undefined;

  constructor() {
    this.store = new KanjiStore();

    // Check initial state
    this.readyPromise = this.getDbVersion().then(version => {
      return this.updateDbVersion(version);
    });
  }

  get ready() {
    return this.readyPromise;
  }

  private async getDbVersion(): Promise<DatabaseVersion | undefined> {
    const versionDoc = await this.store.dbVersion.get(1);
    if (!versionDoc) {
      return undefined;
    }

    return stripFields(versionDoc, ['id']);
  }

  private async updateDbVersion(version: DatabaseVersion | undefined) {
    this.dbVersion = version;
    this.state =
      typeof version === 'undefined' ? DatabaseState.Empty : DatabaseState.Ok;
  }

  update(): Promise<void> {
    if (this.inProgressUpdate) {
      return this.inProgressUpdate;
    }

    this.inProgressUpdate = this.doUpdate();
    this.inProgressUpdate.finally(() => {
      this.inProgressUpdate = undefined;
    });

    return this.inProgressUpdate;
  }

  private async doUpdate() {
    let wroteSomething = false;

    const reducer = (action: UpdateAction) => {
      this.updateState = updateReducer(this.updateState, action);
      if (action.type === 'finishdownload') {
        wroteSomething = true;
        this.updateDbVersion(action.version);
      }
    };

    await this.ready;

    // Check if we have been canceled while waiting to become ready
    if (!this.inProgressUpdate) {
      reducer({ type: 'abort', checkDate: null });
      throw new Error('AbortError');
    }

    const checkDate = new Date();

    try {
      reducer({ type: 'start' });

      const downloadStream = await download({
        dbName: 'kanjidb',
        maxSupportedMajorVersion: 1,
        currentVersion: this.dbVersion,
        isEntryLine: isKanjiEntryLine,
        isDeletionLine: isKanjiDeletionLine,
      });

      if (!this.inProgressUpdate) {
        throw new Error('AbortError');
      }

      await update({
        downloadStream,
        store: this.store,
        callback: reducer,
      });

      if (!this.inProgressUpdate) {
        throw new Error('AbortError');
      }

      reducer({ type: 'finish', checkDate });
    } catch (e) {
      if (e.message === 'AbortError') {
        // We should only update the last-check date if we actually made some
        // sort of update.
        reducer({
          type: 'abort',
          checkDate: wroteSomething ? checkDate : null,
        });
      } else {
        reducer({ type: 'error', error: e });
      }
      throw e;
    }
  }

  cancelUpdate(): boolean {
    const hadProgressUpdate = !!this.inProgressUpdate;
    this.inProgressUpdate = undefined;

    cancelUpdate(this.store);

    return hadProgressUpdate;
  }

  async destroy() {
    await this.store.destroy();
    this.store = new KanjiStore();
    this.state = DatabaseState.Empty;
    this.updateState = { state: 'idle', lastCheck: null };
    this.dbVersion = undefined;
  }

  async getKanji(kanji: Array<string>): Promise<Array<KanjiEntry>> {
    await this.ready;

    if (this.state !== DatabaseState.Ok) {
      return [];
    }

    const ids = kanji.map(kanji => kanji.codePointAt(0)!);
    const records = await this.store.kanji.bulkGet(ids);

    return records
      .filter(
        (record: KanjiRecord | undefined) => typeof record !== 'undefined'
      )
      .map((record: KanjiRecord) => ({
        ...record,
        c: String.fromCodePoint(record.c),
      }));
  }

  // XXX Check for offline events?
}
