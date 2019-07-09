import { assert } from 'chai';
import * as fetchMock from 'fetch-mock';

import { download, DownloadEvent } from './download';

mocha.setup('bdd');

describe('download', () => {
  it('should download the initial version information', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      major: 1,
      minor: 0,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    });
    const stream = download();
    const reader = stream.getReader();
    const events = await drainEvents(reader);

    assert.deepEqual(events, [
      {
        type: 'version',
        major: 1,
        minor: 0,
        patch: 0,
        partial: false,
      },
    ]);
  });
});

function drainEvents(
  reader: ReadableStreamDefaultReader
): Promise<Array<DownloadEvent>> {
  return new Promise(resolve => {
    const events: Array<DownloadEvent> = [];

    async function readEvent(): Promise<void> {
      const { done, value } = await reader.read();
      if (value) {
        events.push(value);
      }
      if (done) {
        resolve(events);
      }
      return readEvent();
    }

    return readEvent();
  });
}
