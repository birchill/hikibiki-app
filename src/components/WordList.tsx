import { h, FunctionalComponent } from 'preact';
import { WordResult } from '@birchill/hikibiki-data';

import { AccentDisplayType } from './WordDisplayConfig';
import { WordEntry } from './WordEntry';

type Props = {
  entries: Array<WordResult>;
  lang?: string;
  accentDisplay: AccentDisplayType;
};

export const WordList: FunctionalComponent<Props> = (props: Props) => {
  if (!props.entries.length) {
    return null;
  }

  return (
    <div class="word-list bg-white rounded-lg border-gray-300 border px-10 sm:px-20 py-10 mb-12">
      {props.entries.map((entry) =>
        WordEntry({
          ...entry,
          lang: props.lang,
          accentDisplay: props.accentDisplay,
        })
      )}
    </div>
  );
};
