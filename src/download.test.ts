import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import {
  download,
  DownloadEvent,
  DownloadError,
  DownloadErrorCode,
  EntryEvent,
} from './download';

mocha.setup('bdd');

describe('download', () => {
  afterEach(fetchMock.restore);

  it('should download the initial version information', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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
        databaseVersion: '2019-173',
        dateOfCreation: '2019-06-22',
        partial: false,
      },
    ]);
  });

  function parseDrainError(err: Error): [DownloadError, Array<DownloadEvent>] {
    if (err.name === 'AssertionError') {
      throw err;
    }
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
      latest: {
        major: 1,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
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
      latest: {
        major: 0,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
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

  it('should fail if the base snapshot is not available', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock('end:kanji-rc-en-1.0.0-full.ljson', 404);

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileNotFound
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version of the base snapshot does not match', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":1,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
`
    );

    const stream = download();
    const reader = stream.getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileVersionMismatch
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should download the base snapshot', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
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
    assert.deepEqual(events[1], {
      type: 'entry',
      c: '㐂',
      r: {},
      m: [],
      rad: { x: 1 },
      refs: { nelson_c: 265, halpern_njecd: 2028 },
      misc: { sc: 6 },
    });
    assert.deepEqual(events[2], {
      type: 'entry',
      c: '㐆',
      r: {},
      m: [
        'to follow',
        'to trust to',
        'to put confidence in',
        'to depend on',
        'to turn around',
        'to turn the body',
      ],
      rad: { x: 4 },
      refs: {},
      misc: { sc: 6 },
    });
  });

  it('should fail if no version record appears', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileVersionMissing
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version appears mid-stream', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileVersionMissing
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if multiple version records appear', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileVersionDuplicate
      );
      assert.strictEqual(events.length, 1);
    }
  });

  it('should fail if an entry is invalid', async () => {
    const invalidEntries = [
      // c field
      '{"r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":1,"r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      // r field
      '{"c":"㐂","m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":null,"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"on":null},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"on":[1]},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"kun":null},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"kun":[1]},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"na":null},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{"na":[1]},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      // m field
      '{"c":"㐂","r":{},"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":null,"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":["a",1],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      // rad field
      '{"c":"㐂","r":{},"m":[],"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":null,"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":null},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":"a"},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1,"nelson":null},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1,"nelson":"a"},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1,"name":null},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1,"name":[1]},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}',
      // refs
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":null,"misc":{"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":null},"misc":{"sc":6}}',
      // misc
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":null}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":"a"}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"gh":null,"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"gh":"a","sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"freq":null,"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"freq":"a","sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"jlpt":null,"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"jlpt":"a","sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"kk":null,"sc":6}}',
      '{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"kk":"a","sc":6}}',
    ];

    for (const entry of invalidEntries) {
      fetchMock.restore();
      fetchMock.mock('end:kanji-rc-en-version.json', {
        latest: {
          major: 1,
          minor: 0,
          patch: 0,
          snapshot: 0,
          databaseVersion: '175',
          dateOfCreation: '2019-07-09',
        },
      });
      fetchMock.mock(
        'end:kanji-rc-en-1.0.0-full.ljson',
        `
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
${entry}
`
      );

      const reader = download().getReader();
      try {
        await drainEvents(reader);
        assert.fail(`Should have thrown an exception for input ${entry}`);
      } catch (e) {
        const [downloadError, events] = parseDrainError(e);
        assert.strictEqual(
          downloadError.code,
          DownloadErrorCode.DatabaseFileInvalidRecord
        );
        assert.strictEqual(events.length, 1);
      }
    }
  });

  it('should still return entries prior to invalid ones', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        minor: 0,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":null,"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileInvalidRecord
      );
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[1].type, 'entry');
      assert.strictEqual((events[1] as EntryEvent).c, '㐂');
    }
  });

  // XXX Test version handling
  //     -- No current version: Test we fetch from the latest snapshot
  //     -- Fetch next patch
  //     -- Fetch from latest snapshot
  //     -- Setting the partial field correctly

  // XXX Test we fail if one of the patch LJSON files is missing
  // XXX Test we fail if one of the patch LJSON files has an mismatched header

  // XXX Test we fail if the current version passed in is greater than the one
  //     we get back from the server
  // XXX Test deletion events

  // XXX Test canceling
  // XXX Test progress events
});

// If we get an error while draining, we should return the error along with all
// the events read up until that point.
class DrainError extends Error {
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
