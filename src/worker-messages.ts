import {
  DataSeriesState,
  DataVersion,
  MajorDataSeries,
  UpdateErrorState,
  UpdateState,
} from '@birchill/hikibiki-data';

export const updateDb = ({
  series,
  lang,
}: {
  series: MajorDataSeries;
  lang: string;
}) => ({
  type: 'update',
  series,
  lang,
});

export const forceUpdateDb = ({
  series,
  lang,
}: {
  series: MajorDataSeries;
  lang: string;
}) => ({
  type: 'forceupdate',
  series,
  lang,
});

export const cancelDbUpdate = ({ series }: { series: MajorDataSeries }) => ({
  type: 'cancelupdate',
  series,
});

export const destroyDb = () => ({
  type: 'destroy',
});

export const rebuildDb = () => ({
  type: 'rebuild',
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
  type: 'dbstateupdated',
  state,
});

export type WorkerMessage =
  | ReturnType<typeof updateDb>
  | ReturnType<typeof cancelDbUpdate>
  | ReturnType<typeof destroyDb>
  | ReturnType<typeof rebuildDb>
  | ReturnType<typeof notifyDbStateUpdated>;
