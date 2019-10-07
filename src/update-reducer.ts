import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { DownloadError } from './download';

export function reducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'offline':
      return {
        state: 'offline',
        lastCheck: state.lastCheck,
      };

    case 'start':
      return {
        state: 'checking',
        dbName: action.dbName,
        lastCheck: state.lastCheck,
      };

    case 'startdownload':
      return {
        state: 'downloading',
        dbName: action.dbName,
        downloadVersion: action.version,
        progress: 0,
        lastCheck: state.lastCheck,
      };

    case 'progress':
      console.assert(
        state.state === 'downloading',
        'Should only get a progress action when we are downloading'
      );
      if (state.state !== 'downloading') {
        return state;
      }

      return {
        state: 'downloading',
        dbName: state.dbName,
        downloadVersion: state.downloadVersion,
        progress: action.total ? action.loaded / action.total : 0,
        lastCheck: state.lastCheck,
      };

    case 'finishdownload':
      console.assert(
        state.state === 'downloading',
        'Should only get a finishdownload action when we are downloading'
      );
      if (state.state !== 'downloading') {
        return state;
      }

      return {
        state: 'updatingdb',
        dbName: state.dbName,
        downloadVersion: state.downloadVersion,
        lastCheck: state.lastCheck,
      };

    case 'finish':
      return { state: 'idle', lastCheck: action.checkDate };

    case 'abort':
      return { state: 'idle', lastCheck: action.checkDate || state.lastCheck };

    case 'error': {
      const isNetworkError = action.error instanceof DownloadError;

      let retryIntervalMs: number | null = null;
      let nextRetry: Date | null = null;
      if (isNetworkError) {
        if (state.state === 'error' && state.retryIntervalMs) {
          // Don't let the interval become longer than 12 hours
          retryIntervalMs = Math.min(
            state.retryIntervalMs * 2,
            12 * 60 * 60 * 1000
          );
        } else {
          // Randomize the initial interval to somewhere between 3s ~ 6s.
          retryIntervalMs = 3000 + Math.random() * 3000;
        }
        nextRetry = new Date(Date.now() + retryIntervalMs);
      }

      return {
        state: 'error',
        dbName: action.dbName,
        error: action.error,
        lastCheck: state.lastCheck,
        nextRetry,
        retryIntervalMs,
      };
    }
  }
}
