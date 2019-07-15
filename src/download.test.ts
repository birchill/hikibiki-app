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

const VERSION_1_0_0 = {
  latest: {
    major: 1,
    minor: 0,
    patch: 0,
    snapshot: 0,
    databaseVersion: '175',
    dateOfCreation: '2019-07-09',
  },
};

describe('download', () => {
  afterEach(fetchMock.restore);

  it('should download the initial version information', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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

  it('should fail if the version file is corrupt', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', 'yer');

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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        major: 1,
        patch: 0,
        snapshot: 0,
        databaseVersion: '175',
        dateOfCreation: '2019-07-09',
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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0, major: 0 },
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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock('end:kanji-rc-en-1.0.0-full.ljson', 404);

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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":1,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `
{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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

  it('should fail if no version record appears', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
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
      fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
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

  it('should fetch subsequent patches', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        ...VERSION_1_0_0.latest,
        patch: 2,
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.1-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":1,"databaseVersion":"2019-174","dateOfCreation":"2019-06-23"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.2-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"}
`
    );

    await drainEvents(download().getReader());

    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.0-full.ljson'),
      'Should get baseline'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.1-patch.ljson'),
      'Should get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.2-patch.ljson'),
      'Should get second patch'
    );
  });

  it('should fetch appropriate patches when a current version is supplied', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        ...VERSION_1_0_0.latest,
        patch: 2,
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.1-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":1,"databaseVersion":"2019-174","dateOfCreation":"2019-06-23"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.2-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"}
`
    );

    await drainEvents(
      download({ currentVersion: { major: 1, minor: 0, patch: 1 } }).getReader()
    );

    assert.isFalse(
      fetchMock.called('end:kanji-rc-en-1.0.0-full.ljson'),
      'Should NOT get baseline'
    );
    assert.isFalse(
      fetchMock.called('end:kanji-rc-en-1.0.1-patch.ljson'),
      'Should NOT get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.2-patch.ljson'),
      'Should get second patch'
    );
  });

  it('sets the partial field appropriately for patches', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        ...VERSION_1_0_0.latest,
        patch: 2,
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.2-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"}
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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        ...VERSION_1_0_0.latest,
        patch: 2,
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.2-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":2,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"}
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
    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0.latest, patch: 1 },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock('end:kanji-rc-en-1.0.1-patch.ljson', 404);

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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0.latest, patch: 1 },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock('end:kanji-rc-en-1.0.1-patch.ljson', 'yer');

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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0.latest, patch: 1 },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.1-patch.ljson',
      `{"type":"version","major":1,"minor":1,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: {
        ...VERSION_1_0_0.latest,
        patch: 7,
        snapshot: 5,
      },
    });
    fetchMock.mock(
      'end:kanji-rc-en-1.0.5-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":5,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.6-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":6,"databaseVersion":"2019-174","dateOfCreation":"2019-06-23"}
`
    );
    fetchMock.mock(
      'end:kanji-rc-en-1.0.7-patch.ljson',
      `{"type":"version","major":1,"minor":0,"patch":7,"databaseVersion":"2019-175","dateOfCreation":"2019-06-24"}
`
    );

    await drainEvents(download().getReader());

    assert.isFalse(
      fetchMock.called('end:kanji-rc-en-1.0.0-full.ljson'),
      'Should NOT get baseline'
    );
    assert.isFalse(
      fetchMock.called('end:kanji-rc-en-1.0.5-patch.ljson'),
      'Should NOT get patch corresponding to snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.5-full.ljson'),
      'Should get snapshot'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.6-patch.ljson'),
      'Should get first patch'
    );
    assert.isTrue(
      fetchMock.called('end:kanji-rc-en-1.0.7-patch.ljson'),
      'Should get second patch'
    );
  });

  it('should fail when the latest version is less than the current version', async () => {
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0.latest, patch: 1 },
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
    fetchMock.mock('end:kanji-rc-en-version.json', {
      latest: { ...VERSION_1_0_0.latest, patch: 1 },
    });

    const reader = download({
      currentVersion: { major: 1, minor: 0, patch: 1 },
    }).getReader();

    const events = await drainEvents(reader);
    assert.strictEqual(events.length, 0);
  });

  it('should re-download from the latest snapshot when there is a new minor version', async () => {
    // XXX
  });

  it('should re-download from the latest snapshot when there is a new major version we support', async () => {
    // XXX
  });

  it("should fail when there is a new major version we don't support", async () => {
    // XXX
  });

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
