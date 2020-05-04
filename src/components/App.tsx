import { h, Fragment, FunctionalComponent, JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  DatabaseVersion,
  DatabaseState,
  KanjiResult,
  UpdateState,
  UpdateErrorState,
} from '@birchill/hikibiki-data';

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
  updateState: UpdateState;
  updateError?: UpdateErrorState;
  entries: Array<KanjiResult>;
  search?: string;
  onUpdateSearch?: (options: {
    search: string;
    historyMode?: 'replace' | 'push' | 'skip';
  }) => void;
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
      document.title = `${props.search} - hiki Biki`;
    } else {
      document.title = 'hiki Biki';
    }
  }, [props.search]);

  // Handle local links
  const onClick = useCallback(
    (evt: JSX.TargetedEvent<HTMLElement, MouseEvent>) => {
      if (!props.onUpdateSearch) {
        return;
      }

      // Check for a link click
      if (!evt.target || !(evt.target instanceof HTMLAnchorElement)) {
        return;
      }

      // Check for a local link
      if (evt.target.hostname != window.location.hostname) {
        return;
      }

      // Check for normal click
      if (evt.button !== 0 || isModifiedEvent(evt)) {
        return;
      }

      // Check for search parameters
      const href = new URL(evt.target.href);
      const search = href.searchParams.get('q');
      if (!search) {
        return;
      }

      props.onUpdateSearch({ search, historyMode: 'push' });

      evt.preventDefault();
    },
    [props.onUpdateSearch]
  );

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
      <header class="bg-orange-700 text-orange-100 pt-16 pb-16 border-b-4 border-orange-900">
        <svg
          class="mx-auto max-w-full"
          width="25em"
          viewBox="0 0 430 148"
          role="heading"
        >
          <title>hiki Biki</title>
          <use width="430" height="148" href="#header" />
        </svg>
      </header>
      <SearchBox search={props.search} onUpdateSearch={props.onUpdateSearch} />
      <div class="container mx-auto max-w-3xl px-8" onClick={onClick}>
        <DatabaseStatus
          databaseState={props.databaseState}
          databaseVersions={props.databaseVersions}
          updateState={props.updateState}
          updateError={props.updateError}
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

const isModifiedEvent = (evt: MouseEvent) =>
  !!(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey);
