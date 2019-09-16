import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState, KanjiResult } from '../database';
import { CloneableUpdateState } from '../update-state';

import { DatabaseStatus } from './DatabaseStatus';
import { KanjiList } from './KanjiList';
import { LanguageSelector } from './LanguageSelector';

type Props = {
  databaseState: DatabaseState;
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  updateState: CloneableUpdateState;
  entries: Array<KanjiResult>;
  onUpdateDb?: () => void;
  onCancelDbUpdate?: () => void;
  onDestroyDb?: () => void;
  onSetLang?: (lang: string) => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div>
      <DatabaseStatus
        databaseState={props.databaseState}
        databaseVersions={props.databaseVersions}
        updateState={props.updateState}
        onUpdate={props.onUpdateDb}
        onCancel={props.onCancelDbUpdate}
        onDestroy={props.onDestroyDb}
      />
      <KanjiList entries={props.entries} />
      <LanguageSelector
        databaseVersions={props.databaseVersions}
        onSetLang={props.onSetLang}
      />
    </div>
  );
};
