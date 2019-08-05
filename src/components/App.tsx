import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState } from '../database';
import { CloneableUpdateState } from '../update-state';
import { DatabaseStatus } from './DatabaseStatus';

type Props = {
  databaseState: DatabaseState;
  databaseVersion?: DatabaseVersion;
  updateState: CloneableUpdateState;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  return (
    <DatabaseStatus
      databaseState={props.databaseState}
      databaseVersion={props.databaseVersion}
      updateState={props.updateState}
    />
  );
};
