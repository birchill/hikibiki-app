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
        {renderComponents(props)}
      </div>
      <div class="readings text-lg" lang="ja">
        {commonReadings}
      </div>
      <div
        class="meanings text-lg text-gray-500 text-light mb-8"
        lang={props.m_lang !== 'en' ? props.m_lang : undefined}
      >
        {props.m.join(', ')}
      </div>
      <div class="stats flex mb-8">
        <div class="strokes flex-grow flex items-center">
          <svg
            class="inline-block mr-8 w-10 h-10 text-gray-300"
            viewBox="0 0 16 16"
          >
            <title>Stroke count</title>
            <use width="16" height="16" href="#brush" />
          </svg>
          <span>
            {props.misc.sc}
            {props.misc.sc === 1 ? ' stroke' : ' strokes'}
          </span>
        </div>
        <div class="popularity flex-grow flex items-center">
          <svg
            class="inline-block mr-8 w-10 h-10 text-gray-300 fill-current"
            viewBox="0 0 8 8"
          >
            <title>Popularity</title>
            <rect
              x="0"
              y="5"
              width="2"
              height="3"
              rx="0.5"
              ry="0.5"
              class={props.misc.freq ? 'text-black' : undefined}
            />
            <rect
              x="3"
              y="3"
              width="2"
              height="5"
              rx="0.5"
              ry="0.5"
              class={
                props.misc.freq && props.misc.freq < (2500 * 2) / 3
                  ? 'text-black'
                  : undefined
              }
            />
            <rect
              x="6"
              y="0"
              width="2"
              height="8"
              rx="0.5"
              ry="0.5"
              class={
                props.misc.freq && props.misc.freq < 2500 / 3
                  ? 'text-black'
                  : undefined
              }
            />
          </svg>
          <span>
            {props.misc.freq || '-'}
            <span class="text-sm"> / 2,500</span>
          </span>
        </div>
        <div class="grade flex-grow flex items-center">
          <svg
            class="inline-block mr-8 w-10 h-10 text-gray-300"
            viewBox="0 0 16 16"
          >
            <title>Grade</title>
            <use width="16" height="16" href="#user" />
          </svg>
          <span>Grade {props.misc.gr || '-'}</span>
        </div>
      </div>
      <div class="refs flex mb-2">
        <svg
          class="w-10 h-10 flex-shrink-0 text-gray-300 mr-8 mt-3"
          viewBox="0 0 16 16"
        >
          <use width="16" height="16" href="#book" />
        </svg>
        <div class="flex-grow">
          <div class="inline-block rounded-full px-8 py-3 pr-10 mb-4 mr-4 bg-blue-100 font-medium text-blue-800">
            Henshall {props.refs.henshall}
          </div>
          <div
            class="inline-block rounded-full px-8 py-3 pr-10 mb-4 mr-4 bg-blue-100 font-medium text-blue-800"
            lang="ja"
          >
            漢検 {renderKanKen(props.misc.kk)}
          </div>
        </div>
      </div>
      <div class="links flex -mb-4">
        <svg
          class="w-10 h-10 flex-shrink-0 text-gray-300 mr-8 mt-3"
          viewBox="0 0 16 16"
        >
          <use width="16" height="16" href="#link" />
        </svg>
        <div class="flex-grow">
          <a
            class="inline-block rounded-full px-8 py-3 pr-10 mb-4 mr-4 bg-green-100 font-medium text-green-800 underline"
            href={`https://app.kanjialive.com/${encodeURIComponent(props.c)}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Kanji alive
          </a>
        </div>
      </div>
    </div>
  );
};

function renderComponents(props: Props): JSX.Element {
  const { rad } = props;

  let base: JSX.Element | null = null;
  if (rad.base) {
    base = (
      <span>
        {' from '}
        <span lang="ja">
          {rad.base.b || rad.base.k}（{rad.base.na.join(`、`)}）
        </span>
      </span>
    );
  }

  const radicalRow = (
    <tbody>
      <tr class="component radical" title="Radical for this kanji">
        <td class="px-8 rounded-l bg-gray-100" lang="ja">
          {rad.b || rad.k}
        </td>
        <td class="px-4 bg-gray-100" lang="ja">
          {rad.na.join('、')}
        </td>
        <td
          class="px-8 rounded-r bg-gray-100"
          lang={rad.m_lang !== 'en' ? rad.m_lang : undefined}
        >
          {rad.m.join(', ')}
        </td>
      </tr>
      {base ? (
        <tr>
          <td colSpan={3} class="italic text-gray-500 px-8">
            {base}
          </td>
        </tr>
      ) : null}
    </tbody>
  );

  return (
    <table class="components font-light mt-4">
      {radicalRow}
      {props.comp.map(comp => renderComponent(comp, props.rad))}
    </table>
  );
}

function renderComponent(
  comp: KanjiResult['comp'][0],
  radical: KanjiResult['rad']
): JSX.Element | null {
  let { c, na, m, m_lang } = comp;

  if (comp.c === radical.b || comp.c === radical.k) {
    return null;
  }

  return (
    <tbody>
      <tr class="component">
        <td class="px-8" lang="ja">
          {c}
        </td>
        <td class="px-4" lang="ja">
          {na.length ? na[0] : '-'}
        </td>
        <td class="px-8" lang={m_lang !== 'en' ? m_lang : undefined}>
          {m.length ? m[0] : '-'}
        </td>
      </tr>
    </tbody>
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
