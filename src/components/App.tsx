import { h, Fragment, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState, KanjiResult } from '../database';
import { CloneableUpdateState } from '../update-state';

import { DatabaseStatus, PanelState } from './DatabaseStatus';
import { KanjiList } from './KanjiList';
import { LanguageSelector } from './LanguageSelector';
import { SearchBox } from './SearchBox';

type Props = {
  databaseState: DatabaseState;
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  updateState: CloneableUpdateState;
  entries: Array<KanjiResult>;
  kanjiPanelState: PanelState;
  search?: string;
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
  onUpdateSearch?: (search: string) => void;
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
  let lang: string | undefined;
  if (props.databaseVersions.kanjidb) {
    lang = props.databaseVersions.kanjidb.lang;
  }

  return (
    <Fragment>
      <header class="bg-white pt-16 pb-32 sm:pb-32">
        <h1 class="text-center text-4xl sm:text-5xl font-bold">Jisho Champ</h1>
      </header>
      <SearchBox search={props.search} onUpdateSearch={props.onUpdateSearch} />
      <div class="container mx-auto max-w-3xl px-8 pb-8">
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
        {props.kanjiPanelState !== PanelState.Disabled ? (
          <KanjiList
            entries={props.entries}
            lang={lang}
            enabledReferences={props.enabledReferences}
            enabledLinks={props.enabledLinks}
          />
        ) : null}
        <LanguageSelector
          databaseVersions={props.databaseVersions}
          onSetLang={props.onSetLang}
        />
      </div>
    </Fragment>
  );
};
