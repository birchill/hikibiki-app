import { DatabaseVersion } from './common';
import { download } from './download';
import { KanjiStore } from './store';
import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { reducer as updateReducer } from './update-reducer';
import { update } from './update';
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
    await this.ready;
    const reducer = (action: UpdateAction) => {
      this.updateState = updateReducer(this.updateState, action);
      if (action.type === 'finishdownload') {
        this.updateDbVersion(action.version);
      }
      // TODO: In future this should probably dispatch some event sharing the
      // updated state
    };

    try {
      const checkDate = new Date();
      reducer({ type: 'startupdate' });

      const downloadStream = await download({
        maxSupportedMajorVersion: 1,
        currentVersion: this.dbVersion,
      });
      await update({
        downloadStream,
        store: this.store,
        callback: reducer,
      });

      reducer({ type: 'finish', checkDate });
    } catch (e) {
      reducer({ type: 'error', error: e });
    }
  }

  async destroy() {
    return this.store.destroy();
  }

  // XXX Check for offline events?
}
