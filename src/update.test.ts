import { assert } from 'chai';

import { DatabaseVersion } from './common';
import {
  DeletionEvent,
  DownloadEvent,
  EntryEvent,
  ProgressEvent,
  VersionEvent,
} from './download';
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
  let actions: Array<UpdateAction> = [];
  const callback = (action: UpdateAction) => {
    actions.push(action);
  };

  beforeEach(() => {
    actions = [];
    store = new KanjiStore();
  });

  afterEach(() => {
    return store.delete();
  });

  it('should produce a startdownload action after reading the version', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const downloadStream = mockStream(versionEvent);

    await update({ downloadStream, store, callback });

    assert.deepEqual(actions, [
      { type: 'startdownload', version: VERSION_1_0_0 },
    ]);
  });

  it('should update the dbversion table', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const downloadStream = mockStream(versionEvent);

    await update({ downloadStream, store, callback });

    const dbVersion = await store.dbVersion.get(1);
    assert.deepEqual(dbVersion, {
      id: 1,
      ...VERSION_1_0_0,
    });
  });

  it('should add entries to the kanji table', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const entryEvents: Array<EntryEvent> = [
      {
        type: 'entry',
        c: '㐂',
        r: {},
        m: [],
        rad: { x: 1 },
        refs: { nelson_c: 265, halpern_njecd: 2028 },
        misc: { sc: 6 },
      },
      {
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
      },
    ];
    const downloadStream = mockStream(versionEvent, ...entryEvents);

    await update({ downloadStream, store, callback });

    const firstChar = await store.kanji.get(13314);
    assert.deepEqual(firstChar, {
      c: 13314,
      r: {},
      m: [],
      rad: { x: 1 },
      refs: { nelson_c: 265, halpern_njecd: 2028 },
      misc: { sc: 6 },
    });

    const secondChar = await store.kanji.get(13318);
    assert.deepEqual(secondChar, {
      c: 13318,
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

  it('should delete entries from the kanji table', async () => {
    await store.kanji.put({
      c: 13314,
      r: {},
      m: [],
      rad: { x: 1 },
      refs: { nelson_c: 265, halpern_njecd: 2028 },
      misc: { sc: 6 },
    });
    // Put an extra record just to ensure we don't delete EVERYTHING
    await store.kanji.put({
      c: 13318,
      r: {},
      m: ['to follow'],
      rad: { x: 4 },
      refs: {},
      misc: { sc: 6 },
    });

    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      patch: 1,
      type: 'version',
      partial: true,
    };
    const deletionEvent: DeletionEvent = {
      type: 'deletion',
      c: '㐂',
    };
    const downloadStream = mockStream(versionEvent, deletionEvent);

    await update({ downloadStream, store, callback });

    const deletedChar = await store.kanji.get(13314);
    assert.isUndefined(deletedChar);

    const remainingChar = await store.kanji.get(13318);
    assert.isDefined(remainingChar);
  });

  it('should echo progress events', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const progressEventA: ProgressEvent = {
      type: 'progress',
      loaded: 0,
      total: 1,
    };
    const entryEvent: EntryEvent = {
      type: 'entry',
      c: '㐂',
      r: {},
      m: [],
      rad: { x: 1 },
      refs: { nelson_c: 265, halpern_njecd: 2028 },
      misc: { sc: 6 },
    };
    const progressEventB: ProgressEvent = {
      type: 'progress',
      loaded: 1,
      total: 1,
    };

    const downloadStream = mockStream(
      versionEvent,
      progressEventA,
      entryEvent,
      progressEventB
    );

    await update({ downloadStream, store, callback });

    assert.deepEqual(actions, [
      { type: 'startdownload', version: VERSION_1_0_0 },
      { type: 'progress', loaded: 0, total: 1 },
      { type: 'progress', loaded: 1, total: 1 },
    ]);
  });

  // XXX should apply a series of version in succession
  // XXX should delete everything when doing a full update
});

function mockStream(
  ...events: Array<DownloadEvent>
): ReadableStream<DownloadEvent> {
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(event);
      }
      controller.close();
    },
  });
}
