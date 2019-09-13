import { configure } from '@storybook/preact';
import '../src/index.css';

const req = require.context('../src/components', true, /\.stories\.tsx?$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
