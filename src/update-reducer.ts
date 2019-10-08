import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { DownloadError } from './download';

function getRetryIntervalMs(state: UpdateState): number | undefined {
  return typeof (state as any).retryIntervalMs === 'number'
    ? (state as any).retryIntervalMs
    : undefined;
}

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
        retryIntervalMs: getRetryIntervalMs(state),
      };

    case 'startdownload':
      return {
        state: 'downloading',
        dbName: action.dbName,
        downloadVersion: action.version,
        progress: 0,
        lastCheck: state.lastCheck,
        retryIntervalMs: getRetryIntervalMs(state),
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
        retryIntervalMs: getRetryIntervalMs(state),
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
        retryIntervalMs: getRetryIntervalMs(state),
      };

    case 'finish':
      return { state: 'idle', lastCheck: action.checkDate };

    case 'abort':
      return { state: 'idle', lastCheck: action.checkDate || state.lastCheck };

    case 'error': {
      const isNetworkError = action.error instanceof DownloadError;

      let retryIntervalMs: number | undefined;
      let nextRetry: Date | undefined;
      if (isNetworkError) {
        const previousRetryIntervalMs = getRetryIntervalMs(state);
        if (previousRetryIntervalMs) {
          // Don't let the interval become longer than 12 hours
          retryIntervalMs = Math.min(
            previousRetryIntervalMs * 2,
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
