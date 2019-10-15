import {
  DatabaseState,
  DatabaseVersion,
  KanjiResult,
  UpdateState,
} from '@birchill/hikibiki-data';

export const updateDb = () => ({
  type: 'update',
});

export const cancelDbUpdate = () => ({
  type: 'cancelupdate',
});

export const destroyDb = () => ({
  type: 'destroy',
});

export interface CombinedDatabaseState {
  databaseState: DatabaseState;
  updateState: UpdateState;
  versions: ResolvedDbVersions;
}

export interface ResolvedDbVersions {
  kanjidb: DatabaseVersion | null;
  bushudb: DatabaseVersion | null;
}

export const notifyDbStateUpdated = (state: CombinedDatabaseState) => ({
  type: 'dbstateupdated',
  state,
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
  | ReturnType<typeof query>
  | ReturnType<typeof notifyQueryResult>
  | ReturnType<typeof setPreferredLang>
  | ReturnType<typeof notifySetPreferredLangResult>;
