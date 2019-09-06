import { h } from 'preact';
import { storiesOf } from '@storybook/preact';

import { DatabaseStatus } from './DatabaseStatus';
import { DatabaseState } from '../database';
import { DownloadErrorCode } from '../download';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'checking', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'downloading',
          progress: 0,
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: null,
        }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'downloading',
          progress: 0.8523452,
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: null,
        }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'updatingdb',
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: null,
        }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{
          state: 'error',
          error: {
            name: 'DownloadError',
            message: 'Could not parse JSON in database file: #$%&#$%&',
            code: DownloadErrorCode.DatabaseFileInvalidJSON,
          },
          lastCheck: null,
        }}
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
          },
        }}
        updateState={{ state: 'idle', lastCheck: new Date() }}
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
          },
        }}
        updateState={{ state: 'checking', lastCheck: new Date() }}
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
          },
        }}
        updateState={{
          state: 'downloading',
          progress: 0,
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: new Date(),
        }}
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
          },
        }}
        updateState={{
          state: 'downloading',
          progress: 0.8523452,
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: new Date(),
        }}
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
          },
        }}
        updateState={{
          state: 'updatingdb',
          downloadVersion: {
            major: 1,
            minor: 0,
            patch: 0,
            databaseVersion: '2019-197',
            dateOfCreation: '2019-07-16',
          },
          lastCheck: new Date(),
        }}
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
          },
        }}
        updateState={{
          state: 'error',
          error: {
            name: 'DownloadError',
            message: 'Could not parse JSON in database file: #$%&#$%&',
            code: DownloadErrorCode.DatabaseFileInvalidJSON,
          },
          lastCheck: new Date(),
        }}
      />
    </div>
  ))
  .add('out-of-date', () => (
    <DatabaseStatus
      databaseState={DatabaseState.OutOfDate}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
    />
  ));
