import { DatabaseVersion } from './common';
import { DatabaseState } from './database';
import { toCloneable, UpdateState } from './update-state';

export const updateDb = () => ({
  type: 'update',
});

export const cancelDbUpdate = () => ({
  type: 'cancelupdate',
});

export const destroyDb = () => ({
  type: 'destroy',
});

export const notifyDbStateUpdated = (state: DatabaseState) => ({
  type: 'dbstateupdated',
  state,
});

export const notifyDbVersionUpdated = (version?: DatabaseVersion) => ({
  type: 'dbversionupdated',
  version,
});

export const notifyUpdateStateUpdated = (state: UpdateState) => ({
  type: 'updatestateupdated',
  state: toCloneable(state),
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof cancelDbUpdate>
  | ReturnType<typeof destroyDb>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof notifyDbVersionUpdated>
  | ReturnType<typeof notifyUpdateStateUpdated>;
