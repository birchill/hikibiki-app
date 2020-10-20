import { h, Fragment, FunctionalComponent } from 'preact';
import { KanjiInfo, ReadingInfo, WordResult } from '@birchill/hikibiki-data';

export const WordEntry: FunctionalComponent<WordResult> = (
  props: WordResult
) => {
  return (
    <div class="word-entry text-xl mt-8 mb-8" id={`word-${props.id}`}>
      {renderHeading(props)}
      {renderSenses(props.s)}
    </div>
  );
};

function renderHeading(result: WordResult): JSX.Element {
  if (!result.k || !result.k.length) {
    return (
      <div class="font-bold" lang="ja">
        {renderListWithMatches(result.r, 'kana')}
      </div>
    );
  }

  return (
    <div lang="ja">
      <span class="font-bold mr-4">
        {renderListWithMatches(result.k, 'kanji')}
      </span>
      <span class="text-gray-700 text-lg">
        【{renderListWithMatches(result.r, 'reading')}】
      </span>
    </div>
  );
}

type HeadwordType = 'kanji' | 'kana' | 'reading';

function renderListWithMatches<
  T extends WordResult['k'][0] | WordResult['r'][0]
>(array: Array<T>, type: HeadwordType) {
  // We don't use join() be cause we want to make sure the comma (、) takes on
  // the same shading as the preceding item.
  return array.map((item, i) => (
    <span class={item.match ? '' : 'text-gray-500 font-normal'}>
      {renderHeadword(item)}
      {renderHeadwordAnnotations(item)}
      {renderHeadwordPriority(item, type)}
      {i < array.length - 1 ? '、' : ''}
    </span>
  ));
}

function renderHeadword(headword: WordResult['k'][0] | WordResult['r'][0]) {
  if (headword.matchRange) {
    // We happen to know that we only currently do startsWith matching so the
    // range is always going to start at zero.
    console.assert(headword.matchRange[0] === 0, 'Range should start at 0');
    const highlighted = [...headword.ent]
      .slice(0, headword.matchRange[1])
      .join('');
    const tail = [...headword.ent].slice(headword.matchRange[1]).join('');
    return (
      <Fragment>
        <span class="bg-yellow-200">{highlighted}</span>
        {tail}
      </Fragment>
    );
  } else {
    return headword.ent;
  }
}

function renderHeadwordAnnotations(
  headword: WordResult['k'][0] | WordResult['r'][0]
) {
  if (!headword.i || !headword.i.length) {
    return null;
  }

  return (
    <span class="ml-2">
      {(headword.i as Array<KanjiInfo | ReadingInfo>).map(renderInfo)}
    </span>
  );
}

const headwordInfo: {
  [key in KanjiInfo | ReadingInfo]: {
    icon: string;
    styles: string;
    descr?: string;
  };
} = {
  ateji: {
    icon: 'ateji',
    styles: 'text-orange-500 bg-orange-100',
    descr: 'ateji: Kanji chosen to represent sounds',
  },
  io: {
    icon: 'rare',
    styles: 'text-purple-800 bg-purple-200',
    descr: 'Irregular okurigana (trailing kana)',
  },
  iK: {
    icon: 'rare',
    styles: 'text-purple-800 bg-purple-200',
    descr: 'Irregular kanji',
  },
  ik: {
    icon: 'rare',
    styles: 'text-purple-800 bg-purple-200',
    descr: 'Irregular kana',
  },
  oK: {
    icon: 'old',
    styles: 'text-gray-600 bg-gray-200',
    descr: 'Out-dated kanji',
  },
  ok: {
    icon: 'old',
    styles: 'text-gray-600 bg-gray-200',
    descr: 'Out-dated reading',
  },
  gikun: {
    icon: 'gikun',
    styles: 'text-orange-500 bg-orange-100',
    descr: 'gikun (meaning as reading) or jukujikun (special kanji reading)',
  },
  uK: {
    icon: 'kanji',
    styles: 'text-orange-500 bg-orange-100',
    descr: 'Usually written using kanji alone',
  },
};

function renderInfo(info: KanjiInfo | ReadingInfo) {
  const { icon, styles, descr } = headwordInfo[info];
  return (
    <svg
      class={`inline-block w-10 h-10 p-2 mb-2 mr-2 rounded-sm ${styles}`}
      viewBox="0 0 16 16"
    >
      <title>{descr}</title>
      <use width="16" height="16" href={`#${icon}`} />
    </svg>
  );
}

function renderHeadwordPriority(
  headword: WordResult['k'][0] | WordResult['r'][0],
  type: HeadwordType
) {
  if (!headword.p || !headword.p.length) {
    return null;
  }

  // These are the ones that are annotated with a (P) in the EDICT file.
  const highPriorityLabels = ['i1', 'n1', 's1', 's2', 'g1'];
  let highPriority = false;
  for (const p of headword.p) {
    if (highPriorityLabels.includes(p)) {
      highPriority = true;
      break;
    }
  }

  let title = highPriority ? 'Common' : 'Somewhat common';
  switch (type) {
    case 'kanji':
    case 'kana':
      title += ' word';
      break;

    case 'reading':
      title += ' reading';
      break;
  }

  return (
    <svg
      class={`inline-block w-10 h-10 p-2 mb-2 mr-2 rounded-sm text-yellow-600 bg-yellow-100`}
      viewBox="0 0 16 16"
    >
      <title>{title}</title>
      <use
        width="16"
        height="16"
        href={`#${highPriority ? 'full-star' : 'hollow-star'}`}
      />
    </svg>
  );
}

function renderSenses(senses: WordResult['s']) {
  if (senses.length === 1) {
    return (
      <p class="ml-8" lang={senses[0].lang || 'en'}>
        {senses[0].g.map((g) => g.str).join('; ')}
      </p>
    );
  }
  return (
    <ol class="ml-8 list-circled list-inside">{senses.map(renderSense)}</ol>
  );
}

function renderSense(sense: WordResult['s'][0]) {
  return (
    <li lang={sense.lang || 'en'}>{sense.g.map((g) => g.str).join('; ')}</li>
  );
}
