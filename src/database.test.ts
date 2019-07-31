import { assert } from 'chai';
import fetchMock from 'fetch-mock';

import { DatabaseState, KanjiDatabase } from './database';
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

  // XXX Mock fetch and call update. Test that:
  // - update state is updated
  // XXX Check we update the latest check date
  // XXX Check for overlapping calls to update()
  // (Not exactly sure what the behavior should be here yet)
  // XXX Check for out-of-date state (not sure exactly when this happens)
  // XXX Check for error handling from update()
  // XXX Events / Observer notifications whenever updateState or state is
  //     updated
  // XXX Add cancel() method
  // XXX Offline handling
});
