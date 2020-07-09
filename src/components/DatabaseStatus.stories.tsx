import { h } from 'preact';
import { storiesOf } from '@storybook/preact';
import { DatabaseState, DownloadErrorCode } from '@birchill/hikibiki-data';

import { DatabaseStatus } from './DatabaseStatus';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      dataVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      initiallyExpanded
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{ state: 'checking', series: 'kanji', lastCheck: null }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
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
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
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
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
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
          lastCheck: null,
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
          state: 'idle',
          lastCheck: null,
        }}
        updateError={{
          name: 'DownloadError',
          message: 'Could not parse JSON in database file: #$%&#$%&',
          code: DownloadErrorCode.DatabaseFileInvalidJSON,
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
          retryCount: 0,
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
          state: 'idle',
          lastCheck: null,
        }}
        updateError={{
          name: 'OfflineError',
          message: '',
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('ok', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{ state: 'idle', lastCheck: new Date() }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
          state: 'checking',
          series: 'kanji',
          lastCheck: new Date(),
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
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
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
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
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
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
          lastCheck: new Date(),
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
          state: 'idle',
          lastCheck: new Date(),
        }}
        updateError={{
          name: 'DownloadError',
          message: 'Could not parse JSON in database file: #$%&#$%&',
          code: DownloadErrorCode.DatabaseFileInvalidJSON,
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
          retryCount: 0,
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        dataVersions={{
          kanji: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          radicals: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
          state: 'idle',
          lastCheck: new Date(),
        }}
        updateError={{
          name: 'OfflineError',
          message: '',
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('unavailable', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Unavailable}
      dataVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      initiallyExpanded
    />
  ))
  .add('collapsed', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{ state: 'checking', series: 'kanji', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
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
        }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
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
          lastCheck: new Date(),
        }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        dataVersions={{}}
        updateState={{
          state: 'idle',
          lastCheck: null,
        }}
        updateError={{
          name: 'Bad error',
          message: 'Something went wrong',
          code: DownloadErrorCode.DatabaseFileInvalidJSON,
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
          retryCount: 0,
        }}
      />
    </div>
  ))
  .add('disabled', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Empty}
      dataVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      disabled
    />
  ));
