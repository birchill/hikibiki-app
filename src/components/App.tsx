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
  return (
    <Fragment>
      <header class="bg-white pt-8 pb-20 border-b-2 border-gray-500">
        <h1 class="text-center text-5xl font-bold">Jisho Champ</h1>
      </header>
      <nav class="container flex mx-auto max-w-3xl -mt-12 mb-20 px-12">
        <input
          class="flex-grow rounded-l-full bg-gray-200 text-gray-800 font-medium text-xl py-6 px-12 tracking-wide"
          type="search"
          name="q"
          placeholder="Search"
          value={props.search}
          onInput={(evt: InputEvent) => {
            if (props.onUpdateSearch && !evt.isComposing) {
              props.onUpdateSearch(
                (evt.target as HTMLInputElement).value || ''
              );
            }
          }}
        />
        <button class="rounded-r-full bg-orange-700 text-orange-100 hover:text-white pl-6 pr-8">
          <svg class="w-16 h-16" viewBox="0 0 16 16">
            <title>Search</title>
            <use width="16" height="16" href="#search" />
          </svg>
        </button>
      </nav>
      <div class="container mx-auto max-w-3xl">
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
        <KanjiList
          entries={props.entries}
          enabledReferences={props.enabledReferences}
          enabledLinks={props.enabledLinks}
        />
        <LanguageSelector
          databaseVersions={props.databaseVersions}
          onSetLang={props.onSetLang}
        />
      </div>
    </Fragment>
  );
};
