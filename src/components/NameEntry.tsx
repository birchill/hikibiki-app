import { Fragment, type FunctionalComponent } from 'preact';
import { NameResult, NameTranslation, NameType } from '@birchill/jpdict-idb';

interface Props extends NameResult {
  lang?: string;
}

export const NameEntry: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="name-entry text-xl leading-normal mt-2 mb-2">
      {renderJapaneseName(props)}
      <span class="text-gray-500 text-lg text-light" lang={props.lang}>
        {props.tr.map(renderTranslation)}
      </span>
    </div>
  );
};

function renderJapaneseName(name: NameResult) {
  if (!name.k) {
    return (
      <span class="mr-10 font-bold" lang="ja">
        {renderLinkedNames(name.r)}
      </span>
    );
  }

  return (
    <Fragment>
      <span class="mr-10 font-bold" lang="ja">
        {renderLinkedNames(name.k)}
      </span>
      <span class="mr-10 text-gray-700" lang="ja">
        {renderLinkedNames(name.r)}
      </span>
    </Fragment>
  );
}

function renderLinkedNames(names: Array<string>) {
  return names.map((name, i) => (
    <Fragment>
      <a class="hover:underline" href={`?q=${name}`}>
        {name}
      </a>
      {i < names.length - 1 ? '、' : ''}
    </Fragment>
  ));
}

function renderTranslation(tr: NameTranslation) {
  return (
    <span class="translation mr-10">
      {tr.type?.map(renderType)}
      {`${tr.det.join(', ')}`}
    </span>
  );
}

function renderType(type: NameType) {
  let title: string;
  let emoji: string;

  if (typeMeta.hasOwnProperty(type)) {
    ({ long: title, emoji } = typeMeta[type]);
  } else {
    title = `Unrecognized name type: ${type}`;
    emoji = `(${type})`;
  }

  return (
    <span class="trans-type mr-2" title={title}>
      {emoji}
    </span>
  );
}

type TypeDescription = {
  short: string;
  long: string;
  emoji: string;
};

const typeMeta: { [type in NameType]: TypeDescription } = {
  char: {
    short: 'character',
    long: 'Character',
    emoji: '🎭',
  },
  company: {
    short: 'company',
    long: 'Company name',
    emoji: '🏢',
  },
  creat: {
    short: 'creature',
    long: 'Living creature',
    emoji: '🐍',
  },
  doc: {
    short: 'document',
    long: 'Document',
    emoji: '📄',
  },
  dei: {
    short: 'deity',
    long: 'Deity',
    emoji: '🔱',
  },
  ev: {
    short: 'event',
    long: 'Event',
    emoji: '🎟️',
  },
  fem: {
    short: 'female',
    long: 'Female given name',
    emoji: '👩',
  },
  fict: {
    short: 'fiction',
    long: 'A work of fiction',
    emoji: '📖',
  },
  given: {
    short: 'given',
    long: 'Given name, gender not specified',
    emoji: '📛',
  },
  group: {
    short: 'group',
    long: 'Group (music group, band etc.)',
    emoji: '🎺',
  },
  leg: {
    short: 'legend',
    long: 'Legend',
    emoji: '🐲',
  },
  masc: {
    short: 'male',
    long: 'Male given name',
    emoji: '🧔',
  },
  myth: {
    short: 'myth',
    long: 'Myth',
    emoji: '🦄',
  },
  obj: {
    short: 'object',
    long: 'Object',
    emoji: '🧱',
  },
  org: {
    short: 'organization',
    long: 'Organization name',
    emoji: '🏘️',
  },
  oth: {
    short: 'other',
    long: 'Other',
    emoji: '他',
  },
  person: {
    short: 'person',
    long: 'Full name of a particular person',
    emoji: '🧍',
  },
  place: {
    short: 'place',
    long: 'Place name',
    emoji: '🗺️',
  },
  product: {
    short: 'product',
    long: 'Product name',
    emoji: '🧴',
  },
  relig: {
    short: 'religion',
    long: 'Religion',
    emoji: '㊪',
  },
  serv: {
    short: 'service',
    long: 'Service',
    emoji: '🈂️',
  },
  ship: {
    short: 'ship',
    long: 'Ship',
    emoji: '🚢',
  },
  station: {
    short: 'station',
    long: 'Railway station',
    emoji: '🚉',
  },
  surname: {
    short: 'surname',
    long: 'Family or surname',
    emoji: '👪',
  },
  unclass: {
    short: 'unclassified',
    long: 'Unclassified name',
    emoji: '🚫',
  },
  work: {
    short: 'work',
    long: 'Work of art, literature, music, etc.',
    emoji: '🖼️',
  },
};
