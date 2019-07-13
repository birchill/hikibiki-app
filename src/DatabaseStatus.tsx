import { DownloadState } from './DownloadState';
import { h, FunctionalComponent } from 'preact';

type Props = {
  downloadState: DownloadState;
}

export const DatabaseStatus: FunctionalComponent<Props> = (props: Props) => {
  const isInitializing = props.downloadState === DownloadState.Initializing;

  return (
    <div className="database-status">
      { isInitializing ? 'Initialzing...' : 'Unknown' }
    </div>
  );
};
