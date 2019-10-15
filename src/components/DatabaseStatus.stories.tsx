import { h } from 'preact';
import { storiesOf } from '@storybook/preact';
import { DatabaseState, DownloadErrorCode } from '@birchill/hikibiki-data';

import { DatabaseStatus } from './DatabaseStatus';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      initiallyExpanded
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'checking', dbName: 'kanjidb', lastCheck: null }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'downloading',
          progress: 0,
          dbName: 'kanjidb',
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
        databaseVersions={{}}
        updateState={{
          state: 'downloading',
          progress: 0.8523452,
          dbName: 'kanjidb',
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
        databaseVersions={{}}
        updateState={{
          state: 'updatingdb',
          dbName: 'kanjidb',
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
        databaseVersions={{}}
        updateState={{
          state: 'error',
          dbName: 'kanjidb',
          error: {
            name: 'DownloadError',
            message: 'Could not parse JSON in database file: #$%&#$%&',
            code: DownloadErrorCode.DatabaseFileInvalidJSON,
          },
          lastCheck: null,
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'offline',
          lastCheck: null,
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('ok', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
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
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
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
          dbName: 'kanjidb',
          lastCheck: new Date(),
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
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
          dbName: 'kanjidb',
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
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
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
          dbName: 'kanjidb',
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
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
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
          dbName: 'kanjidb',
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
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
          state: 'error',
          dbName: 'kanjidb',
          error: {
            name: 'DownloadError',
            message: 'Could not parse JSON in database file: #$%&#$%&',
            code: DownloadErrorCode.DatabaseFileInvalidJSON,
          },
          lastCheck: new Date(),
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
        }}
        initiallyExpanded
      />
      <DatabaseStatus
        databaseState={DatabaseState.Ok}
        databaseVersions={{
          kanjidb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
          bushudb: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
            lang: 'en',
          },
        }}
        updateState={{
          state: 'offline',
          lastCheck: new Date(),
        }}
        initiallyExpanded
      />
    </div>
  ))
  .add('out-of-date', () => (
    <DatabaseStatus
      databaseState={DatabaseState.OutOfDate}
      databaseVersions={{
        kanjidb: {
          major: 1,
          minor: 0,
          patch: 0,
          databaseVersion: '2019-197',
          dateOfCreation: '2019-07-16',
          lang: 'en',
        },
        bushudb: {
          major: 1,
          minor: 0,
          patch: 0,
          databaseVersion: '2019-197',
          dateOfCreation: '2019-07-16',
          lang: 'en',
        },
      }}
      updateState={{ state: 'idle', lastCheck: null }}
      initiallyExpanded
    />
  ))
  .add('collapsed', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'checking', dbName: 'kanjidb', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'downloading',
          progress: 0,
          dbName: 'kanjidb',
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
        databaseVersions={{}}
        updateState={{
          state: 'updatingdb',
          dbName: 'kanjidb',
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
        databaseVersions={{}}
        updateState={{
          state: 'error',
          dbName: 'kanjidb',
          error: { name: 'Bad error', message: 'Something went wrong' },
          lastCheck: null,
          nextRetry: new Date(new Date().getTime() + 30 * 1000),
        }}
      />
    </div>
  ))
  .add('disabled', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Empty}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      disabled
    />
  ));
