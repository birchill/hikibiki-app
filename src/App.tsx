import { h, Component } from 'preact';

import { DownloadState } from './DownloadState';
import { DatabaseStatus } from './DatabaseStatus';

const downloadState = DownloadState.Initializing;

export class App extends Component {
  render() {
    return <DatabaseStatus downloadState={downloadState} />;
  }
}