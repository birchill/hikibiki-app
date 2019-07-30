import { assert } from 'chai';

import { DatabaseState, KanjiDatabase } from './database';

mocha.setup('bdd');

describe('database', () => {
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

  // XXX Make getDbVersion a synchronous property getter that we update when
  // calling update()
  // XXX Mock fetch and call update. Test that:
  // - db version is updated
  // - db state is updated (to Ok)
  // - update state is updated
  // XXX Check for overlapping calls to update()
  // (Not exactly sure what the behavior should be here yet)
  // XXX Check for out-of-date state (not sure exactly when this happens)
  // XXX Check for error handling from update()
  // XXX Events / Observer notifications whenever updateState or state is
  //     updated
  // XXX Offline handling
});
