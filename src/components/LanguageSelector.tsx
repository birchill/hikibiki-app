import type { FunctionalComponent } from 'preact';

import { DB_LANGUAGES, DB_LANGUAGE_NAMES } from '../db-languages';

type Props = {
  lang?: string;
  onSetLang?: (lang: string) => void;
};

export const LanguageSelector: FunctionalComponent<Props> = (props: Props) => {
  const selectedLang = props.lang || 'en';

  return (
    <div class="flex mx-auto justify-center items-center">
      <label for="lang" class="label">
        <svg class="w-16 h-16 mr-6 text-gray-600" viewBox="0 0 16 16">
          <title>Language</title>
          <use width="16" height="16" href="#globe" />
        </svg>
      </label>
      <select
        id="lang"
        name="lang"
        class="bg-white text-gray-800 text-lg cursor-pointer px-6 py-2 border border-gray-600 rounded-lg"
        onChange={(evt) => {
          if (evt && evt.target && props.onSetLang) {
            props.onSetLang((evt.target as HTMLSelectElement).value);
          }
        }}
      >
        {DB_LANGUAGES.map((lang) => (
          <option value={lang} selected={lang === selectedLang}>
            {DB_LANGUAGE_NAMES.get(lang)!}
          </option>
        ))}
      </select>
    </div>
  );
};
