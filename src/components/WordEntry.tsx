import { h, Fragment, FunctionalComponent } from 'preact';
import {
  groupSenses,
  Accent,
  CrossReference,
  Dialect,
  FieldType,
  Gloss,
  GlossType,
  KanjiInfo,
  LangSource,
  MiscType,
  PartOfSpeech,
  ReadingInfo,
  WordResult,
} from '@birchill/hikibiki-data';
import { countMora, moraSubstring } from '@birchill/normal-jp';

import { AccentDisplayType } from './WordDisplayConfig';

interface Props extends WordResult {
  lang?: string;
  accentDisplay: AccentDisplayType;
}

export const WordEntry: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div
      class="word-entry text-xl leading-normal mt-8 mb-8"
      id={`word-${props.id}`}
    >
      {renderHeading(props, props.accentDisplay)}
      {renderSenses(props.s, props.lang)}
    </div>
  );
};

function renderHeading(
  result: WordResult,
  accentDisplay: AccentDisplayType
): JSX.Element {
  if (!result.k || !result.k.length) {
    return (
      <div class="font-bold" lang="ja">
        {renderListWithMatches(result.r, 'kana', accentDisplay)}
      </div>
    );
  }

  return (
    <div lang="ja">
      <span class="font-bold mr-4">
        {renderListWithMatches(result.k, 'kanji', accentDisplay)}
      </span>
      <span class="text-gray-700 text-lg">
        【{renderListWithMatches(result.r, 'reading', accentDisplay)}】
      </span>
    </div>
  );
}

type HeadwordType = 'kanji' | 'kana' | 'reading';

function renderListWithMatches<
  T extends WordResult['k'][0] | WordResult['r'][0]
>(array: Array<T>, type: HeadwordType, accentDisplay: AccentDisplayType) {
  // We don't use join() be cause we want to make sure the comma (、) takes on
  // the same shading as the preceding item.
  return array.map((item, i) => (
    <span class={item.match ? '' : 'text-gray-500 font-normal'}>
      {renderHeadword(item, accentDisplay)}
      {renderHeadwordAnnotations(item)}
      {renderHeadwordPriority(item, type)}
      {i < array.length - 1 ? '、' : ''}
    </span>
  ));
}

function renderHeadword(
  headword: WordResult['k'][0] | WordResult['r'][0],
  accentDisplay: AccentDisplayType
) {
  let highlighted: string | JSX.Element;
  let tail: string | JSX.Element;
  [highlighted, tail] = getHeadwordHighlight(headword.ent, headword.matchRange);

  // Add in accent information
  let accentClass: string | undefined, accentTitle: string | undefined;
  if (
    accentDisplay !== 'none' &&
    typeof (headword as WordResult['r'][0]).a !== 'undefined'
  ) {
    ({ highlighted, tail, accentClass, accentTitle } = getAccentInfo(
      highlighted,
      tail,
      (headword as WordResult['r'][0]).a!,
      accentDisplay
    ));
  }

  let inner;
  if (highlighted) {
    inner = (
      <Fragment>
        <span class="bg-yellow-100">{highlighted}</span>
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
  accent: number | Array<Accent>,
  accentDisplay: 'downstep' | 'binary'
): {
  highlighted: string | JSX.Element;
  tail: string | JSX.Element;
  accentClass: string | undefined;
  accentTitle: string;
} {
  const accentPos = typeof accent === 'number' ? accent : accent[0].i;
  const highlightLength = countMora(highlighted);
  const tailLength = countMora(tail);
  const headwordLength = highlightLength + tailLength;

  let accentClass: string | undefined;
  let accentedHighlight: string | JSX.Element = highlighted;
  let accentedTail: string | JSX.Element = tail;

  if (accentDisplay === 'downstep') {
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
  } else {
    ({ highlighted: accentedHighlight, tail: accentedTail } = renderBinaryPitch(
      highlighted,
      highlightLength,
      tail,
      tailLength,
      accentPos
    ));
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

// The following is monstrous.
//
// We really should have just generated an array of characters with highlight
// and H/L annotations applied, then walked the array to generate the
// appropriate spans, but instead, out of laziness, we generated this
// monstrousity. Well done me.
function renderBinaryPitch(
  highlighted: string,
  highlightLength: number,
  tail: string,
  tailLength: number,
  accentPos: number
): {
  highlighted: string | JSX.Element;
  tail: string | JSX.Element;
} {
  const headwordLength = highlightLength + tailLength;

  // Deal with the entirely empty-string case up-front so we can assume we have
  // some content below.
  if (!headwordLength) {
    return { highlighted: '', tail: '' };
  }

  // Heiban (0) means LHHHHHHH while atamadaka (1) means HLLLL
  //
  // These are sufficiently similar that we handle them together
  if (accentPos === 0 || accentPos === 1) {
    const before = accentPos
      ? 'border-dotted border-t-2 border-r-2'
      : headwordLength > 1
      ? 'border-dotted border-b-2 border-r-2'
      : 'border-dotted border-t-2';
    const after =
      accentPos === 0 ? 'border-dotted border-t-2' : 'border-dotted border-b-2';
    const afterCont =
      accentPos === 0 ? 'border-dotted border-t-2' : 'border-dotted border-b-2';
    if (!highlightLength) {
      const accentedTail = (
        <Fragment>
          <span class={before}>{moraSubstring(tail, 0, 1)}</span>
          {tailLength > 1 ? (
            <span class={after}>{moraSubstring(tail, 1)}</span>
          ) : null}
        </Fragment>
      );
      return {
        highlighted: '',
        tail: accentedTail,
      };
    } else if (highlightLength === 1) {
      const accentedHighlight = <span class={before}>{highlighted}</span>;
      const accentedTail = tailLength ? <span class={after}>{tail}</span> : '';
      return {
        highlighted: accentedHighlight,
        tail: accentedTail,
      };
    } else {
      const accentedHighlight = (
        <Fragment>
          <span class={before}>{moraSubstring(highlighted, 0, 1)}</span>
          <span class={after}>{moraSubstring(highlighted, 1)}</span>
        </Fragment>
      );
      const accentedTail = <span class={afterCont}>{tail}</span>;
      return {
        highlighted: accentedHighlight,
        tail: accentedTail,
      };
    }
  }

  // The remainder are nakadaka (LHHHHL) or odaka (LHHHH)
  //
  // The difference between odaka and heiban is that we make the line go down
  // at the end of the last mora for odaka.
  if (!highlightLength) {
    // tailLength must be at least 2 meaning we have two cases: LH*L or LH*
    const accentedTail = (
      <Fragment>
        <span class="border-dotted border-b-2">
          {moraSubstring(tail, 0, 1)}
        </span>
        <span class="border-dotted border-l-2 border-t-2 border-r-2">
          {moraSubstring(tail, 1, accentPos)}
        </span>
        {accentPos < headwordLength ? (
          <span class="border-dotted border-b-2">
            {moraSubstring(tail, accentPos)}
          </span>
        ) : null}
      </Fragment>
    );
    return {
      highlighted: '',
      tail: accentedTail,
    };
  }

  if (highlightLength === 1) {
    const accentedHighlight = (
      <span class="border-dotted border-b-2">{highlighted}</span>
    );
    const accentedTail = (
      <Fragment>
        <span class="border-dotted border-l-2 border-t-2 border-r-2">
          {moraSubstring(tail, 0, accentPos - 1)}
        </span>
        {accentPos < headwordLength ? (
          <span class="border-dotted border-b-2">
            {moraSubstring(tail, accentPos - 1)}
          </span>
        ) : null}
      </Fragment>
    );
    return {
      highlighted: accentedHighlight,
      tail: accentedTail,
    };
  }

  let highlightEnd = 'border-dotted border-l-2 border-t-2';
  if (accentPos <= highlightLength) {
    highlightEnd += ' border-r-2';
  }
  const accentedHighlight = (
    <Fragment>
      <span class="border-dotted border-b-2">
        {moraSubstring(highlighted, 0, 1)}
      </span>
      <span class={highlightEnd}>
        {moraSubstring(highlighted, 1, accentPos)}
      </span>
      {accentPos < highlightLength ? (
        <span class="border-dotted border-b-2">
          {moraSubstring(highlighted, accentPos)}
        </span>
      ) : null}
    </Fragment>
  );
  const accentedTail = (
    <Fragment>
      {accentPos > highlightLength ? (
        <span class="border-dotted border-t-2 border-r-2">
          {moraSubstring(tail, 0, accentPos - highlightLength)}
        </span>
      ) : null}
      {headwordLength > accentPos ? (
        <span class="border-dotted border-b-2">
          {moraSubstring(tail, accentPos - highlightLength)}
        </span>
      ) : null}
    </Fragment>
  );

  return {
    highlighted: accentedHighlight,
    tail: accentedTail,
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
    icon: 'usu. kanji',
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
      class={`inline-block w-10 h-10 p-2 mb-2 mr-2 rounded-sm text-yellow-600 bg-yellow-50`}
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
        {renderPartOfSpeech(senses[0].pos)}
        {renderFields(senses[0].field)}
        {renderMisc(senses[0].misc)}
        {renderDialect(senses[0].dial)}
        {renderGlosses(senses[0].g)}
        {renderSenseInfo(senses[0].inf)}
        {renderLangSource(senses[0].lsrc)}
        {renderCrossReferences(senses[0].xref, senses[0].ant)}
      </p>
    );
  }

  // Split the senses into native senses (which we show as a bulleted list)
  // and English senses (which we show as a numbered list since the
  // cross-references refer to the specific order of the English senses).
  const nativeSenses = senses.filter(
    (sense) => sense.lang && sense.lang !== 'en'
  );
  const renderedNativeSenses = nativeSenses.length ? (
    <ul class="ml-8 list-disc list-inside">
      {nativeSenses.map((sense) => renderSense(sense, lang))}
    </ul>
  ) : null;

  // Try to group the English senses by part-of-speech.
  const enSenses = senses.filter((sense) => !sense.lang || sense.lang === 'en');
  const posGroups = groupSenses(enSenses);
  // We'll use groups unless it makes the result more than 50% longer.
  const linesWithGrouping = posGroups.length + enSenses.length;
  const linesWithoutGrouping = enSenses.length;
  const useGroups =
    posGroups.length && linesWithGrouping / linesWithoutGrouping <= 1.5;

  // Render using the appropriate strategy
  let renderedEnSenses: JSX.Element | null = null;
  if (useGroups && enSenses.length) {
    let start = 1;
    renderedEnSenses = (
      <Fragment>
        {posGroups.map((group) => {
          const renderedGroup = (
            <Fragment>
              <p>
                {renderPartOfSpeech(group.pos)}
                {renderMisc(group.misc)}
                {!group.pos.length && !group.misc.length ? (
                  <span class="text-xs px-2 py-1">-</span>
                ) : null}
              </p>
              <ol class="ml-8 list-circled list-inside" start={start}>
                {group.senses.map((sense) => renderSense(sense, lang))}
              </ol>
            </Fragment>
          );
          start += group.senses.length;
          return renderedGroup;
        })}
      </Fragment>
    );
  } else if (enSenses.length) {
    renderedEnSenses = (
      <ol class="ml-8 list-circled list-inside">
        {enSenses.map((sense) => renderSense(sense, lang))}
      </ol>
    );
  }

  return (
    <Fragment>
      {renderedNativeSenses}
      {renderedEnSenses}
    </Fragment>
  );
}

function isForeignSense(sense: WordResult['s'][0], lang: string | undefined) {
  const resolveLang = (lang: string | undefined) => lang || 'en';
  return resolveLang(sense.lang) !== resolveLang(lang);
}

function renderSense(sense: WordResult['s'][0], lang: string | undefined) {
  let className = 'my-2';
  if (isForeignSense(sense, lang)) {
    className += ' italic';
  }
  if (!sense.match) {
    className += ' text-gray-500';
  }

  return (
    <li lang={sense.lang || 'en'} class={className}>
      {renderPartOfSpeech(sense.pos)}
      {renderFields(sense.field)}
      {renderMisc(sense.misc)}
      {renderDialect(sense.dial)}
      {renderGlosses(sense.g)}
      {renderSenseInfo(sense.inf)}
      {renderLangSource(sense.lsrc)}
      {renderCrossReferences(sense.xref, sense.ant)}
    </li>
  );
}

function renderGlosses(glosses: Array<Gloss>) {
  return glosses.map((gloss, i) =>
    renderGloss(gloss, i === glosses.length - 1)
  );
}

const glossTypeText: { [type in GlossType]: string | undefined } = {
  [GlossType.Expl]: '(explanation) ',
  [GlossType.Lit]: '(literally) ',
  [GlossType.Fig]: '(figurative) ',
  [GlossType.None]: undefined,
};

function renderGloss(gloss: Gloss, last: boolean) {
  let glossType = gloss.type ? glossTypeText[gloss.type] : undefined;
  let glossText: string | JSX.Element = gloss.str;

  // Highlight matched range if any
  if (gloss.matchRange) {
    const [start, end] = gloss.matchRange;
    const glossChars = [...gloss.str];
    const before = glossChars.slice(0, start).join('');
    const highlighted = glossChars.slice(start, end).join('');
    const after = glossChars.slice(end).join('');

    glossText = (
      <Fragment>
        {before}
        <span class="bg-yellow-100">{highlighted}</span>
        {after}
      </Fragment>
    );
  }

  return (
    <Fragment>
      {glossType}
      {glossText}
      {last ? null : '; '}
    </Fragment>
  );
}

function renderSenseInfo(inf?: string) {
  return inf ? <span class="text-base">{` (${inf})`}</span> : null;
}

const languages: { [lang: string]: string } = {
  af: 'Afrikaans',
  ain: 'Ainu',
  alg: 'Algonquian',
  am: 'Amharic',
  ar: 'Arabic',
  arn: 'Mapuche',
  bg: 'Bulgarian',
  bnt: 'Bantu',
  bo: 'Tibetan',
  br: 'Breton',
  chn: 'Chinook',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  eo: 'Esperanto',
  es: 'Spanish',
  et: 'Estonian',
  fa: 'Persian',
  fi: 'Finnish',
  fil: 'Filipino',
  fr: 'French',
  gl: 'Galician',
  grc: 'Ancient Greek',
  haw: 'Hawaiian',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  is: 'Icelandic',
  it: 'Italian',
  ka: 'Georgian',
  km: 'Khmer',
  ko: 'Korean',
  ku: 'Kurdish',
  la: 'Latin',
  mi: 'Maori',
  ml: 'Malayalam',
  mn: 'Mongolian',
  mnc: 'Manchu',
  mo: 'Moldavian',
  ms: 'Malay',
  my: 'Burmese',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sa: 'Sanskrit',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  th: 'Thai',
  tr: 'Turkish',
  ty: 'Tahitian',
  ur: 'Urdu',
  vi: 'Vietnamese',
  yi: 'Yiddish',
  zh: 'Chinese',
};

function renderLangSource(sources: Array<LangSource> | undefined) {
  if (!sources || !sources.length) {
    return null;
  }

  return sources.map((lsrc) => {
    let prefix = lsrc.wasei ? 'wasei' : undefined;
    if (!prefix) {
      prefix = languages[lsrc.lang || 'en'] || lsrc.lang;
    }
    if (prefix && lsrc.src) {
      prefix = `${prefix}: `;
    }
    return (
      <span class="text-sm text-gray-600 mx-2">
        ({prefix}
        {lsrc.src ? <span lang={lsrc.lang}>{lsrc.src}</span> : null})
      </span>
    );
  });
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
  v1: ['Ichidan/ru-verb', 'ichidan verb'],
  'v1-s': ['Ichidan/ru-verb (kureru)', 'ichidan verb - kureru special class'],
  'v2a-s': ['-u Nidan verb', "nidan verb with 'u' ending (archaic)"],
  'v2b-k': [
    '-bu upper Nidan verb',
    "nidan verb (upper class) with 'bu' ending (archaic)",
  ],
  'v2b-s': [
    '-bu lower Nidan verb',
    "nidan verb (lower class) with 'bu' ending (archaic)",
  ],
  'v2d-k': [
    '-dzu upper Nidan verb',
    "nidan verb (upper class) with 'dzu' ending (archaic)",
  ],
  'v2d-s': [
    '-dzu lower Nidan verb',
    "nidan verb (lower class) with 'dzu' ending (archaic)",
  ],
  'v2g-k': [
    '-gu upper Nidan verb',
    "nidan verb (upper class) with 'gu' ending (archaic)",
  ],
  'v2g-s': [
    '-gu lower Nidan verb',
    "nidan verb (lower class) with 'gu' ending (archaic)",
  ],
  'v2h-k': [
    '-hu/fu upper Nidan verb',
    "nidan verb (upper class) with 'hu/fu' ending (archaic)",
  ],
  'v2h-s': [
    '-hu/fu lower Nidan verb',
    "nidan verb (lower class) with 'hu/fu' ending (archaic)",
  ],
  'v2k-k': [
    '-ku upper Nidan verb',
    "nidan verb (upper class) with 'ku' ending (archaic)",
  ],
  'v2k-s': [
    '-ku lower Nidan verb',
    "nidan verb (lower class) with 'ku' ending (archaic)",
  ],
  'v2m-k': [
    '-mu upper Nidan verb',
    "nidan verb (upper class) with 'mu' ending (archaic)",
  ],
  'v2m-s': [
    '-mu lower Nidan verb',
    "nidan verb (lower class) with 'mu' ending (archaic)",
  ],
  'v2n-s': [
    '-nu Nidan verb',
    "nidan verb (lower class) with 'nu' ending (archaic)",
  ],
  'v2r-k': [
    '-ru upper Nidan verb',
    "nidan verb (upper class) with 'ru' ending (archaic)",
  ],
  'v2r-s': [
    '-ru lower Nidan verb',
    "nidan verb (lower class) with 'ru' ending (archaic)",
  ],
  'v2s-s': [
    '-su Nidan verb',
    "nidan verb (lower class) with 'su' ending (archaic)",
  ],
  'v2t-k': [
    '-tsu upper Nidan verb',
    "nidan verb (upper class) with 'tsu' ending (archaic)",
  ],
  'v2t-s': [
    '-tsu lower Nidan verb',
    "nidan verb (lower class) with 'tsu' ending (archaic)",
  ],
  'v2w-s': [
    '-u Nidan verb + we',
    "nidan verb (lower class) with 'u' ending and 'we' conjugation (archaic)",
  ],
  'v2y-k': [
    '-yu upper Nidan verb',
    "nidan verb (upper class) with 'yu' ending (archaic)",
  ],
  'v2y-s': [
    '-yu lower Nidan verb',
    "nidan verb (lower class) with 'yu' ending (archaic)",
  ],
  'v2z-s': [
    '-zu Nidan verb',
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
  v5aru: ['-aru Godan/u-verb', 'godan verb - -aru special class'],
  v5b: ['-bu Godan/u-verb', "godan verb with 'bu' ending"],
  v5g: ['-gu Godan/u-verb', "godan verb with 'gu' ending"],
  v5k: ['-ku Godan/u-verb', "godan verb with 'ku' ending"],
  'v5k-s': ['iku/yuku Godan/u-verb', 'godan verb - Iku/Yuku special class'],
  v5m: ['-mu Godan/u-verb', "godan verb with 'mu' ending"],
  v5n: ['-nu Godan/u-verb', "godan verb with 'nu' ending"],
  v5r: ['-ru Godan/u-verb', "godan verb with 'ru' ending"],
  'v5r-i': [
    '-ru Godan/u-verb (irr.)',
    "godan verb with 'ru' ending (irregular verb)",
  ],
  v5s: ['-su Godan/u-verb', "godan verb with 'su' ending"],
  v5t: ['-tsu Godan/u-verb', "godan verb with 'tsu' ending"],
  v5u: ['-u Godan/u-verb', "godan verb with 'u' ending"],
  'v5u-s': [
    '-u Godan/u-verb (special)',
    "godan verb with 'u' ending (special class)",
  ],
  v5uru: [
    '-uru Godan/u-verb',
    'godan verb - Uru old class verb (old form of Eru)',
  ],
  vi: ['intransitive', 'intransitive verb'],
  vk: 'kuru verb',
  vn: ['-nu irr. verb', 'irregular nu verb'],
  vr: ['-ru (-ri) irr. verb', 'irregular ru verb, plain form ends with -ri'],
  vs: ['+suru verb', 'noun or participle which takes the aux. verb suru'],
  'vs-c': ['-su(ru) verb', 'su verb - precursor to the modern suru'],
  'vs-i': ['-suru verb', 'suru verb where the suru is included'],
  'vs-s': ['-suru verb (special)', 'suru verb - special class'],
  vt: ['transitive', 'transitive verb'],
  vz: [
    '-zuru Ichidan/ru-verb',
    'Ichidan zuru verb (alternative form of -jiru verbs)',
  ],
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
        class="text-xs text-blue-800 bg-blue-50 px-2 py-1 mr-2 rounded-sm"
        title={descr}
      >
        {label}
      </span>
    );
  });
}

const fieldLabels: { [field in FieldType]: string } = {
  agric: 'agriculture',
  anat: 'anatomy',
  archeol: 'archeology',
  archit: 'architecture',
  art: 'art',
  astron: 'astronomy',
  audvid: 'audiovisual',
  aviat: 'aviation',
  baseb: 'baseball',
  biochem: 'biochemistry',
  biol: 'biology',
  bot: 'botany',
  Buddh: 'Buddhism',
  bus: 'business',
  chem: 'chemistry',
  Christn: 'Christianity',
  comp: 'computing',
  cryst: 'crystallography',
  ecol: 'ecology',
  econ: 'economics',
  elec: 'electricty',
  electr: 'electronics',
  embryo: 'embryology',
  engr: 'engineering',
  ent: 'entomology',
  finc: 'finance',
  fish: 'fishing',
  food: 'food',
  gardn: 'gardening',
  genet: 'genetics',
  geogr: 'geography',
  geol: 'geology',
  geom: 'geometry',
  go: 'go (game)',
  golf: 'golf',
  gramm: 'grammar',
  grmyth: 'Greek mythology',
  hanaf: 'hanafuda',
  horse: 'horse-racing',
  law: 'law',
  ling: 'linguistics',
  logic: 'logic',
  MA: 'martial arts',
  mahj: 'mahjong',
  math: 'mathematics',
  mech: 'mechanical engineering',
  med: 'medicine',
  met: 'climate, weather',
  mil: 'military',
  music: 'music',
  ornith: 'ornithology',
  paleo: 'paleontology',
  pathol: 'pathology',
  pharm: 'pharmacy',
  phil: 'philosophy',
  photo: 'photography',
  physics: 'physics',
  physiol: 'physiology',
  print: 'printing',
  psych: 'psychology, psychiatry',
  Shinto: 'Shinto',
  shogi: 'shogi',
  sports: 'sports',
  stat: 'statistics',
  sumo: 'sumo',
  telec: 'telecommunications',
  tradem: 'trademark',
  vidg: 'video games',
  zool: 'zoology',
};

function renderFields(fields?: Array<FieldType>) {
  if (!fields || !fields.length) {
    return null;
  }

  return fields.map((field) => (
    <span class="text-xs text-green-800 bg-green-50 px-2 py-1 mr-2 rounded-sm">
      {fieldLabels[field] || field}
    </span>
  ));
}

const miscLabels: {
  [pos in MiscType]: string | [string, string];
} = {
  abbr: ['abbrev.', 'abbreviation'],
  arch: 'archaism',
  chn: ['children', "children's language"],
  col: 'colloquialism',
  company: ['company', 'company name'],
  dated: ['old', 'dated term'],
  derog: 'derogatory',
  fam: ['familiar', 'familiar language'],
  fem: ['female', 'female term or language'],
  given: ['given name', 'given name or forename, gender not specified'],
  hist: ['historical', 'historical term'],
  hon: ['honorific', 'honorific or respectful language (尊敬語)'],
  hum: ['humble', 'humble language (謙譲語)'],
  id: ['idiomatic', 'idiomatic expression'],
  joc: ['humorous', 'jocular, humorous term'],
  litf: ['literary', 'literary or formal term'],
  'm-sl': ['manga', 'manga slang'],
  male: ['male', 'male term or language'],
  'net-sl': ['net', 'Internet slang'],
  obs: 'obsolete',
  obsc: 'obscure',
  'on-mim': ['onomatopoeia', 'onomatopoeic or mimetic word'],
  organization: ['org.', 'organization name'],
  person: ['person', 'full name of a particular person'],
  place: ['place', 'place name'],
  poet: ['poetical', 'poetical term'],
  pol: ['polite', 'polite language (丁寧語)'],
  product: ['product', 'product name'],
  proverb: 'proverb',
  quote: ['quote', 'quotation'],
  rare: 'rare',
  sens: 'sensitive',
  sl: 'slang',
  station: ['station', 'railway station'],
  surname: ['surname', 'family or surname'],
  uk: ['kana', 'usually written using kana alone'],
  unclass: ['unclassified', 'unclassified name'],
  vulg: ['vulgar', 'vulgar expression or word'],
  work: ['work', 'work of art, literature, music, etc. name'],
  X: ['XXX', 'rude or X-rated term'],
  yoji: ['yojijukugo', 'four-character compound word (四字熟語)'],
};

function renderMisc(misc?: Array<MiscType>) {
  if (!misc || !misc.length) {
    return null;
  }

  return misc.map((p) => {
    const labelData = miscLabels[p];
    let label = Array.isArray(labelData) ? labelData[0] : labelData;
    let descr = Array.isArray(labelData) ? labelData[1] : undefined;
    return (
      <span
        class="text-xs text-red-600 bg-red-100 px-2 py-1 mr-2 rounded-sm"
        title={descr}
      >
        {label}
      </span>
    );
  });
}

const dialectLabels: { [dial in Dialect]: string } = {
  ho: 'Hokkaido dialect',
  tsug: 'Tsugaru dialect',
  th: 'Tohoku dialect',
  na: 'Nagano dialect',
  kt: 'Kanto dialect',
  ks: 'Kansai dialect',
  ky: 'Kyoto dialect',
  os: 'Osaka dialect',
  ts: 'Tosa dialect',
  '9s': 'Kyushu dialect',
  ok: 'Ryuukyuu dialect',
};

function renderDialect(dial?: Array<Dialect>) {
  if (!dial || !dial.length) {
    return null;
  }

  return dial.map((dialect) => (
    <span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 mr-2 rounded-sm">
      {dialectLabels[dialect]}
    </span>
  ));
}

function renderCrossReferences(
  xref: Array<CrossReference> | undefined,
  ant: Array<CrossReference> | undefined
) {
  if (!(xref && xref.length) && !(ant && ant.length)) {
    return null;
  }

  const seeAlso: Array<JSX.Element | string> = [];

  if (xref) {
    for (const ref of xref) {
      if (seeAlso.length) {
        seeAlso.push(', ');
      }
      seeAlso.push(renderCrossReference(ref));
    }
  }

  if (ant) {
    for (const ref of ant) {
      if (seeAlso.length) {
        seeAlso.push(', ');
      }
      seeAlso.push(renderCrossReference(ref));
      seeAlso.push(' (antonym)');
    }
  }

  return <div class="text-base italic text-gray-600">See also: {seeAlso}</div>;
}

function renderCrossReference(xref: CrossReference) {
  const k = (xref as any).k as string | undefined;
  const r = (xref as any).r as string | undefined;

  let linkText: string;

  if (k && r) {
    linkText = `${k} (${r})`;
  } else {
    linkText = (k || r) as string;
  }

  if (xref.sense) {
    linkText += ` (sense ${xref.sense})`;
  }

  const hrefParts: Array<string> = [];
  if (k) {
    hrefParts.push(`k=${encodeURIComponent(k)}`);
  }
  if (r) {
    hrefParts.push(`r=${encodeURIComponent(r)}`);
  }
  if (xref.sense) {
    hrefParts.push(`sense=${xref.sense}`);
  }
  const href = `?${hrefParts.join('&')}`;

  return (
    <a class="hover:underline" href={href}>
      {linkText}
    </a>
  );
}
