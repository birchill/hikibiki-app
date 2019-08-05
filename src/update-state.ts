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

// We have started the download process yet but we don't know yet whether
// or not we are up-to-date.
export type CheckingUpdateState = {
  state: 'checking';
  lastCheck: Date | null;
};

// Downloading / applying an update.
// - The `downloadVersion` value specifies the version we are currently
//   downloading.
// - The `progress` value specifies how far we are through the update.
export type UpdatingUpdateState = {
  state: 'updating';
  downloadVersion: DatabaseVersion | undefined;
  progress: number;
  lastCheck: Date | null;
};

// Encountered an error on the previous attempt to update.
export type ErrorUpdateState = {
  state: 'error';
  error: Error;
  lastCheck: Date | null;
};

export type UpdateState =
  | OfflineUpdateState
  | IdleUpdateState
  | CheckingUpdateState
  | UpdatingUpdateState
  | ErrorUpdateState;

// Error objects can't be cloned so we provide a variation that is suitable for
// postMessaging.

export type CloneableErrorUpdateState = {
  state: 'error';
  error: {
    name: string;
    message: string;
    code?: number;
  };
  lastCheck: Date | null;
};

export type CloneableUpdateState =
  | OfflineUpdateState
  | IdleUpdateState
  | CheckingUpdateState
  | UpdatingUpdateState
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
