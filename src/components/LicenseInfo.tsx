import { h, JSX, FunctionalComponent } from 'preact';
import { DataVersion, MajorDataSeries } from '@birchill/hikibiki-data';

type Props = {
  series: MajorDataSeries;
  version: DataVersion | null;
};

const dictInfoLinks: { [series in MajorDataSeries]: string } = {
  words: 'https://www.edrdg.org/jmdict/edict_doc.html',
  kanji: 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project',
  names: 'https://www.edrdg.org/enamdict/enamdict_doc.html',
};

const dictNames: { [series in MajorDataSeries]: string } = {
  words: 'JMdict',
  kanji: 'KANJIDIC',
  names: 'ENAMDICT/JMnedict',
};

export const LicenseInfo: FunctionalComponent<Props> = ({
  series,
  version,
}: Props) => {
  const linkStyles = {
    class: 'text-orange-800 visited:text-orange-800 underline',
    style: { textDecorationStyle: 'dotted' } as JSX.CSSProperties,
  };

  let versionInformation = '';
  if (version && version.databaseVersion !== 'n/a') {
    versionInformation = ` version ${version.databaseVersion} generated on ${version.dateOfCreation}`;
  } else if (version) {
    versionInformation = ` generated on ${version.dateOfCreation}`;
  }

  return (
    <div class="mb-6">
      Includes data from{' '}
      <a
        href={dictInfoLinks[series]}
        target="_blank"
        rel="noopener"
        {...linkStyles}
      >
        {dictNames[series]}
      </a>
      {versionInformation}. This data is the property of the{' '}
      <a
        href="https://www.edrdg.org/"
        target="_blank"
        rel="noopener"
        {...linkStyles}
      >
        Electronic Dictionary Research and Development Group
      </a>
      , and is used in conformance with the Group's{' '}
      <a
        href="https://www.edrdg.org/edrdg/licence.html"
        target="_blank"
        rel="noopener"
        {...linkStyles}
      >
        licence
      </a>
      .
    </div>
  );
};
