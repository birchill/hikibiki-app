import { isArrayOfStrings, isArrayOfStringsOrNumbers } from './utils';

export interface KanjiEntryLine {
  c: string;
  r: Readings;
  m: Array<string>;
  rad: Radical;
  refs: References;
  misc: Misc;
  comp?: string;
}

interface Readings {
  on?: Array<string>;
  kun?: Array<string>;
  na?: Array<string>;
}

interface Radical {
  x: number;
  nelson?: number;
  name?: Array<string>;
  var?: string;
}

interface References {
  [ref: string]: string | number;
}

interface Misc {
  gr?: number;
  sc: number;
  freq?: number;
  jlpt?: number;
  kk?: number;
}

export interface KanjiDeletionLine {
  c: string;
  deleted: true;
}

// We're pretty strict about checking this. Since it's coming over the network
// it's untrusted data. Arguably nothing we're doing is privacy sensitive and
// adding all these checks just makes maintenance more difficult (since if we
// change the type of one of these fields we need to remember to update it here)
// but for now being conservative seems like the best default option.

export function isKanjiEntryLine(a: any): a is KanjiEntryLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    // c
    typeof a.c === 'string' &&
    !!(a.c as string).length &&
    // r
    typeof a.r === 'object' &&
    a.r !== null &&
    (typeof a.r.on === 'undefined' || isArrayOfStrings(a.r.on)) &&
    (typeof a.r.kun === 'undefined' || isArrayOfStrings(a.r.kun)) &&
    (typeof a.r.na === 'undefined' || isArrayOfStrings(a.r.na)) &&
    // m
    isArrayOfStrings(a.m) &&
    // rad
    typeof a.rad === 'object' &&
    a.rad !== null &&
    typeof a.rad.x === 'number' &&
    (typeof a.rad.nelson === 'undefined' || typeof a.rad.nelson === 'number') &&
    (typeof a.rad.name === 'undefined' || isArrayOfStrings(a.rad.name)) &&
    (typeof a.rad.var === 'undefined' || typeof a.rad.var === 'string') &&
    // refs
    typeof a.refs === 'object' &&
    a.refs !== null &&
    isArrayOfStringsOrNumbers(Object.values(a.refs)) &&
    // misc
    typeof a.misc !== 'undefined' &&
    a.misc !== null &&
    (typeof a.misc.gh === 'undefined' || typeof a.misc.gh === 'number') &&
    typeof a.misc.sc === 'number' &&
    (typeof a.misc.freq === 'undefined' || typeof a.misc.freq === 'number') &&
    (typeof a.misc.jlpt === 'undefined' || typeof a.misc.jlpt === 'number') &&
    (typeof a.misc.kk === 'undefined' || typeof a.misc.kk === 'number') &&
    // comp
    (typeof a.comp === 'undefined' || typeof a.comp === 'string') &&
    // deleted (should NOT be present)
    typeof a.deleted === 'undefined'
  );
}

export function isKanjiDeletionLine(a: any): a is KanjiDeletionLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.c === 'string' &&
    !!(a.c as string).length &&
    typeof a.deleted === 'boolean' &&
    a.deleted
  );
}
