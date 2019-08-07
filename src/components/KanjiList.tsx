import { h, FunctionalComponent } from 'preact';

import { KanjiEntry } from '../common';

type Props = {
  entries: Array<KanjiEntry>;
};

export const KanjiList: FunctionalComponent<Props> = (props: Props) => {
  return <div class="kanji-list">{props.entries.map(renderEntry)}</div>;
};

function renderEntry(entry: KanjiEntry): JSX.Element {
  const commonReadings = [
    ...(entry.r.on ? entry.r.on : []),
    ...(entry.r.kun ? entry.r.kun : []),
  ].join('、');

  return (
    <div class="kanji-entry">
      <div class="kanji">{entry.c}</div>
      <div class="meanings">{entry.m.join(', ')}</div>
      <div class="readings">{commonReadings}</div>
      <div class="refs">
        <div class="ref">Henshall: {entry.refs.henshall}</div>
      </div>
      <a
        href={`https://app.kanjialive.com/${encodeURIComponent(entry.c)}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        Kanji alive
      </a>
    </div>
  );
}
