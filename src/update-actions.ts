import { DatabaseVersion } from './common';

export type OfflineUpdateAction = {
  type: 'offline';
};

export type OnlineUpdateAction = {
  type: 'online';
};

export type StartUpdateAction = {
  type: 'startupdate';
};

export type StartDownloadUpdateAction = {
  type: 'startdownload';
  version: DatabaseVersion;
};

export type ProgressUpdateAction = {
  type: 'progress';
  loaded: number;
  total: number | null;
};

export type FinishDownloadUpdateAction = {
  type: 'finishdownload';
  version: DatabaseVersion;
};

export type FinishUpdateAction = {
  type: 'finish';
  checkDate: Date;
};

export type AbortUpdateAction = {
  type: 'abort';
  checkDate: Date | null;
};

export type ErrorUpdateAction = {
  type: 'error';
  error: Error;
};

export type UpdateAction =
  | OfflineUpdateAction
  | OnlineUpdateAction
  | StartUpdateAction
  | StartDownloadUpdateAction
  | ProgressUpdateAction
  | FinishDownloadUpdateAction
  | FinishUpdateAction
  | AbortUpdateAction
  | ErrorUpdateAction;
