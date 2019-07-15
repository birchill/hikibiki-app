import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import {
  download,
  DownloadEvent,
  DownloadError,
  DownloadErrorCode,
} from './download';

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

  function parseDrainError(err: Error): [DownloadError, Array<DownloadEvent>] {
    assert.instanceOf(err, DrainError, 'Should be a DrainError');
    assert.instanceOf(
      (err as DrainError).error,
      DownloadError,
      'Should be a DownloadError'
    );
    return [
      (err as DrainError).error as DownloadError,
      (err as DrainError).events,
    ];
  }

  it('should fail if there is no version file available', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', 404);

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.VersionFileNotFound
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version file is corrupt', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', 'yer');

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.VersionFileInvalid
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version file is missing required fields', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      major: 1,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    });

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.VersionFileInvalid
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version file has invalid fields', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      major: 0,
      minor: 0,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    });

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.VersionFileInvalid
      );
      assert.strictEqual(events.length, 0);
    }
  });

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

// If we get an error while draining, we should return the error along with all
// the events read up until that point.
export class DrainError extends Error {
  error: Error;
  events: Array<DownloadEvent>;

  constructor(error: Error, events: Array<DownloadEvent>, ...params: any[]) {
    super(...params);
    Object.setPrototypeOf(this, DrainError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DrainError);
    }

    this.name = 'DrainError';
    this.error = error;
    this.events = events;
  }
}

function drainEvents(
  reader: ReadableStreamDefaultReader
): Promise<Array<DownloadEvent>> {
  return new Promise((resolve, reject) => {
    const events: Array<DownloadEvent> = [];

    async function readEvent(): Promise<void> {
      let readResult: ReadableStreamReadResult<DownloadEvent>;
      try {
        readResult = await reader.read();
      } catch (e) {
        reject(new DrainError(e, events));
        return;
      }

      const { done, value } = readResult;
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
