import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import {
  download,
  DownloadEvent,
  DownloadError,
  DownloadErrorCode,
  EntryEvent,
  ProgressEvent,
} from './download';

mocha.setup('bdd');

const VERSION_1_0_0 = {
  kanjidb: {
    latest: {
      major: 1,
      minor: 0,
      patch: 0,
      snapshot: 0,
      databaseVersion: '175',
      dateOfCreation: '2019-07-09',
    },
  },
};

describe('download', () => {
  afterEach(fetchMock.restore);

  it('should download the initial version information', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":0}
`
    );
    const reader = download().getReader();
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

  it('should fail if there is no version file available', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', 404);

    const reader = download().getReader();
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

  it('should fail if the version file is corrupt', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', 'yer');

    const reader = download().getReader();
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
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          major: 1,
          patch: 0,
          snapshot: 0,
          databaseVersion: '175',
          dateOfCreation: '2019-07-09',
        },
      },
    });

    const reader = download().getReader();
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
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, major: 0 } },
    });

    const reader = download().getReader();
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
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock('end:kanjidb-rc-en-1.0.0-full.ljson', 404);

    const reader = download().getReader();
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
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":1,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":0}
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
        DownloadErrorCode.DatabaseFileVersionMismatch
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should download the base snapshot', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
`
    );

    const reader = download().getReader();
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

  it('should fail if no header record appears', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
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
        DownloadErrorCode.DatabaseFileHeaderMissing
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if the version appears mid-stream', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
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
        DownloadErrorCode.DatabaseFileHeaderMissing
      );
      assert.strictEqual(events.length, 0);
    }
  });

  it('should fail if multiple header records appear', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
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
        DownloadErrorCode.DatabaseFileHeaderDuplicate
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
      fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
      fetchMock.mock(
        'end:kanjidb-rc-en-1.0.0-full.ljson',
        `
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
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
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          major: 1,
          minor: 0,
          patch: 0,
          snapshot: 0,
          databaseVersion: '175',
          dateOfCreation: '2019-07-09',
        },
      },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
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

  it('should fetch subsequent patches', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 2,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    await drainEvents(download().getReader());

    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.0-full.ljson'),
      'Should get baseline'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.1-patch.ljson'),
      'Should get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.2-patch.ljson'),
      'Should get second patch'
    );
  });

  it('should fetch appropriate patches when a current version is supplied', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 2,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    await drainEvents(
      download({ currentVersion: { major: 1, minor: 0, patch: 1 } }).getReader()
    );

    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.0-full.ljson'),
      'Should NOT get baseline'
    );
    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.1-patch.ljson'),
      'Should NOT get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.2-patch.ljson'),
      'Should get second patch'
    );
  });

  it('sets the partial field appropriately for patches', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 2,
        },
      },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.2-patch.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"},"records":0}
`
    );

    const events = await drainEvents(
      download({ currentVersion: { major: 1, minor: 0, patch: 1 } }).getReader()
    );

    assert.deepEqual(events, [
      {
        type: 'version',
        major: 1,
        minor: 0,
        patch: 2,
        databaseVersion: '2019-175',
        dateOfCreation: '2019-06-24',
        partial: true,
      },
    ]);
  });

  it('reports deletion events', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 2,
        },
      },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.2-patch.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"},"records":1}
{"c":"鍋","deleted":true}`
    );

    const events = await drainEvents(
      download({ currentVersion: { major: 1, minor: 0, patch: 1 } }).getReader()
    );

    assert.deepEqual(events[1], {
      type: 'deletion',
      c: '鍋',
    });
  });

  it('should fail if there are deletion records in a full file', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","deleted":true}`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileDeletionInSnapshot
      );
      assert.strictEqual(events.length, 2);
    }
  });

  it('should fail if one of the patch is missing', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, patch: 1 } },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock('end:kanjidb-rc-en-1.0.1-patch.ljson', 404);

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileNotFound
      );
      assert.strictEqual(events.length, 2);
    }
  });

  it('should fail if one of the patches is corrupt', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, patch: 1 } },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock('end:kanjidb-rc-en-1.0.1-patch.ljson', 'yer');

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileInvalidJSON
      );
      assert.strictEqual(events.length, 2);
    }
  });

  it('should fail if one of the patches has a mismatched header', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, patch: 1 } },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.1-patch.ljson',
      `{"type":"header","version":{"major":1,"minor":1,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
{"c":"㐂","r":{},"m":[],"rad":{"x":2},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );

    const reader = download().getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError, events] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.DatabaseFileVersionMismatch
      );
      assert.strictEqual(events.length, 2);
    }
  });

  it('should download from the closest snapshot when no current version is supplied', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 7,
          snapshot: 5,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    await drainEvents(download().getReader());

    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.0-full.ljson'),
      'Should NOT get baseline'
    );
    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.5-patch.ljson'),
      'Should NOT get patch corresponding to snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.5-full.ljson'),
      'Should get snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.6-patch.ljson'),
      'Should get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.0.7-patch.ljson'),
      'Should get second patch'
    );
  });

  it('should fail when the latest version is less than the current version', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, patch: 1 } },
    });

    const reader = download({
      currentVersion: { major: 1, minor: 0, patch: 2 },
    }).getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError] = parseDrainError(e);
      assert.strictEqual(downloadError.code, DownloadErrorCode.DatabaseTooOld);
    }
  });

  it('should do nothing when the latest version equals the current version', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: { latest: { ...VERSION_1_0_0.kanjidb.latest, patch: 1 } },
    });

    const reader = download({
      currentVersion: { major: 1, minor: 0, patch: 1 },
    }).getReader();

    const events = await drainEvents(reader);
    assert.strictEqual(events.length, 0);
  });

  it('should re-download from the latest snapshot when there is a new minor version', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          minor: 2,
          patch: 11,
          snapshot: 10,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    const reader = download({
      currentVersion: { major: 1, minor: 0, patch: 2 },
    }).getReader();
    await drainEvents(reader);

    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.2.10-full.ljson'),
      'Should get snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-1.2.11-patch.ljson'),
      'Should get first patch'
    );
  });

  it('should re-download from the latest snapshot when there is a new major version we support', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          major: 3,
          minor: 0,
          patch: 11,
          snapshot: 10,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    const reader = download({
      maxSupportedMajorVersion: 3,
      currentVersion: { major: 1, minor: 0, patch: 2 },
    }).getReader();
    await drainEvents(reader);

    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-3.0.10-full.ljson'),
      'Should get snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-en-3.0.11-patch.ljson'),
      'Should get first patch'
    );
  });

  it("should fail when there is a new major version we don't support", async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          major: 3,
          minor: 0,
          patch: 11,
          snapshot: 10,
        },
      },
    });
    mockAllDataFilesWithEmpty();

    const reader = download({
      maxSupportedMajorVersion: 2,
      currentVersion: { major: 1, minor: 0, patch: 2 },
    }).getReader();
    try {
      await drainEvents(reader);
      assert.fail('Should have thrown an exception');
    } catch (e) {
      const [downloadError] = parseDrainError(e);
      assert.strictEqual(
        downloadError.code,
        DownloadErrorCode.UnsupportedDatabaseVersion
      );
    }
  });

  it('should request the appropriate language', async () => {
    fetchMock.mock('end:jpdict-rc-fr-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-fr-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":0}
`
    );

    await drainEvents(download({ lang: 'fr' }).getReader());

    assert.isFalse(
      fetchMock.called('end:jpdict-rc-en-version.json'),
      'Should NOT get en version'
    );
    assert.isTrue(
      fetchMock.called('end:jpdict-rc-fr-version.json'),
      'Should get fr version'
    );
    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.0-full.ljson'),
      'Should NOT get en database file'
    );
    assert.isTrue(
      fetchMock.called('end:kanjidb-rc-fr-1.0.0-full.ljson'),
      'Should get fr database file'
    );
  });

  it('should cancel any fetches if the download is canceled', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":2}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}`
    );

    const stream = download();
    const reader = stream.getReader();

    // Read version event
    let readResult = await reader.read();
    assert.isFalse(readResult.done, 'Stream should not have finished yet');

    // At least in Chrome and Firefox, calling cancel on the stream doesn't work
    // but calling it on the reader does.
    reader.cancel();

    readResult = await reader.read();
    assert.isTrue(readResult.done, 'Stream should be done');
  });

  it('should produce progress events', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":26}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
{"c":"㐆","r":{},"m":["to follow","to trust to","to put confidence in","to depend on","to turn around","to turn the body"],"rad":{"x":4},"refs":{},"misc":{"sc":6}}
{"c":"㐬","r":{},"m":["a cup with pendants","a pennant","wild","barren","uncultivated"],"rad":{"x":8},"refs":{},"misc":{"sc":7}}
{"c":"㐮","r":{},"m":["to help","to assist","to achieve","to rise","to raise"],"rad":{"x":8},"refs":{},"misc":{"sc":13}}
{"c":"㑨","r":{},"m":["great","big","tall","vast","noble","high in rank","very","much"],"rad":{"x":9},"refs":{},"misc":{"sc":10}}
{"c":"㑪","r":{},"m":["a generation","a class","a series","a kind"],"rad":{"x":9},"refs":{},"misc":{"sc":10}}
{"c":"㒒","r":{},"m":["a slave","a servant","used conventionally for oneself","a charioteer"],"rad":{"x":9},"refs":{},"misc":{"sc":15}}
{"c":"㒵","r":{"kun":["かお"]},"m":["manner","appearance","form","face","bearing"],"rad":{"x":12},"refs":{},"misc":{"sc":7}}
{"c":"㒼","r":{},"m":["average","equivalent","corresponding","to cover something carefully and tightly without a break"],"rad":{"x":13},"refs":{},"misc":{"sc":11}}
{"c":"㓁","r":{},"m":["a net","net-like","radical 122"],"rad":{"x":14},"refs":{"halpern_njecd":1977},"misc":{"sc":4}}
{"c":"㓇","r":{},"m":[],"rad":{"x":15},"refs":{},"misc":{"sc":6}}
{"c":"㓛","r":{},"m":["merit","achievement","meritorious","efficacy","good results"],"rad":{"x":18},"refs":{},"misc":{"sc":5}}
{"c":"㔟","r":{},"m":[],"rad":{"x":19},"refs":{},"misc":{"sc":10}}
{"c":"㕝","r":{},"m":[],"rad":{"x":29},"refs":{},"misc":{"sc":7}}
{"c":"㕞","r":{},"m":["a brush","to brush","to clean","to scrub","to print","expecially from blocks"],"rad":{"x":29},"refs":{},"misc":{"sc":8}}
{"c":"㕣","r":{},"m":["a marsh at the foot of the hills","name of a river"],"rad":{"x":30},"refs":{},"misc":{"sc":5}}
{"c":"㕮","r":{},"m":["to chew","to masticate","to dwell on","Chinese medicine term"],"rad":{"x":30},"refs":{},"misc":{"sc":7}}
{"c":"㖦","r":{},"m":["loquacity"],"rad":{"x":30},"refs":{},"misc":{"sc":11}}
{"c":"㖨","r":{},"m":["Indistinct nasal utterance","laugh","sound of birds"],"rad":{"x":30},"refs":{},"misc":{"sc":11}}
{"c":"㗅","r":{},"m":["angry","the throat","what? how? why? which?"],"rad":{"x":30},"refs":{},"misc":{"sc":12}}
{"c":"㗚","r":{},"m":["vexingly verbose or wordy","prosy","complicated","annoying"],"rad":{"x":30},"refs":{},"misc":{"sc":13}}
{"c":"㗴","r":{},"m":["dogs fighting","to go to law","an indictment"],"rad":{"x":30},"refs":{},"misc":{"sc":15}}
{"c":"㘅","r":{},"m":["to hold in the mouth"],"rad":{"x":30},"refs":{},"misc":{"sc":17}}
{"c":"㙊","r":{},"m":["an area of level ground","an open space","a threshing floor","arena for drill_ etc.","a place to pile a sand-hill"],"rad":{"x":32},"refs":{},"misc":{"sc":11}}
{"c":"㚑","r":{},"m":[],"rad":{"x":37},"refs":{},"misc":{"sc":6}}
{"c":"㚖","r":{},"m":["to come out to the open","to be known by all","glossy","shining"],"rad":{"x":37},"refs":{},"misc":{"sc":8}}
`
    );

    const events = await drainEvents(
      download({ maxProgressResolution: 0.05 }).getReader(),
      {
        includeProgressEvents: true,
      }
    );
    const progressEvents = events.filter(
      event => event.type === 'progress'
    ) as Array<ProgressEvent>;
    let previousPercent = null;
    let previousLoaded = null;
    let previousTotal = null;
    for (const event of progressEvents) {
      if (previousTotal) {
        assert.strictEqual(event.total, previousTotal);
      } else {
        previousTotal = event.total;
      }

      if (previousLoaded) {
        assert.isAbove(event.loaded, previousLoaded);
      }
      previousLoaded = event.loaded;

      const percent = event.loaded / (event.total as number);
      assert.isAtLeast(percent, 0);
      assert.isAtMost(percent, 1);
      // Check we maintain a maximum resolution
      if (previousPercent) {
        assert.isAtLeast(percent - previousPercent, 0.05);
      }
      previousPercent = percent;
    }
  });
});

function mockAllDataFilesWithEmpty() {
  // (This needs to be updated to ignore the language)
  const patchFileRegexp = /kanjidb-rc-en-(\d+).(\d+).(\d+)-(patch|full).ljson/;
  fetchMock.mock(patchFileRegexp, url => {
    const matches = url.match(patchFileRegexp);
    assert.isNotNull(matches);
    assert.strictEqual(matches!.length, 5);
    const [, major, minor, patch] = matches!;
    return `{"type":"header","version":{"major":${major},"minor":${minor},"patch":${patch},"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":0}`;
  });
}

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
  reader: ReadableStreamDefaultReader,
  { includeProgressEvents = false }: { includeProgressEvents?: boolean } = {}
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
      if (value && (includeProgressEvents || value.type !== 'progress')) {
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
