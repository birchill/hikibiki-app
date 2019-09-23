import { h, Fragment, FunctionalComponent } from 'preact';

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
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
  onUpdateDb?: () => void;
  onCancelDbUpdate?: () => void;
  onDestroyDb?: () => void;
  onSetLang?: (lang: string) => void;
  onToggleActive?: () => void;
  onToggleSettings?: () => void;
  onToggleReference?: (ref: string, state: boolean) => void;
  onToggleLink?: (ref: string, state: boolean) => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  return (
    <Fragment>
      <DatabaseStatus
        databaseState={props.databaseState}
        databaseVersions={props.databaseVersions}
        updateState={props.updateState}
        panelState={props.kanjiPanelState}
        enabledReferences={props.enabledReferences}
        enabledLinks={props.enabledLinks}
        onUpdate={props.onUpdateDb}
        onCancel={props.onCancelDbUpdate}
        onDestroy={props.onDestroyDb}
        onToggleActive={props.onToggleActive}
        onToggleSettings={props.onToggleSettings}
        onToggleReference={props.onToggleReference}
        onToggleLink={props.onToggleLink}
      />
      <KanjiList entries={props.entries} />
      <LanguageSelector
        databaseVersions={props.databaseVersions}
        onSetLang={props.onSetLang}
      />
    </Fragment>
  );
};
