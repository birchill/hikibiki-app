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
      <nav class="container mx-auto max-w-3xl -mt-half-input-text-3xl-py-6 mb-20 px-12">
        <input
          class="rounded-full w-full pl-40 pr-12 py-6 bg-gray-200 text-gray-700 placeholder-gray-700 font-medium text-3xl tracking-wide bg-no-repeat"
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
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%208%208%22%20fill%3D%22%23B8B2A7%22%3E%3Cpath%20d%3D%22M7.7%207.7a1%201%200%200%201-1.4%200L5.13%206.56a.5.5%200%200%201%200-.68l.01-.02-.4-.41a3%203%200%201%201%20.7-.7l.4.41.01-.02a.5.5%200%200%201%20.69%200L7.71%206.3a1%201%200%200%201%200%201.42zM3%201a2%202%200%201%200%200%204%202%202%200%200%200%200-4z%22%2F%3E%3C%2Fsvg%3E%0A')",
            backgroundOrigin: 'content-box',
            backgroundPositionX: '-1.5em',
            backgroundPositionY: 'center',
            backgroundSize: '1em 1em',
          }}
        />
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
