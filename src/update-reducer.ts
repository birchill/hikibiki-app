import { UpdateAction } from './update-actions';
import { UpdateState, UpdatingUpdateState } from './update-state';

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
        state.state === 'updating',
        'Should only get a progress action when we are updating'
      );
      return {
        state: 'updating',
        downloadVersion: (state as UpdatingUpdateState).downloadVersion,
        progress: action.total ? action.loaded / action.total : undefined,
        lastCheck: state.lastCheck,
      };

    case 'finishdownload':
      return state;

    case 'finish':
      return { state: 'idle', lastCheck: action.checkDate };

    case 'error':
      return {
        state: 'error',
        error: action.error,
        lastCheck: state.lastCheck,
      };
  }
}
