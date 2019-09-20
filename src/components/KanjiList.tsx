import { h, FunctionalComponent, JSX } from 'preact';

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
      {renderMeanings(entry)}
      <div class="bushu" lang="ja">
        部首：{renderRadical(entry.rad)}
      </div>
      {entry.comp.length ? (
        <div class="components">{entry.comp.map(renderComponent)}</div>
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

function renderMeanings(entry: KanjiResult, lang?: string): JSX.Element {
  return (
    <div
      class="meanings"
      lang={entry.m_lang !== 'en' ? entry.m_lang : undefined}
    >
      {entry.m.join(', ')}
    </div>
  );
}

function renderRadical(rad: KanjiResult['rad']): JSX.Element {
  let base: JSX.Element | null = null;
  if (rad.base && (rad.b || rad.k) !== (rad.base.b || rad.base.k)) {
    base = (
      <span lang="ja">
        {rad.base.b || rad.base.k}（{rad.base.na.join(`、`)}）
      </span>
    );
  }

  return (
    <span>
      <span lang="ja">{rad.b || rad.k}</span>（
      <span lang="ja">{rad.na.join('、')}</span>,{' '}
      <span lang={rad.m_lang !== 'en' ? rad.m_lang : undefined}>
        {rad.m.join(', ')}
      </span>
      ）
      {base ? (
        <span>
          {' from '}
          {base}
        </span>
      ) : null}
    </span>
  );
}

function renderComponent(comp: KanjiResult['comp'][0]): JSX.Element {
  return (
    <span class="component">
      <span class="char" lang="ja">
        {comp.c}
      </span>{' '}
      (
      <span class="reading" lang="ja">
        {comp.na[0] || '-'}
      </span>
      ,{' '}
      <span
        class="meaning"
        lang={comp.m_lang !== 'en' ? comp.m_lang : undefined}
      >
        {comp.m[0] || '-'}
      </span>
      )
    </span>
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
