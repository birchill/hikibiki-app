import { assert } from 'chai';

import { DatabaseVersion } from './common';
import {
  DeletionEvent,
  DownloadEvent,
  EntryEvent,
  ProgressEvent,
  VersionEvent,
} from './download';
import { KanjiEntryLine, KanjiDeletionLine } from './kanjidb';
import { KanjiStore } from './store';
import { UpdateAction } from './update-actions';
import { updateKanji } from './update';

mocha.setup('bdd');

const VERSION_1_0_0: DatabaseVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  databaseVersion: 'yer',
  dateOfCreation: '2019-07-23',
  lang: 'en',
};

type KanjiEntryEvent = EntryEvent<KanjiEntryLine>;
type KanjiDeletionEvent = DeletionEvent<KanjiDeletionLine>;
type KanjiDownloadEvent = DownloadEvent<KanjiEntryLine, KanjiDeletionLine>;

describe('updateKanji', () => {
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

  it('should produce startdownload/finishdownload actions after reading the version', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const downloadStream = mockStream(versionEvent);

    await updateKanji({ downloadStream, lang: 'en', store, callback });

    assert.deepEqual(actions, [
      { type: 'startdownload', dbName: 'kanjidb', version: VERSION_1_0_0 },
      { type: 'finishdownload', version: VERSION_1_0_0 },
    ]);
  });

  it('should update the dbversion table', async () => {
    const versionEvent: VersionEvent = {
      ...VERSION_1_0_0,
      type: 'version',
      partial: false,
    };
    const downloadStream = mockStream(versionEvent);

    await updateKanji({ downloadStream, lang: 'en', store, callback });

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
    const entryEvents: Array<KanjiEntryEvent> = [
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

    await updateKanji({ downloadStream, lang: 'en', store, callback });

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
    const deletionEvent: KanjiDeletionEvent = {
      type: 'deletion',
      c: '㐂',
      deleted: true,
    };
    const downloadStream = mockStream(versionEvent, deletionEvent);

    await updateKanji({ downloadStream, lang: 'en', store, callback });

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
    const entryEvent: KanjiEntryEvent = {
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

    await updateKanji({ downloadStream, lang: 'en', store, callback });

    assert.deepEqual(actions, [
      { type: 'startdownload', dbName: 'kanjidb', version: VERSION_1_0_0 },
      { type: 'progress', loaded: 0, total: 1 },
      { type: 'progress', loaded: 1, total: 1 },
      { type: 'finishdownload', version: VERSION_1_0_0 },
    ]);
  });

  it('should apply a series of versions in succession', async () => {
    const events: Array<KanjiDownloadEvent> = [
      // Base version has two records
      {
        ...VERSION_1_0_0,
        type: 'version',
        partial: false,
      },
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
        m: ['to follow'],
        rad: { x: 4 },
        refs: {},
        misc: { sc: 6 },
      },

      // First patch adds one record and deletes another
      {
        ...VERSION_1_0_0,
        patch: 1,
        type: 'version',
        partial: true,
      },
      {
        type: 'entry',
        c: '㐬',
        r: {},
        m: [
          'a cup with pendants',
          'a pennant',
          'wild',
          'barren',
          'uncultivated',
        ],
        rad: { x: 8 },
        refs: {},
        misc: { sc: 7 },
      },
      {
        type: 'deletion',
        c: '㐆',
        deleted: true,
      },

      // Second patch adds one more record
      {
        ...VERSION_1_0_0,
        patch: 2,
        type: 'version',
        partial: true,
      },
      {
        type: 'entry',
        c: '㐮',
        r: {},
        m: ['to help', 'to assist', 'to achieve', 'to rise', 'to raise'],
        rad: { x: 8 },
        refs: {},
        misc: { sc: 13 },
      },
    ];

    const downloadStream = mockStream(...events);

    await updateKanji({ downloadStream, lang: 'en', store, callback });

    assert.deepEqual(await store.kanji.toArray(), [
      {
        c: 13314,
        r: {},
        m: [],
        rad: { x: 1 },
        refs: { nelson_c: 265, halpern_njecd: 2028 },
        misc: { sc: 6 },
      },
      {
        c: 13356,
        r: {},
        m: [
          'a cup with pendants',
          'a pennant',
          'wild',
          'barren',
          'uncultivated',
        ],
        rad: { x: 8 },
        refs: {},
        misc: { sc: 7 },
      },
      {
        c: 13358,
        r: {},
        m: ['to help', 'to assist', 'to achieve', 'to rise', 'to raise'],
        rad: { x: 8 },
        refs: {},
        misc: { sc: 13 },
      },
    ]);
  });

  it('should delete everything when doing a full update', async () => {
    const events: Array<KanjiDownloadEvent> = [
      // Base version has two records
      {
        ...VERSION_1_0_0,
        type: 'version',
        partial: false,
      },
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
        m: ['to follow'],
        rad: { x: 4 },
        refs: {},
        misc: { sc: 6 },
      },

      // Next minor version simply re-adds one
      {
        ...VERSION_1_0_0,
        minor: 1,
        type: 'version',
        partial: false,
      },
      {
        type: 'entry',
        c: '㐆',
        r: {},
        m: ['to follow'],
        rad: { x: 4 },
        refs: {},
        misc: { sc: 6 },
      },
    ];

    const downloadStream = mockStream(...events);

    await updateKanji({ downloadStream, lang: 'en', store, callback });

    assert.deepEqual(await store.kanji.toArray(), [
      {
        c: 13318,
        r: {},
        m: ['to follow'],
        rad: { x: 4 },
        refs: {},
        misc: { sc: 6 },
      },
    ]);
  });
});

function mockStream(
  ...events: Array<KanjiDownloadEvent>
): ReadableStream<KanjiDownloadEvent> {
  return new ReadableStream({
    start(controller: ReadableStreamDefaultController<KanjiDownloadEvent>) {
      for (const event of events) {
        controller.enqueue(event);
      }
      controller.close();
    },
  });
}
