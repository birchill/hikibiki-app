import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState, KanjiResult } from '../database';
import { CloneableUpdateState } from '../update-state';

import { DatabaseStatus, PanelState } from './DatabaseStatus';
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
  kanjiPanelState: PanelState;
  onUpdateDb?: () => void;
  onCancelDbUpdate?: () => void;
  onDestroyDb?: () => void;
  onSetLang?: (lang: string) => void;
  onToggleActive?: () => void;
  onToggleSettings?: () => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div>
      <DatabaseStatus
        databaseState={props.databaseState}
        databaseVersions={props.databaseVersions}
        updateState={props.updateState}
        panelState={props.kanjiPanelState}
        onUpdate={props.onUpdateDb}
        onCancel={props.onCancelDbUpdate}
        onDestroy={props.onDestroyDb}
        onToggleActive={props.onToggleActive}
        onToggleSettings={props.onToggleSettings}
      />
      <KanjiList entries={props.entries} />
      <LanguageSelector
        databaseVersions={props.databaseVersions}
        onSetLang={props.onSetLang}
      />
    </div>
  );
};
