import { h, FunctionalComponent } from 'preact';

import { KanjiResult } from '../database';
import { KanjiEntry } from './KanjiEntry';

type Props = {
  entries: Array<KanjiResult>;
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
};

export const KanjiList: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="kanji-list">
      {props.entries.map(entry =>
        KanjiEntry({
          ...entry,
          enabledReferences: props.enabledReferences,
          enabledLinks: props.enabledLinks,
        })
      )}
    </div>
  );
};
