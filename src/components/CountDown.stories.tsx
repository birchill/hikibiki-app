import { h } from 'preact';
import type { Meta, StoryObj } from '@storybook/preact';

import { CountDown } from './CountDown';

const meta: Meta<typeof CountDown> = {
  title: 'Components/CountDown',
  component: CountDown,
};

export default meta;

export const Default: StoryObj<typeof CountDown> = {
  render: () => (
    <div>
      Now: <CountDown deadline={new Date()} />
      <br />
      In 10 second:{' '}
      <CountDown deadline={new Date(new Date().getTime() + 10 * 1000)} />
      <br />
      In 70 seconds:{' '}
      <CountDown deadline={new Date(new Date().getTime() + 70 * 1000)} />
    </div>
  ),
};
