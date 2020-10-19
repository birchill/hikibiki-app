import { h, Fragment, FunctionalComponent } from 'preact';
import { WordResult } from '@birchill/hikibiki-data';

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
  if (!result.k) {
    return (
      <div class="font-bold" lang="ja">
        {renderListWithMatches(result.r)}
      </div>
    );
  }

  return (
    <div lang="ja">
      <span class="font-bold mr-8">{renderListWithMatches(result.k)}</span>
      <span class="text-gray-700 text-lg">
        {renderListWithMatches(result.r)}
      </span>
    </div>
  );
}

function renderListWithMatches<
  T extends WordResult['k'][0] | WordResult['r'][0]
>(array: Array<T>) {
  // We don't use join() be cause we want to make sure the comma (、) takes on
  // the same shading as the preceding item.
  return array.map((item, i) => (
    <span class={item.match ? '' : 'text-gray-400 font-normal'}>
      {renderHeadword(item)}
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

function renderSenses(senses: WordResult['s']) {
  return <ol class="ml-8">{senses.map(renderSense)}</ol>;
}

function renderSense(sense: WordResult['s'][0]) {
  return (
    <li lang={sense.lang || 'en'}>{sense.g.map((g) => g.str).join('; ')}</li>
  );
}
