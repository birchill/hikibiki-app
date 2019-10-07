import { h } from 'preact';
import { storiesOf } from '@storybook/preact';

import { CountDown } from './CountDown';

storiesOf('Components|CountDown', module).add('default', () => (
  <div>
    Now: <CountDown deadline={new Date()} />
    <br />
    In 10 second:{' '}
    <CountDown deadline={new Date(new Date().getTime() + 10 * 1000)} />
    <br />
    In 70 seconds:{' '}
    <CountDown deadline={new Date(new Date().getTime() + 70 * 1000)} />
  </div>
));
