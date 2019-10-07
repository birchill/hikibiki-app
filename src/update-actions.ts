import { DatabaseVersion } from './common';

export type OfflineAction = {
  type: 'offline';
};

export type StartAction = {
  type: 'start';
  dbName: 'kanjidb' | 'bushudb';
};

export type StartDownloadAction = {
  type: 'startdownload';
  dbName: 'kanjidb' | 'bushudb';
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
  dbName: 'kanjidb' | 'bushudb';
  error: Error;
};

export type UpdateAction =
  | OfflineAction
  | StartAction
  | StartDownloadAction
  | ProgressAction
  | FinishDownloadAction
  | FinishAction
  | AbortAction
  | ErrorAction;
