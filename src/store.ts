import Dexie from 'dexie';

import { RadicalEntry, DatabaseVersion } from './common';
import { KanjiEntryLine, KanjiDeletionLine } from './kanjidb';

// Define a variant on KanjiEntryLine that turns 'c' into a number
export interface KanjiRecord extends Omit<KanjiEntryLine, 'c'> {
  c: number;
}

export function toKanjiRecord(entry: KanjiEntryLine): KanjiRecord {
  return {
    ...entry,
    c: entry.c.codePointAt(0) as number,
  };
}

export function getIdForKanjiRecord(entry: KanjiDeletionLine): number {
  return entry.c.codePointAt(0) as number;
}

export interface RadicalRecord extends RadicalEntry {
  id: number;
}

export interface DatabaseVersionRecord extends DatabaseVersion {
  id: 1 | 2;
}

export class KanjiStore extends Dexie {
  kanji: Dexie.Table<KanjiRecord, number>;
  bushu: Dexie.Table<RadicalRecord, number>;
  dbVersion: Dexie.Table<DatabaseVersionRecord, number>;

  constructor() {
    super('KanjiStore');
    this.version(1).stores({
      kanji: '&c, r.on*, r.kun*, r.na*, rad.x, misc.kk, misc.gr, misc.jlpt',
      bushu: '&id, r, b, k, na*',
      dbVersion: 'id',
    });
  }

  async destroy() {
    return this.delete();
  }
}
