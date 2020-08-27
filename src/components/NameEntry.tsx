import { h, Fragment, FunctionalComponent } from 'preact';
import { NameResult, NameTranslation, NameType } from '@birchill/hikibiki-data';

interface Props extends NameResult {
  lang?: string;
}

export const NameEntry: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="name-entry text-xl mt-2 mb-2">
      {renderJapaneseName(props)}
      <span class="text-gray-500 text-lg text-light" lang={props.lang}>
        {props.tr.map(renderTranslation)}
      </span>
    </div>
  );
};

function renderJapaneseName(name: NameResult): JSX.Element {
  if (!name.k) {
    return (
      <span class="mr-10 font-bold" lang="ja">
        {name.r.join('、')}
      </span>
    );
  }

  return (
    <Fragment>
      <span class="mr-10 font-bold" lang="ja">
        {name.k.join('、')}
      </span>
      <span class="mr-10 text-gray-700" lang="ja">
        {name.r.join('、')}
      </span>
    </Fragment>
  );
}

function renderTranslation(tr: NameTranslation): JSX.Element {
  return (
    <span class="translation mr-10">
      {tr.type?.map(renderType)}
      {`${tr.det.join(', ')}`}
    </span>
  );
}

function renderType(type: NameType): JSX.Element {
  return (
    <span class="trans-type mr-2" title={typeMeta[type].long}>
      {typeMeta[type].emoji}
    </span>
  );
}

type TypeDescription = {
  short: string;
  long: string;
  emoji: string;
};

const typeMeta: { [type in NameType]: TypeDescription } = {
  surname: {
    short: 'surname',
    long: 'Family or surname',
    emoji: '👪',
  },
  place: {
    short: 'place',
    long: 'Place name',
    emoji: '🗺️',
  },
  unclass: {
    short: 'unclassified',
    long: 'Unclassified name',
    emoji: '🚫',
  },
  company: {
    short: 'company',
    long: 'Company name',
    emoji: '🏢',
  },
  product: {
    short: 'product',
    long: 'Product name',
    emoji: '🧴',
  },
  work: {
    short: 'work',
    long: 'Work of art, literature, music, etc.',
    emoji: '🖼️',
  },
  masc: {
    short: 'male',
    long: 'Male given name',
    emoji: '🧔',
  },
  fem: {
    short: 'female',
    long: 'Female given name',
    emoji: '👩',
  },
  person: {
    short: 'person',
    long: 'Full name of a particular person',
    emoji: '🧍',
  },
  given: {
    short: 'given',
    long: 'Given name, gender not specified',
    emoji: '📛',
  },
  station: {
    short: 'station',
    long: 'Railway station',
    emoji: '🚉',
  },
  org: {
    short: 'organization',
    long: 'Organization name',
    emoji: '🏘️',
  },
  ok: {
    short: 'old',
    long: 'Old or irregular kana form',
    emoji: '👴',
  },
};
