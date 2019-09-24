import { h, Fragment, FunctionalComponent, JSX } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState } from '../database';
import { CloneableUpdateState } from '../update-state';

import { Checkbox } from './Checkbox';
import { ProgressWithLabel } from './ProgressWithLabel';
import { ReferencesConfig } from './ReferencesConfig';

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
  panelState: PanelState;
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
  onUpdate?: () => void;
  onCancel?: () => void;
  onDestroy?: () => void;
  onToggleActive?: () => void;
  onToggleSettings?: () => void;
  onToggleReference?: (ref: string, state: boolean) => void;
  onToggleLink?: (ref: string, state: boolean) => void;
};

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  const panelStyles =
    'bg-orange-200 rounded-lg px-10 max-w-3xl mx-auto mb-12 text-orange-1000 overflow-auto';
  const disabledPanelStyles =
    'bg-white rounded-lg px-10 max-w-3xl mx-auto mb-12 text-gray-600 overflow-auto';

  const { databaseState, updateState, panelState, onToggleActive } = props;

  // We the database is empty and we're still downloading it, we should let the
  // user know we're doing something if the panel is collapsed.
  let heading = 'Kanji';
  if (
    panelState === PanelState.Collapsed &&
    databaseState === DatabaseState.Empty
  ) {
    switch (updateState.state) {
      case 'checking':
      case 'downloading':
        heading += ' (downloading…)';
        break;

      case 'updatingdb':
        heading += ' (updating…)';
        break;
    }
  }

  return (
    <div
      className={
        panelState === PanelState.Disabled ? disabledPanelStyles : panelStyles
      }
    >
      <div className="my-10 flex flex-row items-center">
        <Checkbox
          id="kanjidb-enabled"
          checked={panelState !== PanelState.Disabled}
          onChange={onToggleActive}
          theme={panelState === PanelState.Disabled ? 'gray' : 'orange'}
        />
        <h2
          className="flex-grow text-lg tracking-tight text-center text-lg font-semibold cursor-pointer"
          onClick={onToggleActive}
        >
          {heading}
        </h2>
        {renderSettingsIcon(props)}
      </div>
      {panelState !== PanelState.Expanded ? null : (
        <div className="mb-10">{renderBody(props)}</div>
      )}
    </div>
  );
};

function renderSettingsIcon(props: Props) {
  let containerStyles =
    props.panelState === PanelState.Collapsed ? 'text-orange-400' : undefined;
  containerStyles +=
    ' bg-transparent rounded-full p-6 -m-6 hover:bg-orange-100 hover:text-orange-1000 border-2 border-transparent border-dotted focus:outline-none focus:border-orange-400';

  if (props.panelState === PanelState.Disabled) {
    containerStyles += ' invisible pointer-events-none';
  }

  return (
    <button class={containerStyles} onClick={props.onToggleSettings}>
      <svg class="w-10 h-10" viewBox="0 0 16 16">
        <title>Settings</title>
        <use width="16" height="16" href="#cog" />
      </svg>
    </button>
  );
}

function renderBody(props: Props) {
  const { databaseState } = props;
  if (databaseState === DatabaseState.Initializing) {
    return 'Initializing…';
  }

  return (
    <Fragment>
      {renderLicenseInfo(props)}
      {renderDatabaseStatus(props)}
      {databaseState !== DatabaseState.Empty ? (
        <ReferencesConfig
          enabledReferences={props.enabledReferences}
          enabledLinks={props.enabledLinks}
          onToggleReference={props.onToggleReference}
          onToggleLink={props.onToggleLink}
        />
      ) : null}
    </Fragment>
  );
}

function renderLicenseInfo(props: Props): JSX.Element {
  const linkStyles = {
    class: 'text-orange-800 visited:text-orange-800 underline',
    style: { 'text-decoration-style': 'dotted' },
  };

  const kanjiDbVersion = props.databaseVersions.kanjidb;

  let versionInformation = '';
  if (kanjiDbVersion) {
    versionInformation = ` version ${kanjiDbVersion.databaseVersion} generated on ${kanjiDbVersion.dateOfCreation}`;
  }

  return (
    <div class="mb-6">
      Includes data from{' '}
      <a
        href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
        target="_blank"
        {...linkStyles}
      >
        KANJIDIC
      </a>
      {versionInformation}. This data is the property of the{' '}
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

function renderDatabaseStatus(props: Props): JSX.Element | null {
  const { databaseState, updateState, databaseVersions } = props;

  const buttonStyles =
    'bg-orange-100 font-semibold text-center px-10 py-6 self-end leading-none rounded border-0 shadow-orange-default hover:bg-orange-50';
  const disabledButtonStyles =
    'bg-gray-100 text-gray-600 font-semibold text-center px-10 py-6 self-end leading-none rounded border-0 shadow cursor-default';

  switch (updateState.state) {
    case 'idle': {
      let status: string | JSX.Element;
      if (databaseState === DatabaseState.Empty) {
        status = 'No database';
      } else {
        const { major, minor, patch } = databaseVersions.kanjidb!;
        status = (
          <Fragment>
            <div>
              Version {major}.{minor}.{patch}.
            </div>
            {updateState.lastCheck ? (
              <div>Last check {formatDate(updateState.lastCheck)}.</div>
            ) : null}
          </Fragment>
        );
      }

      return (
        <div class="flex mb-10">
          <div class="flex-grow mr-8 italic">{status}</div>
          <div class="self-end">
            <button class={buttonStyles} onClick={props.onUpdate}>
              Check for updates
            </button>
          </div>
        </div>
      );
    }

    case 'checking':
      return (
        <div class="flex">
          <div class="flex-grow mr-8 italic">Checking for updates&hellip;</div>
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
          <div class="flex-grow mr-8">
            <ProgressWithLabel
              id="update-progress"
              max={100}
              value={progress * 100}
              label={`${label}…`}
            />
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
          <div class="flex-grow mr-8">
            <ProgressWithLabel id="update-progress" label={`${label}…`} />
          </div>
          <button class={disabledButtonStyles} disabled>
            Cancel
          </button>
        </div>
      );
    }

    case 'error':
      return (
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
      );
  }

  return null;
}

// Our special date formatting that is a simplified ISO 8601 in local time
// without seconds.
function formatDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
