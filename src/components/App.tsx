import { h, Fragment, FunctionalComponent, JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  KanjiResult,
  MajorDataSeries,
  NameResult,
} from '@birchill/hikibiki-data';

import { CombinedDatabaseState } from '../worker-messages';

import { DatabaseStatus } from './DatabaseStatus';
import { KanjiList } from './KanjiList';
import { LanguageSelector } from './LanguageSelector';
import { ReferencesConfig } from './ReferencesConfig';
import { SearchBox } from './SearchBox';
import { useStoredToggleList } from './hooks/useStoredToggleList';

type Props = {
  databaseState: CombinedDatabaseState;
  entries: {
    kanji: Array<KanjiResult>;
    names: Array<NameResult>;
  };
  search?: string;
  onUpdateSearch?: (options: {
    search: string;
    historyMode?: 'replace' | 'push' | 'skip';
  }) => void;
  onUpdateDb?: (params: { series: MajorDataSeries }) => void;
  onCancelDbUpdate?: (params: { series: MajorDataSeries }) => void;
  onSetLang?: (lang: string) => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  // Toggling the kanji database on/off
  const [kanjiEnabled, setKanjiEnabled] = useState(true);
  const toggleKanjiEnabled = useCallback(() => setKanjiEnabled(!kanjiEnabled), [
    kanjiEnabled,
  ]);

  // Toggling the names database on/off
  //
  // TODO: Toggling this on needs to trigger an call to update DB
  const [namesEnabled, setNamesEnabled] = useState(false);
  const toggleNamesEnabled = useCallback(() => setNamesEnabled(!namesEnabled), [
    namesEnabled,
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
          series="kanji"
          state={props.databaseState.kanji}
          secondaryState={{ radicals: props.databaseState.radicals }}
          disabled={!kanjiEnabled}
          onUpdate={props.onUpdateDb}
          onCancel={props.onCancelDbUpdate}
          onToggleActive={toggleKanjiEnabled}
        >
          <ReferencesConfig
            lang={props.databaseState.kanji.version?.lang}
            enabledReferences={enabledReferences}
            enabledLinks={enabledLinks}
            onToggleReference={onToggleReference}
            onToggleLink={onToggleLink}
          />
        </DatabaseStatus>
        {kanjiEnabled ? (
          <KanjiList
            entries={props.entries.kanji}
            lang={props.databaseState.kanji.version?.lang}
            enabledReferences={enabledReferences}
            enabledLinks={enabledLinks}
          />
        ) : null}
      </div>
      <div class="container mx-auto max-w-3xl px-8" onClick={onClick}>
        <DatabaseStatus
          series="names"
          state={props.databaseState.names}
          disabled={!namesEnabled}
          onUpdate={props.onUpdateDb}
          onCancel={props.onCancelDbUpdate}
          onToggleActive={toggleNamesEnabled}
        />
      </div>
      <nav class="mt-12 sm:mt-20 mb-12">
        <LanguageSelector
          lang={props.databaseState.kanji.version?.lang}
          onSetLang={props.onSetLang}
        />
      </nav>
    </Fragment>
  );
};

const isModifiedEvent = (evt: MouseEvent) =>
  !!(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey);
