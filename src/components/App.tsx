import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion, KanjiEntry } from '../common';
import { DatabaseState } from '../database';
import { CloneableUpdateState } from '../update-state';

import { DatabaseStatus } from './DatabaseStatus';
import { KanjiList } from './KanjiList';

type Props = {
  databaseState: DatabaseState;
  databaseVersion?: DatabaseVersion;
  updateState: CloneableUpdateState;
  entries: Array<KanjiEntry>;
  onUpdateDb?: () => void;
  onCancelDbUpdate?: () => void;
  onDestroyDb?: () => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div>
      <KanjiList entries={props.entries} />
      <DatabaseStatus
        databaseState={props.databaseState}
        databaseVersion={props.databaseVersion}
        updateState={props.updateState}
        onUpdate={props.onUpdateDb}
        onCancel={props.onCancelDbUpdate}
        onDestroy={props.onDestroyDb}
      />
    </div>
  );
};
