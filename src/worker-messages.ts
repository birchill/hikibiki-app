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

export const notifyDbStateUpdated = (state: DatabaseState) => ({
  type: 'dbstateupdated',
  state,
});

export interface ResolvedDbVersions {
  kanjidb: DatabaseVersion | null;
  bushudb: DatabaseVersion | null;
}

export const notifyDbVersionsUpdated = (versions: ResolvedDbVersions) => ({
  type: 'dbversionsupdated',
  versions,
});

export const notifyUpdateStateUpdated = (state: UpdateState) => ({
  type: 'updatestateupdated',
  state: toCloneable(state),
});

export const query = ({ kanji }: { kanji: Array<string> }) => ({
  type: 'query',
  kanji,
});

export const notifyQueryResult = (results: Array<KanjiResult>) => ({
  type: 'queryresult',
  results,
});

export const setPreferredLang = ({ lang }: { lang: string | null }) => ({
  type: 'setpreferredlang',
  lang,
});

export const notifySetPreferredLangResult = ({
  ok,
  lang,
}: {
  ok: boolean;
  lang: string | null;
}) => ({
  type: 'setpreferredlangresult',
  ok,
  lang,
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof cancelDbUpdate>
  | ReturnType<typeof destroyDb>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof notifyDbVersionsUpdated>
  | ReturnType<typeof notifyUpdateStateUpdated>
  | ReturnType<typeof query>
  | ReturnType<typeof notifyQueryResult>
  | ReturnType<typeof setPreferredLang>
  | ReturnType<typeof notifySetPreferredLangResult>;
