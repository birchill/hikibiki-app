import Dexie from 'dexie';

import { KanjiEntry, DatabaseVersion } from './common';

// Define a variant on KanjiEntry that turns 'c' into a number
interface KanjiRecord extends Omit<KanjiEntry, 'c'> {
  c: number;
}

interface DatabaseVersionRecord extends DatabaseVersion {
  id: 1;
}

export class KanjiStore extends Dexie {
  kanji: Dexie.Table<KanjiRecord, number>;
  dbVersion: Dexie.Table<DatabaseVersionRecord, number>;

  constructor() {
    super('KanjiStore');
    this.version(1).stores({
      kanji: '&c, r.on*, r.kun*, r.na*, rad.x, misc.kk, misc.gr, misc.jlpt',
      dbVersion: 'id',
    });
  }

  async destroy() {
    return this.delete();
  }
}
