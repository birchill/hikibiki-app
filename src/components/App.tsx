import { h, Fragment, FunctionalComponent, JSX } from 'preact';
import { useCallback, useEffect } from 'preact/hooks';
import {
  KanjiResult,
  MajorDataSeries,
  NameResult,
  WordResult,
} from '@birchill/hikibiki-data';

import { CombinedDatabaseState } from '../worker-messages';

import { DatabaseStatus } from './DatabaseStatus';
import { KanjiList } from './KanjiList';
import { NameList } from './NameList';
import { LanguageSelector } from './LanguageSelector';
import { ReferencesConfig } from './ReferencesConfig';
import { SearchBox } from './SearchBox';
import { useStoredToggleList } from './hooks/useStoredToggleList';
import { WordList } from './WordList';

type Props = {
  databaseState: CombinedDatabaseState;
  enabledSeries: Set<MajorDataSeries>;
  lang: string;
  entries: {
    words: Array<WordResult>;
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
  onSetLang: (lang: string) => void;
  onToggleSeries: (params: {
    series: MajorDataSeries;
    enabled: boolean;
  }) => void;
};

export const App: FunctionalComponent<Props> = (props: Props) => {
  // Toggle the words database on/off
  const wordsEnabled = props.enabledSeries.has('words');
  const toggleWordsEnabled = useCallback(
    () => props.onToggleSeries({ series: 'words', enabled: !wordsEnabled }),
    [wordsEnabled, props.onToggleSeries]
  );

  // Toggle the kanji database on/off
  const kanjiEnabled = props.enabledSeries.has('kanji');
  const toggleKanjiEnabled = useCallback(
    () => props.onToggleSeries({ series: 'kanji', enabled: !kanjiEnabled }),
    [kanjiEnabled, props.onToggleSeries]
  );

  // Toggling the names database on/off
  const namesEnabled = props.enabledSeries.has('names');
  const toggleNamesEnabled = useCallback(
    () => props.onToggleSeries({ series: 'names', enabled: !namesEnabled }),
    [namesEnabled, props.onToggleSeries]
  );

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
          series="words"
          dataState={{
            names: props.databaseState.words,
          }}
          disabled={!wordsEnabled}
          onUpdate={props.onUpdateDb}
          onCancel={props.onCancelDbUpdate}
          onToggleActive={toggleWordsEnabled}
        />
        {wordsEnabled ? (
          <WordList
            entries={props.entries.words}
            lang={props.databaseState.words.version?.lang}
          />
        ) : null}
      </div>
      <div class="container mx-auto max-w-3xl px-8" onClick={onClick}>
        <DatabaseStatus
          series="kanji"
          dataState={{
            kanji: props.databaseState.kanji,
            radicals: props.databaseState.radicals,
          }}
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
          dataState={{
            names: props.databaseState.names,
          }}
          disabled={!namesEnabled}
          onUpdate={props.onUpdateDb}
          onCancel={props.onCancelDbUpdate}
          onToggleActive={toggleNamesEnabled}
        />
        {namesEnabled ? (
          <NameList
            entries={props.entries.names}
            lang={props.databaseState.names.version?.lang}
          />
        ) : null}
      </div>
      <nav class="mt-12 sm:mt-20 mb-12">
        <LanguageSelector lang={props.lang} onSetLang={props.onSetLang} />
      </nav>
    </Fragment>
  );
};

const isModifiedEvent = (evt: MouseEvent) =>
  !!(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey);
