import { h, Fragment, FunctionalComponent } from 'preact';
import {
  Accent,
  Gloss,
  KanjiInfo,
  PartOfSpeech,
  ReadingInfo,
  WordResult,
} from '@birchill/hikibiki-data';
import { countMora, moraSubstring } from '@birchill/normal-jp';

interface Props extends WordResult {
  lang?: string;
}

export const WordEntry: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="word-entry text-xl mt-8 mb-8" id={`word-${props.id}`}>
      {renderHeading(props)}
      {renderSenses(props.s, props.lang)}
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
      {renderHeadword(item, type)}
      {renderHeadwordAnnotations(item)}
      {renderHeadwordPriority(item, type)}
      {i < array.length - 1 ? '、' : ''}
    </span>
  ));
}

function renderHeadword(
  headword: WordResult['k'][0] | WordResult['r'][0],
  type: HeadwordType
) {
  let [highlighted, tail] = getHeadwordHighlight(
    headword.ent,
    headword.matchRange
  );

  // Add in accent information
  let accentClass: string | undefined, accentTitle: string | undefined;
  if (typeof (headword as WordResult['r'][0]).a !== 'undefined') {
    ({ highlighted, tail, accentClass, accentTitle } = getAccentInfo(
      highlighted,
      tail,
      (headword as WordResult['r'][0]).a!
    ));
  }

  let inner;
  if (highlighted) {
    inner = (
      <Fragment>
        <span class="bg-yellow-200">{highlighted}</span>
        {tail}
      </Fragment>
    );
  } else {
    inner = tail;
  }

  return (
    <a
      class={`hover:underline ${accentClass}`}
      href={`?q=${headword.ent}`}
      title={accentTitle}
    >
      {inner}
    </a>
  );
}

// We happen to know that we only currently do startsWith matching, so the
// range, if we have one, is always going to start at zero.
//
// As a result, we can just return the highlighted part and the (trailing)
// non-highlighted part.
function getHeadwordHighlight(
  headword: string,
  matchRange: [number, number] | undefined
): [highlight: string, tail: string] {
  if (!matchRange) {
    return ['', headword];
  }

  console.assert(matchRange[0] === 0, 'Range should start at 0');

  let highlighted = [...headword].slice(0, matchRange[1]).join('');
  let tail = [...headword].slice(matchRange[1]).join('');

  return [highlighted, tail];
}

function getAccentInfo(
  highlighted: string,
  tail: string,
  accent: number | Array<Accent>
): {
  highlighted: string;
  tail: string;
  accentClass: string | undefined;
  accentTitle: string;
} {
  const accentPos = typeof accent === 'number' ? accent : accent[0].i;
  const highlightLength = countMora(highlighted);
  const tailLength = countMora(tail);
  const headwordLength = highlightLength + tailLength;

  let accentClass: string | undefined;
  let accentedHighlight = highlighted;
  let accentedTail = tail;

  // We use regular JS string offsets here (as opposed to more "correct"
  // techniques that work with non-BMP characters) because we should only
  // ever be annotating hiragana which is within the BMP range.
  if (accentPos === 0) {
    accentClass = 'overline decoration-dotted';
  } else if (accentPos < highlightLength) {
    accentedHighlight =
      moraSubstring(highlighted, 0, accentPos) +
      'ꜜ' +
      moraSubstring(highlighted, accentPos);
  } else {
    const tailPos = accentPos - highlightLength;
    accentedTail =
      moraSubstring(tail, 0, tailPos) + 'ꜜ' + moraSubstring(tail, tailPos);
  }

  // Work out the descriptive title to use
  let accentTitle = 'Pitch: ';
  if (accentPos === 0) {
    accentTitle += 'heiban';
  } else if (accentPos === headwordLength) {
    accentTitle += 'odaka';
  } else if (accentPos === 1) {
    accentTitle += 'atamadaka';
  } else {
    accentTitle += 'nakadaka';
  }

  return {
    highlighted: accentedHighlight,
    tail: accentedTail,
    accentClass,
    accentTitle,
  };
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

function renderSenses(senses: WordResult['s'], lang: string | undefined) {
  if (senses.length === 1) {
    let className = 'ml-8';
    if (isForeignSense(senses[0], lang)) {
      className += ' italic';
    }
    return (
      <p class={className} lang={senses[0].lang || 'en'}>
        {renderGlosses(senses[0].g)}
        {renderPartOfSpeech(senses[0].pos)}
      </p>
    );
  }

  const localSenses = senses.filter((sense) => !isForeignSense(sense, lang));
  const foreignSenses = senses.filter((sense) => isForeignSense(sense, lang));

  if (lang === 'en') {
    return (
      <ol class="ml-8 list-circled list-inside">
        {localSenses.map((sense) => renderSense(sense, lang))}
      </ol>
    );
  }

  return (
    <Fragment>
      {localSenses ? (
        <ul class="ml-8 list-disc list-inside">
          {localSenses.map((sense) => renderSense(sense, lang))}
        </ul>
      ) : null}
      {foreignSenses ? (
        <ol class="ml-8 list-circled list-inside">
          {foreignSenses.map((sense) => renderSense(sense, lang))}
        </ol>
      ) : null}
    </Fragment>
  );
}

function isForeignSense(sense: WordResult['s'][0], lang: string | undefined) {
  const resolveLang = (lang: string | undefined) => lang || 'en';
  return resolveLang(sense.lang) !== resolveLang(lang);
}

function renderSense(sense: WordResult['s'][0], lang: string | undefined) {
  return (
    <li
      lang={sense.lang || 'en'}
      class={isForeignSense(sense, lang) ? 'italic mb-2' : 'my-2'}
    >
      {renderGlosses(sense.g)}
      {renderPartOfSpeech(sense.pos)}
    </li>
  );
}

const partsOfSpeechLabels: {
  [pos in PartOfSpeech]: string | [string, string];
} = {
  'adj-f': ['pre-noun adj.', 'noun or verb modifying a following noun'],
  'adj-i': ['i adj.', 'i-adjective (keiyoushi)'],
  'adj-ix': ['ii/yoi adj.', 'yoi/ii class adjective (keiyoushi)'],
  'adj-kari': ['kari adj.', "'kari' adjective (archaic)"],
  'adj-ku': ['ku adj.', "'ku' adjective (archaic)"],
  'adj-na': ['na adj.', 'adjectival noun or quasi-adjectives (keiyodoshi)'],
  'adj-nari': ['nari adj.', 'archaic/formal form of na-adjective'],
  'adj-no': ['no-adj.', "noun which may take the genitive case particle 'no'"],
  'adj-pn': ['pre-noun adj.', 'pre-noun adjectival (rentaishi)'],
  'adj-shiku': ['shiku adj.', "'shiku' adjective (archaic)"],
  'adj-t': ['taru adj.', 'taru adjective'],
  adv: 'adverb',
  'adv-to': ['adverb to', "adverb taking the 'to' particle"],
  aux: 'aux.',
  'aux-adj': ['aux. adj.', 'auxiliary adjective'],
  'aux-v': ['aux. verb', 'auxiliary verb'],
  conj: ['conj.', 'conjugation'],
  cop: 'copula',
  ctr: 'counter',
  exp: ['exp.', 'expression (phrase, clause, etc.)'],
  int: ['int.', 'interjection (kandoushi)'],
  n: 'noun',
  'n-adv': ['adv. noun', 'adverbial noun (fukushitekimeishi)'],
  'n-pr': 'proper noun',
  'n-pref': ['n-pref', 'noun used as a prefix'],
  'n-suf': ['n-suf', 'noun used as a suffic'],
  'n-t': ['n-temp', 'noun (temporal) (jisoumeishi)'],
  num: 'numeric',
  pn: 'pronoun',
  pref: 'prefix',
  prt: 'particle',
  suf: 'suffix',
  unc: ['?', 'unclassified'],
  'v-unspec': ['verb', 'verb, type unspecified'],
  v1: ['-ru verb', 'ichidan verb'],
  'v1-s': ['-ru verb*', 'ichidan verb - kureru special class'],
  'v2a-s': ['-u nidan verb', "nidan verb with 'u' ending (archaic)"],
  'v2b-k': [
    '-bu nidan verb (upper)',
    "nidan verb (upper class) with 'bu' ending (archaic)",
  ],
  'v2b-s': [
    '-bu nidan verb (lower)',
    "nidan verb (lower class) with 'bu' ending (archaic)",
  ],
  'v2d-k': [
    '-dzu nidan verb (upper)',
    "nidan verb (upper class) with 'dzu' ending (archaic)",
  ],
  'v2d-s': [
    '-dzu nidan verb (lower)',
    "nidan verb (lower class) with 'dzu' ending (archaic)",
  ],
  'v2g-k': [
    '-gu nidan verb (upper)',
    "nidan verb (upper class) with 'gu' ending (archaic)",
  ],
  'v2g-s': [
    '-gu nidan verb (lower)',
    "nidan verb (lower class) with 'gu' ending (archaic)",
  ],
  'v2h-k': [
    '-hu/fu nidan verb (upper)',
    "nidan verb (upper class) with 'hu/fu' ending (archaic)",
  ],
  'v2h-s': [
    '-hu/fu nidan verb (lower)',
    "nidan verb (lower class) with 'hu/fu' ending (archaic)",
  ],
  'v2k-k': [
    '-ku nidan verb (upper)',
    "nidan verb (upper class) with 'ku' ending (archaic)",
  ],
  'v2k-s': [
    '-ku nidan verb (lower)',
    "nidan verb (lower class) with 'ku' ending (archaic)",
  ],
  'v2m-k': [
    '-mu nidan verb (upper)',
    "nidan verb (upper class) with 'mu' ending (archaic)",
  ],
  'v2m-s': [
    '-mu nidan verb (lower)',
    "nidan verb (lower class) with 'mu' ending (archaic)",
  ],
  'v2n-s': [
    '-nu nidan verb',
    "nidan verb (lower class) with 'nu' ending (archaic)",
  ],
  'v2r-k': [
    '-ru nidan verb (upper)',
    "nidan verb (upper class) with 'ru' ending (archaic)",
  ],
  'v2r-s': [
    '-ru nidan verb (lower)',
    "nidan verb (lower class) with 'ru' ending (archaic)",
  ],
  'v2s-s': [
    '-su nidan verb',
    "nidan verb (lower class) with 'su' ending (archaic)",
  ],
  'v2t-k': [
    '-tsu nidan verb (upper)',
    "nidan verb (upper class) with 'tsu' ending (archaic)",
  ],
  'v2t-s': [
    '-tsu nidan verb (lower)',
    "nidan verb (lower class) with 'tsu' ending (archaic)",
  ],
  'v2w-s': [
    '-u nidan verb + we',
    "nidan verb (lower class) with 'u' ending and 'we' conjugation (archaic)",
  ],
  'v2y-k': [
    '-yu nidan verb (upper)',
    "nidan verb (upper class) with 'yu' ending (archaic)",
  ],
  'v2y-s': [
    '-yu nidan verb (lower)',
    "nidan verb (lower class) with 'yu' ending (archaic)",
  ],
  'v2z-s': [
    '-zu nidan verb',
    "nidan verb (lower class) with 'zu' ending (archaic)",
  ],
  v4b: ['-bu yodan verb', "yodan verb with 'bu' ending (archaic)"],
  v4g: ['-gu yodan verb', "yodan verb with 'gu' ending (archaic)"],
  v4h: ['-hu/fu yodan verb', "yodan verb with 'hu/fu' ending (archaic)"],
  v4k: ['-ku yodan verb', "yodan verb with 'ku' ending (archaic)"],
  v4m: ['-mu yodan verb', "yodan verb with 'mu' ending (archaic)"],
  v4n: ['-nu yodan verb', "yodan verb with 'nu' ending (archaic)"],
  v4r: ['-ru yodan verb', "yodan verb with 'ru' ending (archaic)"],
  v4s: ['-su yodan verb', "yodan verb with 'su' ending (archaic)"],
  v4t: ['-tsu yodan verb', "yodan verb with 'tsu' ending (archaic)"],
  v5aru: ['-aru godan verb', 'godan verb - -aru special class'],
  v5b: ['-bu verb', "godan verb with 'bu' ending"],
  v5g: ['-gu verb', "godan verb with 'gu' ending"],
  v5k: ['-ku verb', "godan verb with 'ku' ending"],
  'v5k-s': ['iku/yuku verb', 'godan verb - Iku/Yuku special class'],
  v5m: ['-mu verb', "godan verb with 'mu' ending"],
  v5n: ['-nu verb', "godan verb with 'nu' ending"],
  v5r: ['-u verb', "godan verb with 'ru' ending"],
  'v5r-i': ['-u verb*', "godan verb with 'ru' ending (irregular verb)"],
  v5s: ['-su verb', "godan verb with 'su' ending"],
  v5t: ['-tsu verb', "godan verb with 'tsu' ending"],
  v5u: ['-u verb', "godan verb with 'u' ending"],
  'v5u-s': ['-u verb*', "godan verb with 'u' ending (special class)"],
  v5uru: ['-uru verb', 'godan verb - Uru old class verb (old form of Eru)'],
  vi: ['intransitive', 'intransitive verb'],
  vk: 'kuru verb',
  vn: ['-nu verb*', 'irregular nu verb'],
  vr: ['-nu (-ri) verb*', 'irregular ru verb, plain form ends with -ri'],
  vs: ['+suru', 'noun or participle which takes the aux. verb suru'],
  'vs-c': ['su verb', 'su verb - precursor to the modern suru'],
  'vs-i': ['suru verb', 'suru verb where the suru is included'],
  'vs-s': ['suru verb*', 'suru verb - special class'],
  vt: ['transitive', 'transitive verb'],
  vz: ['zuru verb', 'Ichidan zuru verb (alternative form of -jiru verbs)'],
};

function renderPartOfSpeech(pos?: Array<PartOfSpeech>) {
  if (!pos || !pos.length) {
    return null;
  }

  return pos.map((p) => {
    const labelData = partsOfSpeechLabels[p];
    let label = Array.isArray(labelData) ? labelData[0] : labelData;
    let descr = Array.isArray(labelData) ? labelData[1] : undefined;
    return (
      <span
        class="text-xs text-blue-600 bg-blue-100 px-2 py-1 mx-1 rounded-sm"
        title={descr}
      >
        {label}
      </span>
    );
  });
}

function renderGlosses(glosses: Array<Gloss>) {
  return glosses.map((gloss, i) =>
    renderGloss(gloss, i === glosses.length - 1)
  );
}

function renderGloss(gloss: Gloss, last: boolean) {
  if (gloss.matchRange) {
    const [start, end] = gloss.matchRange;
    const glossChars = [...gloss.str];
    const before = glossChars.slice(0, start).join('');
    const highlighted = glossChars.slice(start, end).join('');
    const after = glossChars.slice(end).join('');

    return (
      <Fragment>
        {before}
        <span class="bg-yellow-200">{highlighted}</span>
        {after}
        {last ? null : '; '}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        {gloss.str}
        {last ? null : '; '}
      </Fragment>
    );
  }
}
