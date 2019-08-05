import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';

export function reducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'offline':
      return { state: 'offline', lastCheck: state.lastCheck };

    case 'online':
      return { state: 'idle', lastCheck: state.lastCheck };

    case 'start':
      return { state: 'checking', lastCheck: state.lastCheck };

    case 'startdownload':
      return {
        state: 'downloading',
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
        downloadVersion: state.downloadVersion,
        lastCheck: state.lastCheck,
      };

    case 'finish':
      return { state: 'idle', lastCheck: action.checkDate };

    case 'abort':
      return { state: 'idle', lastCheck: action.checkDate || state.lastCheck };

    case 'error':
      return {
        state: 'error',
        error: action.error,
        lastCheck: state.lastCheck,
      };
  }
}
