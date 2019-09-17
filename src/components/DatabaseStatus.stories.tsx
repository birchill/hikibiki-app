import { h } from 'preact';
import { storiesOf } from '@storybook/preact';

import { DatabaseStatus, PanelState } from './DatabaseStatus';
import { DatabaseState } from '../database';
import { DownloadErrorCode } from '../download';

storiesOf('Components|DatabaseStatus', module)
  .add('initializing', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Initializing}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      panelState={PanelState.Expanded}
    />
  ))
  .add('empty', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
        panelState={PanelState.Expanded}
      />
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'checking', dbName: 'kanjidb', lastCheck: null }}
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        }}
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        panelState={PanelState.Expanded}
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
        }}
        panelState={PanelState.Expanded}
      />
    </div>
  ))
  .add('out-of-date', () => (
    <DatabaseStatus
      databaseState={DatabaseState.OutOfDate}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      panelState={PanelState.Expanded}
    />
  ))
  .add('collapsed', () => (
    <div>
      <DatabaseStatus
        databaseState={DatabaseState.Empty}
        databaseVersions={{}}
        updateState={{ state: 'idle', lastCheck: null }}
        panelState={PanelState.Collapsed}
      />
    </div>
  ))
  .add('disabled', () => (
    <DatabaseStatus
      databaseState={DatabaseState.Empty}
      databaseVersions={{}}
      updateState={{ state: 'idle', lastCheck: null }}
      panelState={PanelState.Disabled}
    />
  ));
