import {
  DatabaseState,
  DataVersion,
  KanjiResult,
  UpdateErrorState,
  UpdateState,
} from '@birchill/hikibiki-data';

export const updateDb = () => ({
  type: 'update',
});

export const forceUpdateDb = () => ({
  type: 'forceupdate',
});

export const cancelDbUpdate = () => ({
  type: 'cancelupdate',
});

export const destroyDb = () => ({
  type: 'destroy',
});

export const rebuildDb = () => ({
  type: 'rebuild',
});

export interface CombinedDatabaseState {
  databaseState: DatabaseState;
  updateState: UpdateState;
  updateError?: UpdateErrorState;
  versions: ResolvedDataVersions;
}

export interface ResolvedDataVersions {
  kanji: DataVersion | null;
  radicals: DataVersion | null;
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
  | ReturnType<typeof rebuildDb>
  | ReturnType<typeof notifyDbStateUpdated>
  | ReturnType<typeof query>
  | ReturnType<typeof notifyQueryResult>
  | ReturnType<typeof setPreferredLang>
  | ReturnType<typeof notifySetPreferredLangResult>;
