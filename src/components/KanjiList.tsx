import type { FunctionalComponent } from 'preact';
import { KanjiResult } from '@birchill/jpdict-idb';

import { KanjiEntry } from './KanjiEntry';

type Props = {
  entries: Array<KanjiResult>;
  lang?: string;
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
};

export const KanjiList: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="kanji-list">
      {props.entries.map((entry) =>
        KanjiEntry({
          ...entry,
          lang: props.lang,
          enabledReferences: props.enabledReferences,
          enabledLinks: props.enabledLinks,
        })
      )}
    </div>
  );
};
