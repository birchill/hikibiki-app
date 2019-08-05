import { h } from 'preact';
import { storiesOf } from '@storybook/preact';

import { DatabaseStatus } from './DatabaseStatus';
import { DatabaseState } from '../database';
import { DownloadErrorCode } from '../download';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      updateState={{ state: 'idle', lastCheck: null }}
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        updateState={{ state: 'idle', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        updateState={{ state: 'checking', lastCheck: null }}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
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
        updateState={{
          state: 'downloading',
          progress: 0.85,
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
    <DatabaseStatus
      databaseState={DatabaseState.Ok}
      databaseVersion={{
        major: 1,
        minor: 0,
        patch: 0,
        databaseVersion: '2019-197',
        dateOfCreation: '2019-07-16',
      }}
      updateState={{ state: 'idle', lastCheck: new Date() }}
    />
  ))
  .add('out-of-date', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      updateState={{ state: 'idle', lastCheck: null }}
    />
  ));
