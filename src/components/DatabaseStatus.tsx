import { h, FunctionalComponent, JSX } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState } from '../database';
import { CloneableUpdateState } from '../update-state';

export const enum PanelState {
  Disabled,
  Collapsed,
  Expanded,
}

type Props = {
  databaseState: DatabaseState;
  databaseVersions: {
    kanjidb?: DatabaseVersion;
    bushudb?: DatabaseVersion;
  };
  updateState: CloneableUpdateState;
  onUpdate?: () => void;
  onCancel?: () => void;
  onDestroy?: () => void;
  onToggle?: () => void;
  panelState: PanelState;
};

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div className="database-status bg-orange-200 rounded-lg px-10 max-w-xxl mx-auto text-orange-1000 overflow-auto">
      <div className="my-10 flex flex-row items-center">
        <div class="checkbox-orange">
          <input
            type="checkbox"
            id="kanjidb-check"
            checked={props.panelState !== PanelState.Disabled}
          />
          <label for="kanjidb-check" />
        </div>
        <h2
          className="flex-grow text-lg tracking-tight text-center text-lg font-semibold cursor-pointer"
          onClick={props.onToggle}
        >
          Kanji
        </h2>
        {renderSettingsIcon(props)}
      </div>
      {props.panelState !== PanelState.Expanded ? null : (
        <div className="mb-10">{renderBody(props)}</div>
      )}
    </div>
  );
};

function renderSettingsIcon(props: Props) {
  if (props.panelState === PanelState.Disabled) {
    return null;
  }

  let containerStyles =
    props.panelState === PanelState.Collapsed ? 'text-orange-400' : undefined;
  containerStyles +=
    ' border-0 bg-transparent rounded-full p-6 -m-6 hover:bg-orange-100 hover:text-orange-1000';

  return (
    <button class={containerStyles}>
      <svg class="w-10 h-10 fill-current" viewBox="0 0 8 8">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M6.97 3.67L7 4c0 .12-.02.22-.03.33l.94.7c.08.06.1.2.06.3l-.22.54c-.05.1-.16.19-.25.17l-1.17-.18c-.14.18-.3.33-.47.47l.18 1.17c.01.1-.06.2-.17.25l-.54.22c-.1.05-.24.02-.3-.06l-.7-.95c-.1.01-.22.04-.33.04-.12 0-.22-.02-.33-.03l-.7.94c-.06.08-.19.1-.3.06l-.54-.22c-.1-.04-.19-.16-.17-.25l.18-1.16a3.2 3.2 0 0 1-.48-.48L.5 6.04c-.1.02-.2-.06-.25-.17l-.22-.54c-.05-.1-.02-.24.05-.3l.96-.7C1.02 4.22 1 4.11 1 4s.02-.22.03-.33l-.95-.7c-.07-.06-.1-.2-.05-.3l.22-.54c.04-.1.16-.18.26-.17l1.15.18c.15-.18.3-.33.48-.47L1.96.5c-.02-.1.06-.2.17-.25l.54-.22c.1-.05.24-.02.3.06l.7.95C3.78 1.03 3.9 1 4 1s.22.03.33.04l.7-.95c.06-.08.19-.1.3-.06l.54.22c.1.05.18.16.17.25l-.18 1.17c.17.14.33.3.47.47l1.17-.18c.1-.01.2.06.25.17l.22.54c.05.1.02.24-.06.3l-.94.7zM4 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
        />
      </svg>
    </button>
  );
}

function renderBody(props: Props) {
  const { databaseState, updateState, databaseVersions } = props;
  if (databaseState === DatabaseState.Initializing) {
    return <div class="text-orange-1000">Initializing&hellip;</div>;
  }

  const buttonStyles =
    'bg-orange-100 font-semibold text-center px-10 py-6 rounded border-0 shadow-orange-default hover:bg-orange-50';
  const disabledButtonStyles =
    'bg-grey-100 text-gray-600 font-semibold text-center px-10 py-6 rounded border-0 shadow';

  switch (updateState.state) {
    case 'idle': {
      let status: string | JSX.Element;
      // TODO: We shouldn't need to check if kanjidb is available or not.
      //
      // If the databaseState is not Empty or Initializing (checked above) we
      // should be able to assume it is set, but we can't because of the way we
      // update from the worker where it first notifies us of the updated
      // database state, and then the updated database versions. We should
      // really fix the worker to notify of both things at once.
      if (databaseState === DatabaseState.Empty || !databaseVersions.kanjidb) {
        status = 'No database';
      } else {
        const { major, minor, patch } = databaseVersions.kanjidb!;
        status = (
          <div>
            <div>
              Version {major}.{minor}.{patch}.
            </div>
            {updateState.lastCheck ? (
              <div>Last check {formatDate(updateState.lastCheck)}.</div>
            ) : null}
          </div>
        );
      }

      return (
        <div>
          {renderDatabaseSummary(props)}
          <div class="flex items-end">
            <div class="flex-grow mr-8 italic">{status}</div>
            <div>
              <button class={buttonStyles} onClick={props.onUpdate}>
                Check for updates
              </button>
            </div>
          </div>
        </div>
      );
    }

    case 'checking':
      return (
        <div class="flex">
          <div class="flex-grow mr-8 text-orange-1000">
            Checking for updates&hellip;
          </div>
          <button class={buttonStyles} onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      );

    case 'downloading': {
      const { major, minor, patch } = updateState.downloadVersion;
      const { progress } = updateState;
      const dbLabel =
        updateState.dbName === 'kanjidb' ? 'kanji data' : 'radical data';
      const label = `Downloading ${dbLabel} version ${major}.${minor}.${patch} (${Math.round(
        progress * 100
      )}%)`;
      return (
        <div class="flex">
          <div class="flex-grow mr-8 details">
            <div class="overlaid-progress progress">
              <progress max="100" value={progress * 100} id="update-progress" />
              <label for="update-progress">{label}&hellip;</label>
            </div>
          </div>
          <button class={buttonStyles} onClick={props.onCancel}>
            Cancel
          </button>
        </div>
      );
    }

    case 'updatingdb': {
      const { major, minor, patch } = updateState.downloadVersion;
      const dbLabel =
        updateState.dbName === 'kanjidb'
          ? 'kanji database'
          : 'radical database';
      const label = `Updating ${dbLabel} to version ${major}.${minor}.${patch}`;
      return (
        <div class="flex">
          <div class="flex-grow mr-8 details">
            <div class="overlaid-progress progress">
              <progress id="update-progress" />
              <label for="update-progress">{label}&hellip;</label>
            </div>
          </div>
          <button class={disabledButtonStyles} disabled>
            Cancel
          </button>
        </div>
      );
    }

    case 'error':
      return (
        <div>
          {renderDatabaseSummary(props)}
          <div class="flex error bg-red-100 p-8 rounded border border-orange-1000">
            <div class="flex-grow mr-8">
              Update failed: {updateState.error.message}
            </div>
            <div>
              <button class={buttonStyles} onClick={props.onUpdate}>
                Retry
              </button>
            </div>
          </div>
        </div>
      );
  }

  return null;
}

function renderDatabaseSummary(props: Props): JSX.Element | null {
  if (!props.databaseVersions.kanjidb) {
    return null;
  }

  const linkStyles = {
    class: 'text-orange-800 visited:text-orange-800 underline',
    style: { 'text-decoration-style': 'dotted' },
  };

  const kanjiDbVersion = props.databaseVersions.kanjidb;

  return (
    <div class="mb-6">
      Includes data from{' '}
      <a
        href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
        target="_blank"
        {...linkStyles}
      >
        KANJIDIC
      </a>{' '}
      version {kanjiDbVersion.databaseVersion} generated on{' '}
      {kanjiDbVersion.dateOfCreation}. This data is the property of the{' '}
      <a href="https://www.edrdg.org/" target="_blank" {...linkStyles}>
        Electronic Dictionary Research and Development Group
      </a>
      , and is used in conformance with the Group's{' '}
      <a
        href="https://www.edrdg.org/edrdg/licence.html"
        target="_blank"
        {...linkStyles}
      >
        licence
      </a>
      .
    </div>
  );
}

// Our special date formatting that is a simplified ISO 8601 in local time
// without seconds.
function formatDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
