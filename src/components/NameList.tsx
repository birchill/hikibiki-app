import type { FunctionalComponent } from 'preact';
import { NameResult } from '@birchill/jpdict-idb';

import { NameEntry } from './NameEntry';

type Props = {
  entries: Array<NameResult>;
  lang?: string;
};

export const NameList: FunctionalComponent<Props> = (props: Props) => {
  if (!props.entries.length) {
    return null;
  }

  return (
    <div class="name-list bg-white rounded-lg border-gray-300 border px-10 sm:px-20 py-10 mb-12 leading-normal">
      {props.entries.map((entry) =>
        NameEntry({
          ...entry,
          lang: props.lang,
        })
      )}
    </div>
  );
};
