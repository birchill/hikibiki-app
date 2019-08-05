import { h } from 'preact';
import { storiesOf } from '@storybook/preact';

import { DatabaseStatus } from './DatabaseStatus';
import { DatabaseState } from '../database';

storiesOf('Components|DatabaseStatus', module).add('default', () => (
  <DatabaseStatus
    databaseState={DatabaseState.Initializing}
    updateState={{ state: 'idle', lastCheck: null }}
  />
));
