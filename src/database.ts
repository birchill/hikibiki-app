import { DatabaseVersion } from './common';
import { download } from './download';
import { KanjiStore } from './store';
import { UpdateState, UpdatingUpdateState } from './update-state';
import { UpdateAction } from './update-actions';
import { stripFields } from './utils';
import { sync } from './sync';

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
  updateState: UpdateState = { state: 'initializing', lastCheck: null };
  store: KanjiStore;

  constructor() {
    this.store = new KanjiStore();
  }

  async getDbVersion(): Promise<DatabaseVersion | undefined> {
    const versionDoc = await this.store.dbVersion.get(1);
    if (!versionDoc) {
      return undefined;
    }

    return stripFields(versionDoc, ['id']);
  }

  async update() {
    const dbVersion = await this.getDbVersion();
    const reducer = (action: UpdateAction) => {
      this.updateState = updateReducer(this.updateState, action);
      // TODO: In future this should probably dispatch some event sharing the
      // updated state
    };

    try {
      const downloadStream = await download({
        maxSupportedMajorVersion: 1,
        currentVersion: dbVersion,
      });
      await sync({
        downloadStream,
        store: this.store,
        callback: reducer,
      });
    } catch (e) {
      reducer({ type: 'error', error: e });
    }
  }

  // XXX Check for offline events?
}

function updateReducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'offline':
      return { state: 'offline', lastCheck: state.lastCheck };

    case 'online':
      return { state: 'initializing', lastCheck: state.lastCheck };

    case 'startupdate':
      return { state: 'checking', lastCheck: state.lastCheck };

    case 'startdownload':
      return {
        state: 'updating',
        downloadVersion: action.version,
        progress: 0,
        lastCheck: state.lastCheck,
      };

    case 'progress':
      console.assert(
        state.state === 'updating',
        'Should only get a progress action when we are updating'
      );
      return {
        state: 'updating',
        downloadVersion: (state as UpdatingUpdateState).downloadVersion,
        progress: action.total ? action.loaded / action.total : undefined,
        lastCheck: state.lastCheck,
      };

    case 'finish':
      return { state: 'uptodate', lastCheck: action.checkDate };

    case 'error':
      return {
        state: 'error',
        error: action.error,
        lastCheck: state.lastCheck,
      };
  }
}
