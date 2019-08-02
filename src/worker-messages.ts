import { DatabaseState } from './database';
import { CloneableUpdateState } from './update-state';

export const updateDb = () => ({
  type: 'update',
});

export const notifyDbStateUpdated = (state: DatabaseState) => ({
  type: 'dbstateupdated',
  state,
});

export const notifyUpdateStateUpdated = (state: CloneableUpdateState) => ({
  type: 'updatestateupdated',
  state,
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof notifyUpdateStateUpdated>;
