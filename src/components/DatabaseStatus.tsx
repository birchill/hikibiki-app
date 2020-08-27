import {
  h,
  ComponentChildren,
  Fragment,
  FunctionalComponent,
  JSX,
  RenderableProps,
} from 'preact';
import { useState, useCallback } from 'preact/hooks';
import {
  DataSeries,
  DataSeriesState,
  MajorDataSeries,
  UpdateState,
} from '@birchill/hikibiki-data';

import { DataSeriesInfo } from '../worker-messages';

import { CountDown } from './CountDown';
import { FancyCheckbox } from './FancyCheckbox';
import { LicenseInfo } from './LicenseInfo';
import { ProgressBar } from './ProgressBar';

const headings: { [series in MajorDataSeries]: string } = {
  kanji: 'Kanji',
  names: 'Names',
};

const dataLabels: { [series in DataSeries]: string } = {
  kanji: 'kanji',
  radicals: 'radical',
  names: 'name',
};

type Props = {
  series: MajorDataSeries;
  dataState: {
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

  const { series, initiallyExpanded, onToggleActive } = props;

  const [expanded, setExpanded] = useState(!!initiallyExpanded);
  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  const onUpdate = useCallback(
    () => (props.onUpdate ? props.onUpdate({ series }) : null),
    [series, props.onUpdate]
  );
  const onCancel = useCallback(
    () => (props.onCancel ? props.onCancel({ series }) : null),
    [series, props.onCancel]
  );

  const dataState = getCombinedDataState({ series, data: props.dataState });

  // If the database is empty and we're still downloading it, we should let the
  // user know we're doing something if the panel is collapsed.
  let heading = headings[series];
  if (!expanded && dataState.state === DataSeriesState.Empty) {
    switch (dataState.updateState.state) {
      case 'checking':
      case 'downloading':
        heading += ' (downloading…)';
        break;

      case 'updatingdb':
        heading += ' (updating…)';
        break;

      default:
        if (
          dataState.updateError &&
          dataState.updateError.name !== 'OfflineError'
        ) {
          heading += ' (💔)';
        }
        break;
    }
  } else if (!expanded && dataState.state === DataSeriesState.Unavailable) {
    heading += ' (💔)';
  }

  const disabled = !!props.disabled;

  return (
    <div className={disabled ? disabledPanelStyles : panelStyles}>
      <div className="my-10 flex flex-row items-center">
        <FancyCheckbox
          id={`${series}-enabled`}
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
        {renderSettingsIcon({
          disabled,
          expanded,
          onToggleSettings: toggleExpanded,
        })}
      </div>
      {!disabled && expanded ? (
        <div className="mb-10">
          {renderBody({
            series,
            dataState,
            children: props.children,
            onUpdate,
            onCancel,
          })}
        </div>
      ) : null}
    </div>
  );
};

// I don't know why TypeScript doesn't work out the type of Object.keys()
// automatically but it doesn't seem to.
function definedSeries(
  data: Props['dataState']
): ReadonlyArray<keyof Props['dataState']> {
  return Object.keys(data) as ReadonlyArray<keyof Props['dataState']>;
}

// We present the user with a combined view based on the status of all the
// different data sources that make up a "major data series".
function getCombinedDataState({
  series,
  data,
}: {
  series: MajorDataSeries;
  data: Props['dataState'];
}): DataSeriesInfo {
  // Simple case of a single data series
  if (definedSeries(data).length === 1) {
    return data[definedSeries(data)[0]]!;
  }

  // If any of the series are initializing, empty, unavailable, the whole series is.
  let state: DataSeriesState = DataSeriesState.Ok;
  for (const series of definedSeries(data)) {
    if (data[series]!.state !== DataSeriesState.Ok) {
      state = data[series]!.state;
      break;
    }
  }

  // The version is the version corresponding to the major data series. (For now
  // anyway we have an invariant that the major data series is always
  // available.)
  if (typeof data[series] === 'undefined') {
    throw new Error(`No data available for major data series: ${series}`);
  }
  const version = data[series]!.version;

  // The update state is the first series that is not idle or else it is the
  // update state of the major data series.
  let updateState: UpdateState = data[series]!.updateState;
  for (const series of definedSeries(data)) {
    const thisUpdateState = data[series]!.updateState;
    if (thisUpdateState.state !== 'idle') {
      updateState = thisUpdateState;
      break;
    }
  }

  const result: DataSeriesInfo = {
    state,
    version,
    updateState,
  };

  // The update error is similarly, the first one we find that isn't an
  // AbortError (since it's not really an error for the purposes of displaying
  // to the user).
  for (const series of definedSeries(data)) {
    const updateError = data[series]?.updateError;
    if (updateError && updateError.name !== 'AbortError') {
      result.updateError = updateError;
      break;
    }
  }

  return result;
}

function renderSettingsIcon({
  disabled,
  expanded,
  onToggleSettings,
}: {
  disabled: boolean;
  expanded: boolean;
  onToggleSettings: () => void;
}) {
  let containerStyles = !disabled && !expanded ? 'text-orange-400' : undefined;
  containerStyles +=
    ' bg-transparent rounded-full p-6 -m-6 hover:bg-orange-100 hover:text-orange-1000 border-2 border-transparent border-dotted focus:outline-none focus:border-orange-400 focus-invisible:border-transparent';

  if (disabled) {
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
  series,
  dataState,
  children,
  onUpdate,
  onCancel,
}: {
  series: MajorDataSeries;
  dataState: DataSeriesInfo;
  children?: ComponentChildren;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  if (dataState.state === DataSeriesState.Initializing) {
    return 'Initializing…';
  }

  return (
    <Fragment>
      <LicenseInfo series={series} version={dataState.version} />
      {renderDatabaseStatus({ dataState, onUpdate, onCancel })}
      {dataState.state !== DataSeriesState.Empty ? children : null}
    </Fragment>
  );
}

function renderDatabaseStatus({
  dataState,
  onUpdate,
  onCancel,
}: {
  dataState: DataSeriesInfo;
  onUpdate: () => void;
  onCancel: () => void;
}): JSX.Element | null {
  const { updateState } = dataState;

  const buttonStyles =
    'bg-orange-100 font-semibold text-center px-10 py-6 self-end leading-none rounded border-2 border-dotted border-transparent focus:outline-none focus:border-orange-800 shadow-orange-default hover:bg-orange-50';
  const disabledButtonStyles =
    'bg-gray-100 text-gray-600 font-semibold text-center px-10 py-6 self-end leading-none rounded focus:outline-none border-2 shadow cursor-default';

  switch (updateState.state) {
    case 'idle':
      return renderIdleDatabaseStatus({ dataState, buttonStyles, onUpdate });

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
      const { major, minor, patch } = updateState.downloadVersion;
      const { progress } = updateState;

      const dbLabel = dataLabels[updateState.series];
      const label = `Downloading ${dbLabel} data version ${major}.${minor}.${patch} (${Math.round(
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
      const label = `Updating ${
        dataLabels[updateState.series]
      } database to version ${major}.${minor}.${patch}`;
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
  dataState,
  buttonStyles,
  onUpdate,
}: {
  dataState: DataSeriesInfo;
  buttonStyles: string;
  onUpdate: () => void;
}): JSX.Element | null {
  const { updateError } = dataState;

  // Offline case
  if (updateError && updateError.name === 'OfflineError') {
    return (
      <div class="flex error bg-orange-100 p-8 rounded border border-orange-1000">
        <div class="flex-grow mr-8">
          Could not check for updates because this device is currently offline.
          An update will be performed once the device is online again.
        </div>
      </div>
    );
  }

  // Any other error (except AbortErrors which we skip in getUpdateError)
  if (updateError) {
    return (
      <div class="flex error bg-red-100 p-8 rounded border border-orange-1000">
        <div class="flex-grow mr-8">
          Update failed: {updateError.message}
          {updateError.nextRetry ? (
            <Fragment>
              <br />
              Retrying <CountDown deadline={updateError.nextRetry} />.
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

  const { state, updateState, version } = dataState;

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
