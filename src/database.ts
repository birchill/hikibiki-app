import { DatabaseVersion } from './common';
import { download } from './download';
import { KanjiStore } from './store';
import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { reducer as updateReducer } from './update-reducer';
import { update, cancelUpdate } from './update';
import { stripFields } from './utils';

export const enum DatabaseState {
  // We don't know yet it we have a database or not
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
      // TODO: In future this should probably dispatch some event sharing the
      // updated state
    };

    await this.ready;

    // Check if we have been canceled while waiting to become ready
    if (!this.inProgressUpdate) {
      // TODO: Make sure we notify observers in this case
      reducer({ type: 'abort', checkDate: null });
      throw new Error('AbortError');
    }

    const checkDate = new Date();

    try {
      reducer({ type: 'startupdate' });

      const downloadStream = await download({
        maxSupportedMajorVersion: 1,
        currentVersion: this.dbVersion,
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
    return this.store.destroy();
  }

  // XXX Check for offline events?
}
