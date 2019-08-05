import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';

export function reducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'offline':
      return { state: 'offline', lastCheck: state.lastCheck };

    case 'online':
      return { state: 'idle', lastCheck: state.lastCheck };

    case 'startupdate':
      return { state: 'checking', lastCheck: state.lastCheck };

    case 'startdownload':
      return {
        state: 'updating',
        downloadVersion: action.version,
        progress: 0,
        lastCheck: state.lastCheck,
      };

    case 'progress':
      console.assert(
        state.state === 'updating' || state.state === 'checking',
        'Should only get a progress action when we are updating or checking'
      );

      // We don't bother reporting progress while we are downloading the version
      // file.
      if (state.state !== 'updating') {
        return state;
      }

      return {
        state: 'updating',
        downloadVersion: state.downloadVersion,
        progress: action.total ? action.loaded / action.total : 0,
        lastCheck: state.lastCheck,
      };

    case 'finishdownload':
      return state;

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
