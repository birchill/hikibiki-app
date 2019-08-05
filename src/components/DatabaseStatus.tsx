import { h, FunctionalComponent } from 'preact';

import { DatabaseState } from '../database';
import { UpdateState } from '../update-state';

type Props = {
  databaseState: DatabaseState;
  updateState: UpdateState;
};

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div className="database-status">
      {props.databaseState === DatabaseState.Initializing
        ? 'Initializing...'
        : 'Unknown'}
    </div>
  );
};
