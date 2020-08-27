import { h, FunctionalComponent } from 'preact';
import { NameResult } from '@birchill/hikibiki-data';

interface Props extends NameResult {
  lang?: string;
}

export const NameEntry: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="name-entry text-xl" lang="ja">
      {props.k?.join(', ')},{props.r.join(', ')}
      <span class="text-gray-300">
        {props.tr.map((tr) => tr.det).join(', ')}
      </span>
    </div>
  );
};
