import chai, { assert } from 'chai';
import chaiDateTime from 'chai-datetime';
import fetchMock from 'fetch-mock';

import { DownloadError, DownloadErrorCode } from './download';
import { DatabaseState, KanjiDatabase } from './database';
import { ErrorUpdateState } from './update-state';
import { stripFields } from './utils';

mocha.setup('bdd');
chai.use(chaiDateTime);

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
  bushudb: {
    latest: {
      major: 1,
      minor: 0,
      patch: 0,
      snapshot: 0,
      dateOfCreation: '2019-09-06',
    },
  },
};

describe('database', function() {
  let db: KanjiDatabase;

  // We seem to be timing out on Chrome recently
  this.timeout(5000);

  beforeEach(() => {
    db = new KanjiDatabase();
  });

  afterEach(async () => {
    fetchMock.restore();
    if (db) {
      await db.destroy();
    }
  });

  it('should initially be initializing', async () => {
    assert.equal(db.state, DatabaseState.Initializing);
  });

  it('should resolve to being empty', async () => {
    await db.ready;
    assert.equal(db.state, DatabaseState.Empty);
  });

  it('should resolve the version after updating', async () => {
    try {
      await db.ready;
      assert.isNull(db.dbVersions.kanjidb);

      fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
      fetchMock.mock(
        'end:kanjidb-rc-en-1.0.0-full.ljson',
        `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"},"records":0}
`
      );
      fetchMock.mock(
        'end:bushudb-rc-en-1.0.0-full.ljson',
        `{"type":"header","version":{"major":1,"minor":0,"patch":0,"dateOfCreation":"2019-09-06"},"records":0}
`
      );

      await db.update();

      assert.deepEqual(
        stripFields(db.dbVersions.kanjidb!, ['lang']),
        stripFields(VERSION_1_0_0.kanjidb.latest, ['snapshot'])
      );
      assert.equal(db.state, DatabaseState.Ok);
    } catch (e) {
      console.log('Got error');
      console.log(e);
      throw e;
    }
  });

  it('should update the update state after updating', async () => {
    await db.ready;
    assert.deepEqual(db.updateState, { state: 'idle', lastCheck: null });

    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"},"records":0}
`
    );
    fetchMock.mock(
      'end:bushudb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"dateOfCreation":"2019-09-06"},"records":0}
`
    );

    const updateStart = new Date();
    await db.update();
    const updateEnd = new Date();

    assert.deepEqual(db.updateState.state, 'idle');
    assert.isDefined(db.updateState.lastCheck);
    assert.withinTime(db.updateState.lastCheck!, updateStart, updateEnd);
  });

  it('should ignore redundant calls to update', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"},"records":0}
`
    );
    fetchMock.mock(
      'end:bushudb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"dateOfCreation":"2019-09-06"},"records":0}
`
    );

    const firstUpdate = db.update();
    const secondUpdate = db.update();

    await Promise.all([firstUpdate, secondUpdate]);

    assert.equal(
      fetchMock.calls('end:kanjidb-rc-en-1.0.0-full.ljson').length,
      1,
      'Should only fetch things once'
    );
  });

  it('should update the error state accordingly', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', 404);

    let exception;
    try {
      await db.update();
    } catch (e) {
      exception = e;
    }

    const isVersionFileNotFoundError = (e?: Error) =>
      e &&
      e instanceof DownloadError &&
      e.code === DownloadErrorCode.VersionFileNotFound;

    // Check exception
    assert.isTrue(
      isVersionFileNotFoundError(exception),
      `Should have thrown a VersionFileNotFound exception. Got: ${exception}`
    );

    // Check update state
    assert.equal(db.updateState.state, 'error');
    assert.isTrue(
      isVersionFileNotFoundError((db.updateState as ErrorUpdateState).error),
      `Update state should have a VersionFileNotFound error. Got: ${
        (db.updateState as ErrorUpdateState).error
      }`
    );
  });

  it('should allow canceling the update', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"},"records":0}`
    );
    fetchMock.mock(
      'end:bushudb-rc-en-1.0.0-full.ljson',
      `{"type":"header","version":{"major":1,"minor":0,"patch":0,"dateOfCreation":"2019-09-06"},"records":0}
`
    );

    const update = db.update();
    db.cancelUpdate();

    let exception;
    try {
      await update;
    } catch (e) {
      exception = e;
    }

    assert.isDefined(exception);
    assert.equal(exception.message, 'AbortError');

    assert.deepEqual(db.updateState, { state: 'idle', lastCheck: null });

    // Also check that a redundant call to cancelUpdate doesn't break anything.
    db.cancelUpdate();
  });

  it('should allow canceling the update mid-stream', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 1,
        },
      },
    });
    // (We need to cancel from this second request, otherwise we don't seem to
    // exercise the code path where we actually cancel the reader.)
    fetchMock.mock('end:kanjidb-rc-en-1.0.0-full.ljson', () => {
      db.cancelUpdate();
      return '';
    });

    const update = db.update();

    let exception;
    try {
      await update;
    } catch (e) {
      exception = e;
    }

    assert.isDefined(exception);
    assert.equal(exception.message, 'AbortError');

    assert.deepEqual(db.updateState, { state: 'idle', lastCheck: null });

    assert.isFalse(
      fetchMock.called('end:kanjidb-rc-en-1.0.1-patch.ljson'),
      'Should not download next data file'
    );
  });

  it('should update the last check time if we wrote something', async () => {
    fetchMock.mock('end:jpdict-rc-en-version.json', {
      kanjidb: {
        latest: {
          ...VERSION_1_0_0.kanjidb.latest,
          patch: 1,
        },
      },
    });
    fetchMock.mock(
      'end:kanjidb-rc-en-1.0.0-full.ljson',
      `
{"type":"header","version":{"major":1,"minor":0,"patch":0,"databaseVersion":"2019-173","dateOfCreation":"2019-06-22"},"records":1}
{"c":"㐂","r":{},"m":[],"rad":{"x":1},"refs":{"nelson_c":265,"halpern_njecd":2028},"misc":{"sc":6}}
`
    );
    fetchMock.mock('end:kanjidb-rc-en-1.0.1-patch.ljson', () => {
      db.cancelUpdate();
      return '';
    });

    const update = db.update();

    let exception;
    try {
      await update;
    } catch (e) {
      exception = e;
    }

    assert.isDefined(exception);
    assert.equal(exception.message, 'AbortError');

    assert.equal(db.updateState.state, 'idle');
    assert.isDefined(db.updateState.lastCheck);
  });

  // XXX Check for out-of-date state (not sure exactly when this happens)
  // XXX Offline handling
});
