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
        class="meanings text-lg text-gray-500 text-light mb-4"
        lang={props.m_lang !== 'en' ? props.m_lang : undefined}
      >
        {props.m.join(', ')}
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
