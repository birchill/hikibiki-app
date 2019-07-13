import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import { download, DownloadEvent } from './download';

mocha.setup('bdd');

describe('download', () => {
  afterEach(fetchMock.restore);

  it('should download the initial version information', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      major: 1,
      minor: 0,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
`
    );
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

  // XXX Test we fail if there is no version file available
  // XXX Test we fail if the version file is missing some required fields
  // XXX Test we fail if the version file has invalid fields
  // XXX Test we fail if any of the LJSON files is missing
  // XXX Test we fail if any of the LJSON files has an mismatched header

  /*
  it('should download the base snapshot', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      major: 1,
      minor: 0,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    });
    fetchMock.mock('end:kanji-rc-en-1.0.0-full.ljson',
`
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const stream = download();
    const reader = stream.getReader();
    const events = await drainEvents(reader);

    assert.strictEqual(events.length, 3);
    // XXX Test the contents of the last two events
  });
  */

  // XXX No current version: Test we fetch from the latest snapshot
  // XXX Test we fail if the current version passed in is greater than the one
  //     we get back from the server
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
        return;
      }
      return readEvent();
    }

    return readEvent();
  });
}
