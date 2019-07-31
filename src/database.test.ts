import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import { DownloadError, DownloadErrorCode } from './download';
import { DatabaseState, KanjiDatabase } from './database';
import { ErrorUpdateState } from './update-state';
import { stripFields } from './utils';

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

describe('database', () => {
  let db: KanjiDatabase;

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
    await db.ready;
    assert.isUndefined(db.dbVersion);

    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"}
`
    );

    await db.update();

    assert.deepEqual(
      db.dbVersion,
      stripFields(VERSION_1_0_0.latest, ['snapshot'])
    );
    assert.equal(db.state, DatabaseState.Ok);
  });

  it('should update the update state after updating', async () => {
    await db.ready;
    assert.deepEqual(db.updateState, { state: 'idle', lastCheck: null });

    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"}
`
    );

    const updateStart = new Date();
    await db.update();
    const updateEnd = new Date();

    assert.deepEqual(db.updateState.state, 'idle');
    assert.isDefined(db.updateState.lastCheck);
    // XXX Include chai date here and do this properly
    assert.isTrue(db.updateState.lastCheck! >= updateStart);
    assert.isTrue(db.updateState.lastCheck! <= updateEnd);
  });

  it('should ignore redundant calls to update', async () => {
    await db.ready;

    fetchMock.mock('end:kanji-rc-en-version.json', VERSION_1_0_0);
    fetchMock.mock(
      'end:kanji-rc-en-1.0.0-full.ljson',
      `{"type":"version","major":1,"minor":0,"patch":0,"databaseVersion":"175","dateOfCreation":"2019-07-09"}
`
    );

    const firstUpdate = db.update();
    const secondUpdate = db.update();

    await Promise.all([firstUpdate, secondUpdate]);

    assert.equal(
      fetchMock.calls('end:kanji-rc-en-1.0.0-full.ljson').length,
      1,
      'Should only fetch things once'
    );
  });

  it('should update the error state accordingly', async () => {
    await db.ready;

    fetchMock.mock('end:kanji-rc-en-version.json', 404);

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

  // XXX Check for error handling from update()
  // XXX Add cancel() method
  // XXX Events / Observer notifications whenever updateState or state is
  //     updated
  // XXX Check for out-of-date state (not sure exactly when this happens)
  // XXX Offline handling
});
