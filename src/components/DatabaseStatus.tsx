import { h, FunctionalComponent } from 'preact';

import { DatabaseVersion } from '../common';
import { DatabaseState } from '../database';
import { CloneableUpdateState } from '../update-state';

type Props = {
  databaseState: DatabaseState;
  databaseVersion?: DatabaseVersion;
  updateState: CloneableUpdateState;
};

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  let versionLabel = null;
  if (props.databaseVersion) {
    const { major, minor, patch } = props.databaseVersion;
    versionLabel = (
      <div className="version-label">{`${major}.${minor}.${patch}`}</div>
    );
  }

  return (
    <div className="database-status">
      <h2 className="header">Kanji database{versionLabel}</h2>
      {renderBody(props)}
    </div>
  );
};

function renderBody(props: Props) {
  const { databaseState, updateState } = props;
  if (databaseState === DatabaseState.Initializing) {
    return <div class="status-line">Initializing&hellip;</div>;
  }

  if (databaseState === DatabaseState.Empty) {
    switch (updateState.state) {
      case 'idle':
        return (
          <div class="status-with-button">
            <div class="status-line">No database</div>
            <button class="primary">Update now</button>
          </div>
        );

      case 'checking':
        return (
          <div class="status-with-button">
            <div class="status-line">Checking for updates&hellip;</div>
            <button>Cancel</button>
          </div>
        );

      case 'downloading':
        // TODO: Overlay the percentage on the progress bar
        return (
          <div class="status-with-button">
            <progress max="100" value={updateState.progress * 100}>
              {updateState.progress * 100}%
            </progress>
            <button>Cancel</button>
          </div>
        );

      case 'updatingdb':
        return (
          <div class="status-with-button">
            <progress>Updating database&hellip;</progress>
            <button disabled>Cancel</button>
          </div>
        );

      case 'error':
        // TODO: Print the actual error
        // TODO: Error styles
        return (
          <div class="status-with-button">
            <div class="status-line error">Error</div>
            <button class="primary">Retry</button>
          </div>
        );
    }
  }

  return null;
}
