import { h, FunctionalComponent } from 'preact';

import { KanjiResult } from '../database';
import { KanjiEntry } from './KanjiEntry';

type Props = {
  entries: Array<KanjiResult>;
};

export const KanjiList: FunctionalComponent<Props> = (props: Props) => {
  return <div class="kanji-list">{props.entries.map(KanjiEntry)}</div>;
};
