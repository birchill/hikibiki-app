import { h, FunctionalComponent } from 'preact';

import { KanjiResult } from '../database';

type Props = {
  entries: Array<KanjiResult>;
};

export const KanjiList: FunctionalComponent<Props> = (props: Props) => {
  return <div class="kanji-list">{props.entries.map(renderEntry)}</div>;
};

function renderEntry(entry: KanjiResult): JSX.Element {
  const commonReadings = [
    ...(entry.r.on ? entry.r.on : []),
    ...(entry.r.kun ? entry.r.kun : []),
  ].join('、');

  return (
    <div class="kanji-entry">
      <div class="kanji" lang="ja">
        {entry.c}
      </div>
      <div class="readings" lang="ja">
        {commonReadings}
      </div>
      <div class="meanings">{entry.m.join(', ')}</div>
      <div class="bushu" lang="ja">
        部首：{entry.rad.b || entry.rad.k}（{entry.rad.na.join('、')}）
      </div>
      <div class="refs">
        <div class="ref">Henshall: {entry.refs.henshall}</div>
        <div class="ref" lang="ja">
          漢検: {renderKanKen(entry.misc.kk)}
        </div>
        {entry.comp ? (
          <div class="ref" lang="ja">
            Components: {entry.comp}
          </div>
        ) : null}
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

function renderKanKen(level: number | undefined): string {
  if (!level) {
    return '—';
  }
  if (level === 15) {
    return '準1級';
  }
  if (level === 25) {
    return '準2級';
  }
  return `${level}級`;
}
