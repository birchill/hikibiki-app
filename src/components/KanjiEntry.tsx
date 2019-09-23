import { h, FunctionalComponent, JSX } from 'preact';

import { KanjiResult } from '../database';

interface Props extends KanjiResult {}

export const KanjiEntry: FunctionalComponent<Props> = (props: Props) => {
  const commonReadings = [
    ...(props.r.on ? props.r.on : []),
    ...(props.r.kun ? props.r.kun : []),
  ].join('、');

  return (
    <div class="kanji-entry bg-white rounded-lg border-gray-200 border px-10 py-10 mb-12 max-w-3xl mx-auto leading-normal">
      <div class="top-part flex mb-6">
        <div class="mr-10 text-superxl leading-none" lang="ja">
          {props.c}
        </div>
        <div class="components">{props.comp.map(renderComponent)}</div>
      </div>
      <div class="readings" lang="ja">
        {commonReadings}
      </div>
      {renderMeanings(props)}
      <div class="bushu" lang="ja">
        部首：{renderRadical(props.rad)}
      </div>
      <div class="refs">
        <div class="ref">Henshall: {props.refs.henshall}</div>
        <div class="ref" lang="ja">
          漢検: {renderKanKen(props.misc.kk)}
        </div>
      </div>
      <a
        href={`https://app.kanjialive.com/${encodeURIComponent(props.c)}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        Kanji alive
      </a>
    </div>
  );
};

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
    <div class="component font-light">
      <span class="char" lang="ja">
        {comp.c}
      </span>{' '}
      <span class="reading text-sm" lang="ja">
        {comp.na[0] || '-'}
      </span>
      <span
        class="meaning text-sm"
        lang={comp.m_lang !== 'en' ? comp.m_lang : undefined}
      >
        {comp.m[0] || '-'}
      </span>
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
