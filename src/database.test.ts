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
  afterEach(fetchMock.restore);

  it('should initially be initializing', async () => {
    const db = new KanjiDatabase();
    assert.equal(db.state, DatabaseState.Initializing);
    await db.destroy();
  });

  it('should resolve to being empty', async () => {
    const db = new KanjiDatabase();
    await db.ready;
    assert.equal(db.state, DatabaseState.Empty);
    await db.destroy();
  });

  it('should resolve the version after updating', async () => {
    const db = new KanjiDatabase();
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

    await db.destroy();
  });

  it('should update the update state after updating', async () => {
    const db = new KanjiDatabase();
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

    await db.destroy();
  });

  it('should ignore redundant calls to update', async () => {
    const db = new KanjiDatabase();
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

    await db.destroy();
  });

  it('should update the error state accordingly', async () => {
    const db = new KanjiDatabase();
    await db.ready;

    fetchMock.mock('end:kanji-rc-en-version.json', 404);

    await db.update();

    assert.equal(db.updateState.state, 'error');
    assert.instanceOf(
      (db.updateState as ErrorUpdateState).error,
      DownloadError
    );
    assert.equal(
      ((db.updateState as ErrorUpdateState).error as DownloadError).code,
      DownloadErrorCode.VersionFileNotFound
    );

    await db.destroy();
  });

  // XXX Check for error handling from update()
  // XXX Add cancel() method
  // XXX Events / Observer notifications whenever updateState or state is
  //     updated
  // XXX Check for out-of-date state (not sure exactly when this happens)
  // XXX Offline handling
});
