import { h, Fragment, FunctionalComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { DatabaseVersion } from '../common';
import { DatabaseState, KanjiResult } from '../database';
import { CloneableUpdateState } from '../update-state';

import { DatabaseStatus } from './DatabaseStatus';
import { KanjiList } from './KanjiList';
import { LanguageSelector } from './LanguageSelector';
import { SearchBox } from './SearchBox';
import { useStoredToggleList } from './hooks/useStoredToggleList';

type Props = {
  databaseState: DatabaseState;
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  updateState: CloneableUpdateState;
  entries: Array<KanjiResult>;
  search?: string;
  onUpdateSearch?: (search: string) => void;
  onUpdateDb?: () => void;
  onCancelDbUpdate?: () => void;
  onDestroyDb?: () => void;
  onSetLang?: (lang: string) => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  let lang: string | undefined;
  if (props.databaseVersions.kanjidb) {
    lang = props.databaseVersions.kanjidb.lang;
  }

  // Toggling the database on/off
  const [kanjiEnabled, setKanjiEnabled] = useState(true);
  const toggleKanjiEnabled = useCallback(() => setKanjiEnabled(!kanjiEnabled), [
    kanjiEnabled,
  ]);

  // Document title
  useEffect(() => {
    if (props.search) {
      document.title = `${props.search} - Hikibiki`;
    } else {
      document.title = 'Hikibiki';
    }
  }, [props.search]);

  // References and links
  const {
    enabledItems: enabledReferences,
    toggleItem: onToggleReference,
  } = useStoredToggleList({
    key: 'kanji-references',
    initialValues: ['kanken'],
  });
  const {
    enabledItems: enabledLinks,
    toggleItem: onToggleLink,
  } = useStoredToggleList({
    key: 'kanji-links',
    initialValues: ['kanjialive', 'wiktionary'],
  });

  return (
    <Fragment>
      <header class="bg-white pt-16 pb-32 sm:pb-32">
        <h1 class="text-center text-4xl sm:text-5xl font-bold">Hiki Biki</h1>
      </header>
      <SearchBox search={props.search} onUpdateSearch={props.onUpdateSearch} />
      <div class="container mx-auto max-w-3xl px-8">
        <DatabaseStatus
          databaseState={props.databaseState}
          databaseVersions={props.databaseVersions}
          updateState={props.updateState}
          disabled={!kanjiEnabled}
          enabledReferences={enabledReferences}
          enabledLinks={enabledLinks}
          onUpdate={props.onUpdateDb}
          onCancel={props.onCancelDbUpdate}
          onDestroy={props.onDestroyDb}
          onToggleActive={toggleKanjiEnabled}
          onToggleReference={onToggleReference}
          onToggleLink={onToggleLink}
        />
        {kanjiEnabled ? (
          <KanjiList
            entries={props.entries}
            lang={lang}
            enabledReferences={enabledReferences}
            enabledLinks={enabledLinks}
          />
        ) : null}
      </div>
      <nav class="mt-12 sm:mt-20 mb-12">
        <LanguageSelector
          databaseVersions={props.databaseVersions}
          onSetLang={props.onSetLang}
        />
      </nav>
    </Fragment>
  );
};
