import { h } from 'preact';
import type { Meta, StoryObj } from '@storybook/preact';

import { DatabaseStatus } from './DatabaseStatus';

const meta: Meta<typeof DatabaseStatus> = {
  title: 'Components/DatabaseStatus',
  component: DatabaseStatus,
};

export default meta;

export const initializing: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: 'init',
          version: null,
          updateState: { type: 'idle', lastCheck: null },
        },
      }}
      initiallyExpanded
    />
  ),
};

export const empty: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: { type: 'idle', lastCheck: null },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: { type: 'checking', series: 'kanji', lastCheck: null },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0,
              totalProgress: 0,
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
            state: 'empty',
            version: null,
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0.2,
              totalProgress: 0.8523452,
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
            state: 'empty',
            version: null,
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0.0,
              totalProgress: 0.5,
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
            state: 'empty',
            version: null,
            updateState: { type: 'idle', lastCheck: null },
            updateError: {
              name: 'DownloadError',
              message: 'Could not parse JSON in database file: #$%&#$%&',
              code: 'DatabaseFileInvalidJSON',
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
            state: 'empty',
            version: null,
            updateState: { type: 'idle', lastCheck: null },
            updateError: { name: 'OfflineError', message: '' },
          },
        }}
        initiallyExpanded
      />
    </div>
  ),
};

export const ok: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'checking',
              series: 'kanji',
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'idle',
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
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0,
              totalProgress: 0,
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0.8,
              totalProgress: 0.8523452,
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'idle',
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
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0.9,
              totalProgress: 0.5,
              lastCheck: new Date(),
            },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'idle',
              lastCheck: new Date(),
            },
            updateError: {
              name: 'DownloadError',
              message: 'Could not parse JSON in database file: #$%&#$%&',
              code: 'DatabaseFileInvalidJSON',
              nextRetry: new Date(new Date().getTime() + 30 * 1000),
              retryCount: 0,
            },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
          },
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: { type: 'idle', lastCheck: new Date() },
            updateError: { name: 'OfflineError', message: '' },
          },
          radicals: {
            state: 'ok',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
              databaseVersion: '2019-197',
              dateOfCreation: '2019-07-16',
              lang: 'en',
            },
            updateState: {
              type: 'idle',
              lastCheck: new Date(),
            },
          },
        }}
        initiallyExpanded
      />
    </div>
  ),
};

export const unavailable: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: 'unavailable',
          version: null,
          updateState: { type: 'idle', lastCheck: null },
        },
      }}
      initiallyExpanded
    />
  ),
};

export const collapsed: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <div>
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: { type: 'idle', lastCheck: null },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: { type: 'checking', series: 'kanji', lastCheck: null },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0,
              totalProgress: 0,
              lastCheck: null,
            },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: {
              type: 'updating',
              series: 'kanji',
              version: {
                major: 1,
                minor: 0,
                patch: 0,
                databaseVersion: '2019-197',
                dateOfCreation: '2019-07-16',
                lang: 'en',
              },
              fileProgress: 0.9,
              totalProgress: 0.5,
              lastCheck: null,
            },
          },
        }}
      />
      <DatabaseStatus
        series="kanji"
        dataState={{
          kanji: {
            state: 'empty',
            version: null,
            updateState: { type: 'idle', lastCheck: null },
            updateError: {
              name: 'Bad error',
              message: 'Something went wrong',
              code: 'DatabaseFileInvalidJSON',
              nextRetry: new Date(new Date().getTime() + 30 * 1000),
              retryCount: 0,
            },
          },
        }}
      />
    </div>
  ),
};

export const disabled: StoryObj<typeof DatabaseStatus> = {
  render: () => (
    <DatabaseStatus
      series="kanji"
      dataState={{
        kanji: {
          state: 'empty',
          version: null,
          updateState: { type: 'idle', lastCheck: null },
        },
      }}
      disabled
    />
  ),
};
