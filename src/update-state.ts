import { DatabaseVersion } from './common';
import { DownloadError } from './download';

// We are offline so we don't know if we are up-to-date or not.
// - The `lastCheck` value specifies when were last able to check for updates.
export type OfflineUpdateState = {
  state: 'offline';
  lastCheck: Date | null;
};

// Last time we checked, if ever, we were up-to-date.
// - The `lastCheck` value specifies when we last checked.
export type IdleUpdateState = {
  state: 'idle';
  lastCheck: Date | null;
};

// We are still downloading the version metadata so we don't know yet whether
// or not we are up-to-date.
export type CheckingUpdateState = {
  state: 'checking';
  dbName: 'kanjidb' | 'bushudb';
  lastCheck: Date | null;
};

// Downloading an update.
// - The `downloadVersion` value specifies the version we are currently
//   downloading.
// - The `progress` value specifies how far we are through the update.
export type DownloadingUpdateState = {
  state: 'downloading';
  dbName: 'kanjidb' | 'bushudb';
  downloadVersion: DatabaseVersion;
  progress: number;
  lastCheck: Date | null;
};

// Downloading has finished and we are now applying an update to the local
// database.
export type UpdatingDbUpdateState = {
  state: 'updatingdb';
  dbName: 'kanjidb' | 'bushudb';
  downloadVersion: DatabaseVersion;
  lastCheck: Date | null;
};

// Encountered an error on the previous attempt to update.
export type ErrorUpdateState = {
  state: 'error';
  dbName: 'kanjidb' | 'bushudb';
  error: Error;
  lastCheck: Date | null;
  // The following are only set if the error was a network-related error.
  nextRetry: Date | null;
  retryIntervalMs: number | null;
};

export type UpdateState =
  | OfflineUpdateState
  | IdleUpdateState
  | CheckingUpdateState
  | DownloadingUpdateState
  | UpdatingDbUpdateState
  | ErrorUpdateState;

// Error objects can't be cloned so we provide a variation that is suitable for
// postMessaging.

export type CloneableErrorUpdateState = {
  state: 'error';
  dbName: 'kanjidb' | 'bushudb';
  error: {
    name: string;
    message: string;
    code?: number;
  };
  lastCheck: Date | null;
  nextRetry: Date | null;
  retryIntervalMs: number | null;
};

export type CloneableUpdateState =
  | OfflineUpdateState
  | IdleUpdateState
  | CheckingUpdateState
  | DownloadingUpdateState
  | UpdatingDbUpdateState
  | CloneableErrorUpdateState;

// Turn the object into something we can postMessage
export const toCloneable = (state: UpdateState): CloneableUpdateState => {
  if (state.state === 'error') {
    return {
      ...state,
      error: {
        name: state.error.name,
        message: state.error.message,
        code:
          state.error instanceof DownloadError ? state.error.code : undefined,
      },
    };
  }

  return state;
};
