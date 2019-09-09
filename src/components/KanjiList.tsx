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
        部首：{renderRadical(entry.rad)}
      </div>
      {entry.comp.length ? (
        <div class="components">
          {entry.comp.map(comp => {
            return (
              <span class="component">
                <span class="char" lang="ja">
                  {comp.c}
                </span>{' '}
                (
                <span class="reading" lang="ja">
                  {comp.na[0] || '-'}
                </span>
                , <span class="meaning">{comp.m[0] || '-'}</span>)
              </span>
            );
          })}
        </div>
      ) : null}
      <div class="refs">
        <div class="ref">Henshall: {entry.refs.henshall}</div>
        <div class="ref" lang="ja">
          漢検: {renderKanKen(entry.misc.kk)}
        </div>
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

function renderRadical(rad: KanjiResult['rad']): string {
  let result = `${rad.b || rad.k}（${rad.na.join('、')}, ${rad.m.join(',')}）`;
  if (rad.base && (rad.b || rad.k) !== (rad.base.b || rad.base.k)) {
    // TODO: We should really wrap the following in a span (and mark "from" as
    // being English)
    result += ` from ${rad.base.b || rad.base.k}（${rad.base.na.join(`、`)}）`;
  }
  return result;
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
