import { assert } from 'chai';

import { DatabaseVersion } from './common';
import { VersionEvent } from './download';
import { KanjiStore } from './store';
import { UpdateAction } from './update-actions';
import { update } from './update';

mocha.setup('bdd');

const VERSION_1_0_0: DatabaseVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  databaseVersion: 'yer',
  dateOfCreation: '2019-07-23',
};

describe('update', () => {
  let store: KanjiStore;

  beforeEach(() => {
    store = new KanjiStore();
  });

  afterEach(() => {
    return store.delete();
  });

  it('should produce a startdownload action after reading the version', async () => {
    const actions: Array<UpdateAction> = [];
    const callback = (action: UpdateAction) => {
      actions.push(action);
    };

    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const downloadStream = new ReadableStream({
      start(controller) {
        controller.enqueue(versionEvent);
        controller.close();
      },
    });

    await update({ downloadStream, store, callback });

    assert.deepEqual(actions, [
      { type: 'startdownload', version: VERSION_1_0_0 },
    ]);
  });
});
