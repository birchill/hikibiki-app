import deepEqual from 'deep-equal';

import { isRadicalEntryLine, isRadicalDeletionLine } from './bushudb';
import { DatabaseVersion } from './common';
import { download } from './download';
import {
  KanjiEntryLine,
  isKanjiEntryLine,
  isKanjiDeletionLine,
} from './kanjidb';
import { KanjiStore, KanjiRecord, RadicalRecord } from './store';
import { UpdateAction } from './update-actions';
import { UpdateState } from './update-state';
import { reducer as updateReducer } from './update-reducer';
import {
  cancelUpdate,
  updateKanji,
  updateRadicals,
  UpdateOptions,
} from './update';
import { stripFields } from './utils';

export const enum DatabaseState {
  // We don't know yet if we have a database or not
  Initializing,
  // No data has been stored yet
  Empty,
  // We have data, but it's not usable
  OutOfDate,
  // We have data and it's usable
  Ok,
}

export interface KanjiResult extends Omit<KanjiEntryLine, 'rad' | 'comp'> {
  rad: {
    x: number;
    nelson?: number;
    b?: string;
    k?: string;
    na: Array<string>;
    m: Array<string>;
    base?: {
      b?: string;
      k?: string;
      na: Array<string>;
      m: Array<string>;
    };
  };
  comp: Array<{
    c: string;
    na: Array<string>;
    m: Array<string>;
  }>;
}

export class KanjiDatabase {
  state: DatabaseState = DatabaseState.Initializing;
  updateState: UpdateState = { state: 'idle', lastCheck: null };
  store: KanjiStore;
  dbVersions: {
    kanjidb: DatabaseVersion | null | undefined;
    bushudb: DatabaseVersion | null | undefined;
  } = { kanjidb: undefined, bushudb: undefined };

  private readyPromise: Promise<any>;
  private inProgressUpdate: Promise<void> | undefined;
  private radicalsPromise: Promise<Map<string, RadicalRecord>> | undefined;
  private charToRadicalMap: Map<string, string> = new Map();

  constructor() {
    this.store = new KanjiStore();

    // Check initial state
    const getKanjiDbVersion = this.getDbVersion('kanjidb').then(version =>
      this.updateDbVersion('kanjidb', version)
    );
    const getRadicalDbVersion = this.getDbVersion('bushudb').then(version =>
      this.updateDbVersion('bushudb', version)
    );

    this.readyPromise = Promise.all([getKanjiDbVersion, getRadicalDbVersion]);

    // Pre-fetch the radical information (but don't block on this)
    this.readyPromise.then(() => this.getRadicals());
  }

  get ready() {
    return this.readyPromise;
  }

  private async getDbVersion(
    db: 'kanjidb' | 'bushudb'
  ): Promise<DatabaseVersion | null> {
    const versionDoc = await this.store.dbVersion.get(db === 'kanjidb' ? 1 : 2);
    if (!versionDoc) {
      return null;
    }

    return stripFields(versionDoc, ['id']);
  }

  private async updateDbVersion(
    db: 'kanjidb' | 'bushudb',
    version: DatabaseVersion | null
  ) {
    // So at some point we need to rewrite deep-equal. It:
    //
    // a) treats undefined and null as equal
    //    (despite the fact that they produce different JSON output)
    // b) treats a missing property and an undefined property as inequal
    //    (despite the fact that they produce the same JSON output)
    //
    // For now we just supplement it with an extra type check.
    if (
      deepEqual(this.dbVersions[db], version) &&
      typeof this.dbVersions[db] === typeof version
    ) {
      return;
    }

    // This is really quite hacky, but db-worker listens for changes to
    // properties on KanjiDatabase object so if we simply update a sub-property
    // it won't notice and hence won't notify the UI. As a result, we have to
    // completely replace the dbVersions object when we update it.
    this.dbVersions = { ...this.dbVersions, [db]: version };
    if (this.dbVersions.kanjidb === null || this.dbVersions.bushudb === null) {
      this.state = DatabaseState.Empty;
    } else if (
      typeof this.dbVersions.kanjidb !== 'undefined' &&
      typeof this.dbVersions.bushudb !== 'undefined'
    ) {
      this.state = DatabaseState.Ok;
    }

    // Invalidate our cached version of the radical database if we updated it
    if (db === 'bushudb') {
      this.radicalsPromise = undefined;
      this.charToRadicalMap = new Map();
    }
  }

  async update() {
    if (this.inProgressUpdate) {
      return this.inProgressUpdate;
    }

    try {
      this.inProgressUpdate = this.doUpdate({
        dbName: 'kanjidb',
        isEntryLine: isKanjiEntryLine,
        isDeletionLine: isKanjiDeletionLine,
        update: updateKanji,
      });
      await this.inProgressUpdate;
    } finally {
      this.inProgressUpdate = undefined;
    }

    try {
      this.inProgressUpdate = this.doUpdate({
        dbName: 'bushudb',
        isEntryLine: isRadicalEntryLine,
        isDeletionLine: isRadicalDeletionLine,
        update: updateRadicals,
      });
      await this.inProgressUpdate;
    } finally {
      this.inProgressUpdate = undefined;
    }
  }

  private async doUpdate<EntryLine, DeletionLine>({
    dbName,
    isEntryLine,
    isDeletionLine,
    update,
  }: {
    dbName: 'bushudb' | 'kanjidb';
    isEntryLine: (a: any) => a is EntryLine;
    isDeletionLine: (a: any) => a is DeletionLine;
    update: (options: UpdateOptions<EntryLine, DeletionLine>) => Promise<void>;
  }) {
    let wroteSomething = false;

    const reducer = (action: UpdateAction) => {
      this.updateState = updateReducer(this.updateState, action);
      if (action.type === 'finishdownload') {
        wroteSomething = true;
        this.updateDbVersion(dbName, action.version);
      }
    };

    await this.ready;

    // Check if we have been canceled while waiting to become ready
    if (!this.inProgressUpdate) {
      reducer({ type: 'abort', checkDate: null });
      throw new Error('AbortError');
    }

    const checkDate = new Date();

    try {
      reducer({ type: 'start' });

      const downloadStream = await download({
        dbName,
        maxSupportedMajorVersion: 1,
        currentVersion: this.dbVersions[dbName] || undefined,
        isEntryLine,
        isDeletionLine,
      });

      if (!this.inProgressUpdate) {
        throw new Error('AbortError');
      }

      await update({ downloadStream, store: this.store, callback: reducer });

      if (!this.inProgressUpdate) {
        throw new Error('AbortError');
      }

      reducer({ type: 'finish', checkDate });
    } catch (e) {
      if (e.message === 'AbortError') {
        // We should only update the last-check date if we actually made some
        // sort of update.
        reducer({
          type: 'abort',
          checkDate: wroteSomething ? checkDate : null,
        });
      } else {
        reducer({ type: 'error', error: e });
      }
      throw e;
    }
  }

  cancelUpdate(): boolean {
    const hadProgressUpdate = !!this.inProgressUpdate;
    this.inProgressUpdate = undefined;

    cancelUpdate(this.store);

    return hadProgressUpdate;
  }

  async destroy() {
    // Wait for radicals query to finish before tidying up
    await this.getRadicals();
    await this.store.destroy();
    this.store = new KanjiStore();
    this.state = DatabaseState.Empty;
    this.updateState = { state: 'idle', lastCheck: null };
    this.dbVersions = { kanjidb: undefined, bushudb: undefined };
  }

  async getKanji(kanji: Array<string>): Promise<Array<KanjiResult>> {
    await this.ready;

    if (this.state !== DatabaseState.Ok) {
      return [];
    }

    const ids = kanji.map(kanji => kanji.codePointAt(0)!);
    const records = await this.store.kanji.bulkGet(ids);

    const kanjiRecords: Array<KanjiRecord> = records.filter(
      (record: KanjiRecord | undefined) => typeof record !== 'undefined'
    );

    const radicalResults = await this.getRadicalForKanji(kanjiRecords);
    if (kanjiRecords.length !== radicalResults.length) {
      throw new Error(
        `There should be as many kanji records (${kanjiRecords.length}) as radical blocks (${radicalResults.length})`
      );
    }

    const componentResults = await this.getComponentsForKanji(kanjiRecords);
    if (kanjiRecords.length !== componentResults.length) {
      throw new Error(
        `There should be as many kanji records (${kanjiRecords.length}) as component arrays (${componentResults.length})`
      );
    }

    // Zip the arrays together
    return kanjiRecords.map((record, i) => {
      return {
        ...record,
        c: String.fromCodePoint(record.c),
        rad: radicalResults[i],
        comp: componentResults[i],
      };
    });
  }

  async getRadicalForKanji(
    kanjiRecords: Array<KanjiRecord>
  ): Promise<Array<KanjiResult['rad']>> {
    const radicals = await this.getRadicals();

    return kanjiRecords.map(record => {
      const radicalVariant = radicals.get(radicalIdForKanji(record));
      let rad: KanjiResult['rad'];
      if (radicalVariant) {
        rad = {
          ...record.rad,
          b: radicalVariant.b,
          k: radicalVariant.k,
          na: radicalVariant.na,
          m: radicalVariant.m,
        };
      } else {
        // The radical was not found. This should basically never happen.
        // But rather than crash fatally, just fill in some nonsense data
        // instead.
        console.error(`Failed to find radical: ${radicalIdForKanji(record)}`);
        rad = {
          ...record.rad,
          // We generally maintain the invariant that either 'b' or 'k' is
          // filled in (or both for a base radical) so even though the TS
          // typings don't require it, we should provide one here.
          b: '�',
          na: [''],
          m: [''],
        };
      }

      // If this a variant, return the base radical information too
      if (record.rad.var) {
        const baseRadical = radicals.get(baseRadicalIdForKanji(record));
        if (baseRadical) {
          const { b, k, na, m } = baseRadical;
          rad.base = { b, k, na, m };
        }
      }

      return rad;
    });
  }

  async getComponentsForKanji(
    kanjiRecords: Array<KanjiRecord>
  ): Promise<Array<KanjiResult['comp']>> {
    // Collect all the characters together
    const components = kanjiRecords.reduce<Array<string>>(
      (components, record) =>
        components.concat(record.comp ? [...record.comp] : []),
      []
    );

    // Work out which kanji characters we need to lookup
    const radicalMap = await this.getCharToRadicalMapping();
    const kanjiToLookup = new Set<number>();
    for (const c of components) {
      if (c && !radicalMap.has(c)) {
        kanjiToLookup.add(c.codePointAt(0)!);
      }
    }

    // ... And look them up
    let kanjiMap: Map<string, KanjiRecord> = new Map();
    if (kanjiToLookup.size) {
      const kanjiRecords = await this.store.kanji
        .where('c')
        .anyOf([...kanjiToLookup]);
      kanjiMap = new Map(
        (await kanjiRecords.toArray()).map(record => [
          String.fromCodePoint(record.c),
          record,
        ])
      );
    }

    // Now fill out the information
    const radicals = await this.getRadicals();
    const result: Array<KanjiResult['comp']> = [];
    for (const record of kanjiRecords) {
      const comp: KanjiResult['comp'] = [];
      for (const c of record.comp ? [...record.comp] : []) {
        if (radicalMap.has(c)) {
          const radicalRecord = radicals.get(radicalMap.get(c)!);
          if (radicalRecord) {
            comp.push({
              c,
              na: radicalRecord.na,
              m: radicalRecord.m,
            });
            continue;
          }
        } else if (kanjiMap.has(c)) {
          const kanjiRecord = kanjiMap.get(c);
          if (kanjiRecord) {
            let na: Array<string> = [];
            if (kanjiRecord.r.kun && kanjiRecord.r.kun.length) {
              na = kanjiRecord.r.kun.map(reading => reading.replace('.', ''));
            } else if (kanjiRecord.r.on && kanjiRecord.r.on.length) {
              na = kanjiRecord.r.on;
            }

            comp.push({
              c,
              na,
              m: kanjiRecord.m,
            });
            continue;
          }
        }
        console.error(`Couldn't find a radical or kanji entry for ${c}`);
      }

      result.push(comp);
    }

    return result;
  }

  async getRadicals(): Promise<Map<string, RadicalRecord>> {
    await this.ready;

    if (!this.radicalsPromise) {
      this.radicalsPromise = this.store.bushu.toArray().then(records => {
        return new Map(records.map(record => [record.id, record]));
      });
    }

    return this.radicalsPromise;
  }

  async getCharToRadicalMapping(): Promise<Map<string, string>> {
    if (this.charToRadicalMap.size) {
      return this.charToRadicalMap;
    }

    const radicals = await this.getRadicals();

    let baseRadical: RadicalRecord | undefined;
    const mapping: Map<string, string> = new Map();

    for (const radical of radicals.values()) {
      if (radical.id.indexOf('-') === -1) {
        baseRadical = radical;
        if (radical.b) {
          mapping.set(radical.b, radical.id);
        }
        if (radical.k) {
          mapping.set(radical.k, radical.id);
        }
      } else {
        if (!baseRadical) {
          throw new Error('Radicals out of order--no base radical found');
        }
        if (radical.r !== baseRadical.r) {
          throw new Error('Radicals out of order--ID mismatch');
        }
        if (radical.b && radical.b !== baseRadical.b) {
          mapping.set(radical.b, radical.id);
        }
        if (radical.k && radical.k !== baseRadical.k) {
          mapping.set(radical.k, radical.id);
        }
      }
    }

    this.charToRadicalMap = mapping;

    return mapping;
  }

  // XXX Check for offline events?
}

function baseRadicalIdForKanji(record: KanjiRecord): string {
  return record.rad.x.toString().padStart(3, '0');
}

function radicalIdForKanji(record: KanjiRecord): string {
  let id = baseRadicalIdForKanji(record);
  if (record.rad.var) {
    id += `-${record.rad.var}`;
  }
  return id;
}
