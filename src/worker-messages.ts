import { DatabaseVersion } from './common';
import { DatabaseState, KanjiResult } from './database';
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

export const query = ({ kanji }: { kanji: Array<string> }) => ({
  type: 'query',
  kanji,
});

export const notifyDbStateUpdated = (state: DatabaseState) => ({
  type: 'dbstateupdated',
  state,
});

export const notifyDbVersionsUpdated = (versions: {
  kanjidb?: DatabaseVersion;
  bushudb?: DatabaseVersion;
}) => ({
  type: 'dbversionsupdated',
  versions,
});

export const notifyUpdateStateUpdated = (state: UpdateState) => ({
  type: 'updatestateupdated',
  state: toCloneable(state),
});

export const notifyQueryResult = (results: Array<KanjiResult>) => ({
  type: 'queryresult',
  results,
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof cancelDbUpdate>
  | ReturnType<typeof destroyDb>
  | ReturnType<typeof query>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof notifyDbVersionsUpdated>
  | ReturnType<typeof notifyUpdateStateUpdated>
  | ReturnType<typeof notifyQueryResult>;
