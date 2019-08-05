import { DatabaseVersion } from './common';

export type OfflineAction = {
  type: 'offline';
};

export type OnlineAction = {
  type: 'online';
};

export type StartAction = {
  type: 'start';
};

export type StartDownloadAction = {
  type: 'startdownload';
  version: DatabaseVersion;
};

export type ProgressAction = {
  type: 'progress';
  loaded: number;
  total: number;
};

export type FinishDownloadAction = {
  type: 'finishdownload';
  version: DatabaseVersion;
};

export type FinishAction = {
  type: 'finish';
  checkDate: Date;
};

export type AbortAction = {
  type: 'abort';
  checkDate: Date | null;
};

export type ErrorAction = {
  type: 'error';
  error: Error;
};

export type UpdateAction =
  | OfflineAction
  | OnlineAction
  | StartAction
  | StartDownloadAction
  | ProgressAction
  | FinishDownloadAction
  | FinishAction
  | AbortAction
  | ErrorAction;
