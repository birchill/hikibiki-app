// The following is somewhat duplicated from the definitions in KanjiDicParser
// (from the jpdict-sync repo) but it is simplified to represent the schema of
// what is actually included in the JSON export.
//
// Some day we'll find a good way of sharing those definitions.

export interface KanjiEntry {
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

// Note this refers to a radical components of a KanjiEntry. See RadicalEntry
// below for the actual record in the radical (bushu) database.
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

interface DatabaseVersion {
  major: number;
  minor: number;
  patch: number;
  databaseVersion?: string;
  dateOfCreation: string;
}

export interface RadicalEntry {
  r: number;
  b?: string;
  k?: string;
  pua?: number;
  s: number;
  na: Array<string>;
  posn?: 'hen' | 'tsukuri' | 'kanmuri' | 'ashi' | 'tare' | 'nyou' | 'kamae';
  m: {
    [lang: string]: Array<string>;
  };
}
