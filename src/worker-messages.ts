import {
  DataSeriesState,
  DataVersion,
  MajorDataSeries,
  UpdateErrorState,
  UpdateState,
} from '@birchill/jpdict-idb';

export const updateDb = ({
  series,
  lang,
}: {
  series: MajorDataSeries;
  lang: string;
}) => ({
  type: 'update' as const,
  series,
  lang,
});

export const cancelDbUpdate = ({ series }: { series: MajorDataSeries }) => ({
  type: 'cancelupdate' as const,
  series,
});

export const destroyDb = () => ({
  type: 'destroy' as const,
});

export const rebuildDb = () => ({
  type: 'rebuild' as const,
});

export interface DataSeriesInfo {
  state: DataSeriesState;
  version: DataVersion | null;
  updateState: UpdateState;
  updateError?: UpdateErrorState;
}

export interface CombinedDatabaseState {
  words: DataSeriesInfo;
  kanji: DataSeriesInfo;
  radicals: DataSeriesInfo;
  names: DataSeriesInfo;
}

export const notifyDbStateUpdated = (state: CombinedDatabaseState) => ({
  type: 'dbstateupdated' as const,
  state,
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof cancelDbUpdate>
  | ReturnType<typeof destroyDb>
  | ReturnType<typeof rebuildDb>
  | ReturnType<typeof notifyDbStateUpdated>;
