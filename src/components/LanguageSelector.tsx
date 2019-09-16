import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DB_LANGUAGES, DB_LANGUAGE_NAMES } from '../db-languages';

type Props = {
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  onSetLang?: (lang: string) => void;
};

export const LanguageSelector: FunctionalComponent<Props> = (props: Props) => {
  const selectedLang = props.databaseVersions.kanjidb
    ? props.databaseVersions.kanjidb.lang
    : 'en';

  return (
    <select
      name="lang"
      class="lang-selector"
      onChange={evt => {
        if (evt && evt.target && props.onSetLang) {
          props.onSetLang((evt.target as HTMLSelectElement).value);
        }
      }}
    >
      {DB_LANGUAGES.map(lang => (
        <option value={lang} selected={lang === selectedLang}>
          {DB_LANGUAGE_NAMES.get(lang)!}
        </option>
      ))}
    </select>
  );
};
