import { DatabaseVersion } from './common';

// We have yet to try to check for updates so we don't know if we're
// up-to-date or not. We may be waiting for a suitable time to check.
export type InitializingUpdateState = {
  state: 'initializing';
  lastCheck: Date | null;
};

// We are offline so we don't know if we are up-to-date or not.
// - The `lastCheck` value specifies when were last able to check for updates.
export type OfflineUpdateState = {
  state: 'offline';
  lastCheck: Date | null;
};

// Last time we checked, we were up-to-date.
// - The `lastCheck` value specifies when we last checked.
export type UpToDateUpdateState = {
  state: 'uptodate';
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
  progress: number | undefined;
  lastCheck: Date | null;
};

// Encountered an error on the previous attempt to update.
export type ErrorUpdateState = {
  state: 'error';
  error: Error;
  lastCheck: Date | null;
};

export type UpdateState =
  | InitializingUpdateState
  | OfflineUpdateState
  | UpToDateUpdateState
  | CheckingUpdateState
  | UpdatingUpdateState
  | ErrorUpdateState;
