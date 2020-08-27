import { h, Fragment, FunctionalComponent, JSX, RenderableProps } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import {
  DataSeries,
  DataSeriesState,
  DownloadingUpdateState,
  MajorDataSeries,
} from '@birchill/hikibiki-data';

import { DataSeriesInfo } from '../worker-messages';

import { CountDown } from './CountDown';
import { FancyCheckbox } from './FancyCheckbox';
import { LicenseInfo } from './LicenseInfo';
import { ProgressBar } from './ProgressBar';

// TODO: Handle secondary state properly
// TODO: Rename state to databaseState

const headings: { [series in MajorDataSeries]: string } = {
  kanji: 'Kanji',
  names: 'Names',
};

const dataLabels: { [series in DataSeries]: string } = {
  kanji: 'kanji data',
  radicals: 'radical data',
  names: 'name data',
};

type Props = {
  series: MajorDataSeries;
  dbState: DataSeriesInfo;
  secondaryState?: {
    [series in DataSeries]?: DataSeriesInfo;
  };
  disabled?: boolean;
  initiallyExpanded?: boolean;
  onUpdate?: (params: { series: MajorDataSeries }) => void;
  onCancel?: (params: { series: MajorDataSeries }) => void;
  onToggleActive?: () => void;
};

export const DatabaseStatus: FunctionalComponent<Props> = (
  props: RenderableProps<Props>
) => {
  const panelStyles =
    'bg-orange-200 rounded-lg px-10 sm:px-20 mb-12 text-orange-1000 border-transparent border';
  const disabledPanelStyles =
    'bg-white rounded-lg px-10 sm:px-20 mb-12 text-gray-600 border-transparent border';

  const { dbState, initiallyExpanded, onToggleActive, series } = props;
  const disabled = !!props.disabled;

  const [expanded, setExpanded] = useState(!!initiallyExpanded);
  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  const onUpdate = useCallback(
    () => (props.onUpdate ? props.onUpdate({ series: props.series }) : null),
    [props.series, props.onUpdate]
  );
  const onCancel = useCallback(
    () => (props.onCancel ? props.onCancel({ series: props.series }) : null),
    [props.series, props.onCancel]
  );

  // We the database is empty and we're still downloading it, we should let the
  // user know we're doing something if the panel is collapsed.
  let heading = headings[series];
  if (!expanded && dbState.state === DataSeriesState.Empty) {
    switch (dbState.updateState.state) {
      case 'checking':
      case 'downloading':
        heading += ' (downloading…)';
        break;

      case 'updatingdb':
        heading += ' (updating…)';
        break;

      default:
        if (hasUpdateError(props)) {
          heading += ' (💔)';
        }
        break;
    }
  } else if (!expanded && dbState.state === DataSeriesState.Unavailable) {
    heading += ' (💔)';
  }

  return (
    <div className={disabled ? disabledPanelStyles : panelStyles}>
      <div className="my-10 flex flex-row items-center">
        <FancyCheckbox
          id={`${props.series}-enabled`}
          checked={!disabled}
          onChange={onToggleActive}
          theme={disabled ? 'gray' : 'orange'}
        />
        <h2
          className="flex-grow text-lg tracking-tight text-center text-lg font-semibold cursor-pointer select-none"
          onClick={onToggleActive}
        >
          {heading}
        </h2>
        {renderSettingsIcon(props, expanded, toggleExpanded)}
      </div>
      {!disabled && expanded ? (
        <div className="mb-10">{renderBody({ props, onUpdate, onCancel })}</div>
      ) : null}
    </div>
  );
};

function renderSettingsIcon(
  props: Props,
  expanded: boolean,
  onToggleSettings: () => void
) {
  let containerStyles =
    !props.disabled && !expanded ? 'text-orange-400' : undefined;
  containerStyles +=
    ' bg-transparent rounded-full p-6 -m-6 hover:bg-orange-100 hover:text-orange-1000 border-2 border-transparent border-dotted focus:outline-none focus:border-orange-400 focus-invisible:border-transparent';

  if (!!props.disabled) {
    containerStyles += ' invisible pointer-events-none';
  }

  return (
    <button class={containerStyles} type="button" onClick={onToggleSettings}>
      <svg class="w-10 h-10" viewBox="0 0 16 16">
        <title>Settings</title>
        <use width="16" height="16" href="#cog" />
      </svg>
    </button>
  );
}

function renderBody({
  props,
  onUpdate,
  onCancel,
}: {
  props: RenderableProps<Props>;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const { dbState: state } = props;
  if (state.state === DataSeriesState.Initializing) {
    return 'Initializing…';
  }

  return (
    <Fragment>
      <LicenseInfo series={props.series} version={props.dbState.version} />
      {renderDatabaseStatus({ props, onUpdate, onCancel })}
      {state.state !== DataSeriesState.Empty ? props.children : null}
    </Fragment>
  );
}

function hasUpdateError(props: Props): boolean {
  const { updateError } = props.dbState;
  return (
    !!updateError &&
    updateError.name !== 'AbortError' &&
    updateError.name !== 'OfflineError'
  );
}

function renderDatabaseStatus({
  props,
  onUpdate,
  onCancel,
}: {
  props: Props;
  onUpdate: () => void;
  onCancel: () => void;
}): JSX.Element | null {
  const { updateState } = props.dbState;

  const buttonStyles =
    'bg-orange-100 font-semibold text-center px-10 py-6 self-end leading-none rounded border-2 border-dotted border-transparent focus:outline-none focus:border-orange-800 shadow-orange-default hover:bg-orange-50';
  const disabledButtonStyles =
    'bg-gray-100 text-gray-600 font-semibold text-center px-10 py-6 self-end leading-none rounded focus:outline-none border-2 shadow cursor-default';

  switch (updateState.state) {
    case 'idle':
      return renderIdleDatabaseStatus({ props, buttonStyles, onUpdate });

    case 'checking':
      return (
        <div class="flex">
          <div class="flex-grow mr-8 italic">Checking for updates&hellip;</div>
          <button class={buttonStyles} type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );

    case 'downloading': {
      const downloadingUpdateState = updateState as DownloadingUpdateState;
      const { major, minor, patch } = downloadingUpdateState.downloadVersion;
      const { progress } = downloadingUpdateState;

      const dbLabel = dataLabels[downloadingUpdateState.series];
      const label = `Downloading ${dbLabel} version ${major}.${minor}.${patch} (${Math.round(
        progress * 100
      )}%)`;
      return (
        <div class="flex">
          <div class="flex-grow mr-8">
            <ProgressBar
              id="update-progress"
              max={100}
              value={progress * 100}
              label={`${label}…`}
            />
          </div>
          <button class={buttonStyles} type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );
    }

    case 'updatingdb': {
      const { major, minor, patch } = updateState.downloadVersion;
      const dbLabel =
        updateState.series === 'kanji' ? 'kanji database' : 'radical database';
      const label = `Updating ${dbLabel} to version ${major}.${minor}.${patch}`;
      return (
        <div class="flex">
          <div class="flex-grow mr-8">
            <ProgressBar id="update-progress" label={`${label}…`} />
          </div>
          <button class={disabledButtonStyles} type="button" disabled>
            Cancel
          </button>
        </div>
      );
    }
  }
}

function renderIdleDatabaseStatus({
  props,
  buttonStyles,
  onUpdate,
}: {
  props: Props;
  buttonStyles: string;
  onUpdate: () => void;
}): JSX.Element | null {
  if (hasUpdateError(props)) {
    const { updateError } = props.dbState;
    return (
      <div class="flex error bg-red-100 p-8 rounded border border-orange-1000">
        <div class="flex-grow mr-8">
          Update failed: {updateError!.message}
          {updateError!.nextRetry ? (
            <Fragment>
              <br />
              Retrying <CountDown deadline={updateError!.nextRetry} />.
            </Fragment>
          ) : null}
        </div>
        <div>
          <button class={buttonStyles} type="button" onClick={onUpdate}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { updateError } = props.dbState;
  if (!!updateError && updateError.name === 'OfflineError') {
    return (
      <div class="flex error bg-orange-100 p-8 rounded border border-orange-1000">
        <div class="flex-grow mr-8">
          Could not check for updates because this device is currently offline.
          An update will be performed once the device is online again.
        </div>
      </div>
    );
  }

  const { state, updateState, version } = props.dbState;

  let status: string | JSX.Element;
  if (state === DataSeriesState.Empty) {
    status = 'No database';
  } else if (state === DataSeriesState.Unavailable) {
    status = 'Database storage unavailable';
  } else {
    const { major, minor, patch } = version!;
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
        <button class={buttonStyles} type="button" onClick={onUpdate}>
          {state === DataSeriesState.Unavailable
            ? 'Retry'
            : 'Check for updates'}
        </button>
      </div>
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
