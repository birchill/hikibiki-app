import { isRadicalEntryLine, isRadicalDeletionLine } from './bushudb';
import { DatabaseVersion } from './common';
import { download } from './download';
import {
  KanjiEntryLine,
  isKanjiEntryLine,
  isKanjiDeletionLine,
} from './kanjidb';
import { KanjiStore, KanjiRecord } from './store';
import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { reducer as updateReducer } from './update-reducer';
import {
  cancelUpdate,
  updateKanji,
  updateRadicals,
  UpdateOptions,
} from './update';
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
  dbVersions: {
    kanjidb: DatabaseVersion | undefined;
    bushudb: DatabaseVersion | undefined;
  } = { kanjidb: undefined, bushudb: undefined };

  private readyPromise: Promise<any>;
  private inProgressUpdate: Promise<void> | undefined;

  constructor() {
    this.store = new KanjiStore();

    // Check initial state
    const getKanjiDbVersion = this.getDbVersion('kanjidb').then(version =>
      this.updateDbVersion('kanjidb', version)
    );
    const getRadicalDbVersion = this.getDbVersion('bushudb').then(version =>
      this.updateDbVersion('bushudb', version)
    );

    this.readyPromise = Promise.all([getKanjiDbVersion, getRadicalDbVersion]);
  }

  get ready() {
    return this.readyPromise;
  }

  private async getDbVersion(
    db: 'kanjidb' | 'bushudb'
  ): Promise<DatabaseVersion | undefined> {
    const versionDoc = await this.store.dbVersion.get(db === 'kanjidb' ? 1 : 2);
    if (!versionDoc) {
      return undefined;
    }

    return stripFields(versionDoc, ['id']);
  }

  private async updateDbVersion(
    db: 'kanjidb' | 'bushudb',
    version: DatabaseVersion | undefined
  ) {
    this.dbVersions[db] = version;
    this.state =
      typeof this.dbVersions.kanjidb === 'undefined' ||
      typeof this.dbVersions.bushudb === 'undefined'
        ? DatabaseState.Empty
        : DatabaseState.Ok;
  }

  async update() {
    if (this.inProgressUpdate) {
      return this.inProgressUpdate;
    }

    try {
      this.inProgressUpdate = this.doUpdate({
        dbName: 'kanjidb',
        isEntryLine: isKanjiEntryLine,
        isDeletionLine: isKanjiDeletionLine,
        update: updateKanji,
      });
      await this.inProgressUpdate;
    } finally {
      this.inProgressUpdate = undefined;
    }

    try {
      this.inProgressUpdate = this.doUpdate({
        dbName: 'bushudb',
        isEntryLine: isRadicalEntryLine,
        isDeletionLine: isRadicalDeletionLine,
        update: updateRadicals,
      });
      await this.inProgressUpdate;
    } finally {
      this.inProgressUpdate = undefined;
    }
  }

  private async doUpdate<EntryLine, DeletionLine>({
    dbName,
    isEntryLine,
    isDeletionLine,
    update,
  }: {
    dbName: 'bushudb' | 'kanjidb';
    isEntryLine: (a: any) => a is EntryLine;
    isDeletionLine: (a: any) => a is DeletionLine;
    update: (options: UpdateOptions<EntryLine, DeletionLine>) => Promise<void>;
  }) {
    let wroteSomething = false;

    const reducer = (action: UpdateAction) => {
      this.updateState = updateReducer(this.updateState, action);
      if (action.type === 'finishdownload') {
        wroteSomething = true;
        this.updateDbVersion(dbName, action.version);
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
        dbName,
        maxSupportedMajorVersion: 1,
        currentVersion: this.dbVersions[dbName],
        isEntryLine,
        isDeletionLine,
      });

      if (!this.inProgressUpdate) {
        throw new Error('AbortError');
      }

      await update({ downloadStream, store: this.store, callback: reducer });

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
    this.dbVersions = { kanjidb: undefined, bushudb: undefined };
  }

  async getKanji(kanji: Array<string>): Promise<Array<KanjiResult>> {
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

export interface KanjiResult extends KanjiEntryLine {}
