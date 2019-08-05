import { DatabaseState } from './database';
import { toCloneable, UpdateState } from './update-state';

export const updateDb = () => ({
  type: 'update',
});

export const notifyDbStateUpdated = (state: DatabaseState) => ({
  type: 'dbstateupdated',
  state,
});

export const notifyUpdateStateUpdated = (state: UpdateState) => ({
  type: 'updatestateupdated',
  state: toCloneable(state),
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof notifyUpdateStateUpdated>;
