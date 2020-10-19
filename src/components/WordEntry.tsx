import { h, Fragment, FunctionalComponent } from 'preact';
import { WordResult } from '@birchill/hikibiki-data';

export const WordEntry: FunctionalComponent<WordResult> = (
  props: WordResult
) => {
  return <div class="word-entry text-xl mt-2 mb-2">{renderHeading(props)}</div>;
};

function renderHeading(result: WordResult): JSX.Element {
  if (!result.k) {
    return (
      <span class="mr-10 font-bold" lang="ja">
        {renderListWithMatches(result.r)}
      </span>
    );
  }

  return (
    <Fragment>
      <span class="mr-10 font-bold" lang="ja">
        {renderListWithMatches(result.k)}
      </span>
      <span class="mr-10 text-gray-700" lang="ja">
        {renderListWithMatches(result.r)}
      </span>
    </Fragment>
  );
}

function renderListWithMatches<
  T extends WordResult['k'][0] | WordResult['r'][0]
>(array: Array<T>) {
  // We don't use join() be cause we want to make sure the comma (、) takes on
  // the same shading as the preceding item.
  return array.map((item, i) => (
    <span class={item.match ? '' : 'text-gray-400 font-normal'}>
      {item.ent}
      {i < array.length - 1 ? '、' : ''}
    </span>
  ));
}
