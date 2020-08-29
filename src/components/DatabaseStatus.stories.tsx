import { h } from 'preact';
import { storiesOf } from '@storybook/preact';
import { DataSeriesState, DownloadErrorCode } from '@birchill/hikibiki-data';

import { DatabaseStatus } from './DatabaseStatus';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: DataSeriesState.Initializing,
          version: null,
          updateState: { state: 'idle', lastCheck: null },
        },
      }}
      initiallyExpanded
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: { state: 'idle', lastCheck: null },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'checking',
              series: 'kanji',
              lastCheck: null,
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'downloading',
              progress: 0,
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              lastCheck: null,
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'downloading',
              progress: 0.8523452,
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              lastCheck: null,
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'updatingdb',
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              progress: 0.5,
              lastCheck: null,
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'idle',
              lastCheck: null,
            },
            updateError: {
              name: 'DownloadError',
              message: 'Could not parse JSON in database file: #$%&#$%&',
              code: DownloadErrorCode.DatabaseFileInvalidJSON,
              nextRetry: new Date(new Date().getTime() + 30 * 1000),
              retryCount: 0,
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'idle',
              lastCheck: null,
            },
            updateError: {
              name: 'OfflineError',
              message: '',
            },
          },
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('ok', () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'checking',
              series: 'kanji',
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'downloading',
              progress: 0,
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'downloading',
              progress: 0.8523452,
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'updatingdb',
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              progress: 0.5,
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
            updateError: {
              name: 'DownloadError',
              message: 'Could not parse JSON in database file: #$%&#$%&',
              code: DownloadErrorCode.DatabaseFileInvalidJSON,
              nextRetry: new Date(new Date().getTime() + 30 * 1000),
              retryCount: 0,
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
            updateError: {
              name: 'OfflineError',
              message: '',
            },
          },
          radicals: {
            state: DataSeriesState.Ok,
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              state: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('unavailable', () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: DataSeriesState.Unavailable,
          version: null,
          updateState: { state: 'idle', lastCheck: null },
        },
      }}
      initiallyExpanded
    />
  ))
  .add('collapsed', () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: { state: 'idle', lastCheck: null },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'checking',
              series: 'kanji',
              lastCheck: null,
            },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'downloading',
              progress: 0,
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              lastCheck: null,
            },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'updatingdb',
              series: 'kanji',
              downloadVersion: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              progress: 0.5,
              lastCheck: null,
            },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: DataSeriesState.Empty,
            version: null,
            updateState: {
              state: 'idle',
              lastCheck: null,
            },
            updateError: {
              name: 'Bad error',
              message: 'Something went wrong',
              code: DownloadErrorCode.DatabaseFileInvalidJSON,
              nextRetry: new Date(new Date().getTime() + 30 * 1000),
              retryCount: 0,
            },
          },
        }}
      />
    </div>
  ))
  .add('disabled', () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: DataSeriesState.Empty,
          version: null,
          updateState: { state: 'idle', lastCheck: null },
        },
      }}
      disabled
    />
  ));
