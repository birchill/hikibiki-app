import { DatabaseVersion, KanjiEntry } from './common';

// Produces a ReadableStream of DownloadEvents
//
// This really should have been an async generator instead of a stream but
// I didn't realize that until later. Oh well.

export type EntryEvent = KanjiEntry & { type: 'entry' };

export type DeletionEvent = {
  type: 'deletion';
  c: string;
};

export type VersionEvent = {
  type: 'version';
  major: number;
  minor: number;
  patch: number;
  databaseVersion?: string;
  dateOfCreation: string;
  partial: boolean;
};

export type ProgressEvent = {
  type: 'progress';
  loaded: number;
  total: number;
};

export type DownloadEvent =
  | VersionEvent
  | EntryEvent
  | DeletionEvent
  | ProgressEvent;

const DEFAULT_BASE_URL = 'https://d1uxefubru78xw.cloudfront.net/';

// How many percentage should change before we dispatch a new progress event.
const DEFAULT_MAX_PROGRESS_RESOLUTION = 0.05;

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  snapshot: number;
  databaseVersion: string;
  dateOfCreation: string;
}

type DownloadOptions = {
  baseUrl?: string;
  dbName: string;
  maxSupportedMajorVersion?: number;
  currentVersion?: {
    major: number;
    minor: number;
    patch: number;
  };
  lang?: string;
  maxProgressResolution?: number;
};

export const enum DownloadErrorCode {
  VersionFileNotFound,
  VersionFileNotAccessible,
  VersionFileInvalid,
  DatabaseFileNotFound,
  DatabaseFileNotAccessible,
  DatabaseFileHeaderMissing,
  DatabaseFileHeaderDuplicate,
  DatabaseFileVersionMismatch,
  DatabaseFileInvalidJSON,
  DatabaseFileInvalidRecord,
  DatabaseFileDeletionInSnapshot,
  DatabaseTooOld,
  UnsupportedDatabaseVersion,
}

export class DownloadError extends Error {
  code: DownloadErrorCode;

  constructor(code: DownloadErrorCode, ...params: any[]) {
    super(...params);
    Object.setPrototypeOf(this, DownloadError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DownloadError);
    }

    this.name = 'DownloadError';
    this.code = code;
  }
}

export function download({
  baseUrl = DEFAULT_BASE_URL,
  dbName,
  maxSupportedMajorVersion,
  currentVersion,
  lang = 'en',
  maxProgressResolution = DEFAULT_MAX_PROGRESS_RESOLUTION,
}: DownloadOptions): ReadableStream {
  const abortController = new AbortController();

  return new ReadableStream({
    async start(controller: ReadableStreamDefaultController<DownloadEvent>) {
      // Get the latest version info
      let versionInfo: VersionInfo;
      try {
        versionInfo = await getVersionInfo({
          dbName,
          baseUrl,
          lang,
          signal: abortController.signal,
        });
      } catch (e) {
        controller.error(e);
        controller.close();
        return;
      }

      // Check the local database is not ahead of what we're about to download
      if (currentVersion && compareVersions(currentVersion, versionInfo) > 0) {
        const versionToString = ({ major, minor, patch }: Version) =>
          `${major}.${minor}.${patch}`;
        controller.error(
          new DownloadError(
            DownloadErrorCode.DatabaseTooOld,
            `Database version (${versionToString(
              versionInfo
            )}) older than current version (${versionToString(currentVersion)})`
          )
        );
        controller.close();
        return;
      }

      // Check the version we're about to download is supported
      if (
        typeof maxSupportedMajorVersion === 'number' &&
        maxSupportedMajorVersion < versionInfo.major
      ) {
        const versionToString = ({ major, minor, patch }: Version) =>
          `${major}.${minor}.${patch}`;
        controller.error(
          new DownloadError(
            DownloadErrorCode.UnsupportedDatabaseVersion,
            `Database version (${versionToString(
              versionInfo
            )}) is not supported (supported version: ${maxSupportedMajorVersion})`
          )
        );
        controller.close();
        return;
      }

      // When we come to apply this approach to other databases it might make
      // sense to have a tolerance here where we skip loading all the
      // intermediate patches and jump to the nearest snapshot and start from
      // there instead.
      //
      // I suspect that tolerance would be pretty high, however, e.g. 100 or
      // more before it actually makes any sense.

      let currentPatch: number;
      if (
        !currentVersion ||
        // Check for a change in minor version
        compareVersions(currentVersion, {
          ...versionInfo,
          patch: 0,
        }) < 0
      ) {
        currentPatch = versionInfo.snapshot;
        try {
          for await (const event of getEvents({
            baseUrl,
            lang,
            maxProgressResolution,
            version: {
              major: versionInfo.major,
              minor: versionInfo.minor,
              patch: versionInfo.snapshot,
            },
            fileType: 'full',
            signal: abortController.signal,
          })) {
            if (abortController.signal.aborted) {
              const abortError = new Error();
              abortError.name = 'AbortError';
              throw abortError;
            }
            controller.enqueue(event);
          }
        } catch (e) {
          controller.error(e);
          controller.close();
          return;
        }
      } else {
        currentPatch = currentVersion.patch;
      }

      // Do incremental updates
      while (currentPatch < versionInfo.patch) {
        currentPatch++;
        try {
          for await (const event of getEvents({
            baseUrl,
            lang,
            maxProgressResolution,
            version: {
              major: versionInfo.major,
              minor: versionInfo.minor,
              patch: currentPatch,
            },
            fileType: 'patch',
            signal: abortController.signal,
          })) {
            if (abortController.signal.aborted) {
              const abortError = new Error();
              abortError.name = 'AbortError';
              throw abortError;
            }
            controller.enqueue(event);
          }
        } catch (e) {
          controller.error(e);
          controller.close();
          return;
        }
      }

      controller.close();
    },

    cancel() {
      abortController.abort();
    },
  });
}

type Version = {
  major: number;
  minor: number;
  patch: number;
};

function compareVersions(a: Version, b: Version): number {
  if (a.major < b.major) {
    return -1;
  }
  if (a.major > b.major) {
    return 1;
  }
  if (a.minor < b.minor) {
    return -1;
  }
  if (a.minor > b.minor) {
    return 1;
  }
  if (a.patch < b.patch) {
    return -1;
  }
  if (a.patch > b.patch) {
    return 1;
  }
  return 0;
}

async function getVersionInfo({
  baseUrl,
  dbName,
  lang,
  signal,
}: {
  baseUrl: string;
  dbName: string;
  lang: string;
  signal: AbortSignal;
}): Promise<VersionInfo> {
  // Get the file
  const response = await fetch(`${baseUrl}jpdict-rc-${lang}-version.json`, {
    signal,
  });
  if (!response.ok) {
    const code =
      response.status === 404
        ? DownloadErrorCode.VersionFileNotFound
        : DownloadErrorCode.VersionFileNotAccessible;
    throw new DownloadError(
      code,
      `Version file not accessible (status: ${response.status}`
    );
  }

  // Try to parse it
  let versionInfo;
  try {
    versionInfo = await response.json();
  } catch (e) {
    throw new DownloadError(
      DownloadErrorCode.VersionFileInvalid,
      `Invalid version object: ${e.message}`
    );
  }

  // Inspect and extract the database version information
  const dbVersionInfo = getLatestDbVersionInfo(versionInfo, dbName);
  if (!dbVersionInfo) {
    throw new DownloadError(
      DownloadErrorCode.VersionFileInvalid,
      `Invalid version object: ${JSON.stringify(versionInfo)}`
    );
  }

  return dbVersionInfo;
}

function getLatestDbVersionInfo(a: any, dbName: string): VersionInfo | null {
  if (!a || typeof a !== 'object') {
    return null;
  }

  if (
    typeof a[dbName] !== 'object' ||
    a[dbName] === null ||
    typeof a[dbName].latest !== 'object' ||
    a[dbName].latest === null ||
    typeof a[dbName].latest.major !== 'number' ||
    typeof a[dbName].latest.minor !== 'number' ||
    typeof a[dbName].latest.patch !== 'number' ||
    typeof a[dbName].latest.snapshot !== 'number' ||
    (typeof a[dbName].latest.databaseVersion !== 'string' &&
      typeof a[dbName].latest.databaseVersion !== 'undefined') ||
    typeof a[dbName].latest.dateOfCreation !== 'string'
  ) {
    return null;
  }

  const versionInfo = a[dbName].latest as VersionInfo;

  if (
    versionInfo.major < 1 ||
    versionInfo.minor < 0 ||
    versionInfo.patch < 0 ||
    versionInfo.snapshot < 0 ||
    !versionInfo.dateOfCreation.length
  ) {
    return null;
  }

  return versionInfo;
}

type HeaderLine = {
  type: 'header';
  version: DatabaseVersion;
  records: number;
};

function isHeaderLine(a: any): a is HeaderLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.type === 'string' &&
    a.type === 'header' &&
    typeof a.version === 'object' &&
    typeof a.version.major === 'number' &&
    typeof a.version.minor === 'number' &&
    typeof a.version.patch === 'number' &&
    typeof a.version.databaseVersion === 'string' &&
    typeof a.version.dateOfCreation === 'string' &&
    typeof a.records === 'number'
  );
}

type EntryLine = KanjiEntry;

// We're pretty strict about checking this. Since it's coming over the network
// it's basically untrusted data. Arguably nothing we're doing is privacy
// sensitive and adding all these checks just makes maintenance more difficult
// (since if we change the type of one of these fields we need to remember to
// update it here) but for now being conservative seems like the best default
// option.

function isEntryLine(a: any): a is EntryLine {
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
    // deleted (should NOT be present)
    typeof a.deleted === 'undefined'
  );
}

function isArrayOfStrings(a: any) {
  return (
    Array.isArray(a) &&
    (a as Array<any>).every(elem => typeof elem === 'string')
  );
}

function isArrayOfStringsOrNumbers(a: any) {
  return (
    Array.isArray(a) &&
    (a as Array<any>).every(
      elem => typeof elem === 'string' || typeof elem === 'number'
    )
  );
}

type DeletionLine = {
  c: string;
  deleted: true;
};

function isDeletionLine(a: any): a is DeletionLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.c === 'string' &&
    !!(a.c as string).length &&
    typeof a.deleted === 'boolean' &&
    a.deleted
  );
}

async function* getEvents({
  baseUrl,
  lang,
  maxProgressResolution,
  version,
  fileType,
  signal,
}: {
  baseUrl: string;
  lang: string;
  maxProgressResolution: number;
  version: Version;
  fileType: 'full' | 'patch';
  signal: AbortSignal;
}): AsyncIterableIterator<DownloadEvent> {
  const url = `${baseUrl}kanjidb-rc-${lang}-${version.major}.${version.minor}.${version.patch}-${fileType}.ljson`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    const code =
      response.status === 404
        ? DownloadErrorCode.DatabaseFileNotFound
        : DownloadErrorCode.DatabaseFileNotAccessible;
    throw new DownloadError(
      code,
      `Database file ${url} not accessible (status: ${response.status})`
    );
  }

  if (response.body === null) {
    throw new DownloadError(
      DownloadErrorCode.DatabaseFileNotAccessible,
      'Body is null'
    );
  }

  let headerRead = false;
  let lastProgressPercent = 0;
  let recordsRead = 0;
  let totalRecords = 0;

  for await (const line of ljsonStreamIterator(response.body)) {
    if (isHeaderLine(line)) {
      if (headerRead) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileHeaderDuplicate,
          `Got duplicate database header: ${JSON.stringify(line)}`
        );
      }

      if (compareVersions(line.version, version) !== 0) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileVersionMismatch,
          `Got mismatched database versions (Expected: ${JSON.stringify(
            version
          )} got: ${JSON.stringify(line.version)})`
        );
      }

      const versionEvent: VersionEvent = {
        ...line.version,
        type: 'version',
        partial: fileType === 'patch',
      };
      yield versionEvent;

      totalRecords = line.records;
      headerRead = true;
    } else {
      if (!headerRead) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileHeaderMissing,
          `Expected database version but got ${JSON.stringify(line)}`
        );
      }

      recordsRead++;

      if (isEntryLine(line)) {
        const entryEvent: EntryEvent = {
          type: 'entry',
          ...line,
        };
        yield entryEvent;
      } else if (isDeletionLine(line)) {
        // We shouldn't have deletion records when doing a full snapshot
        if (fileType === 'full') {
          throw new DownloadError(
            DownloadErrorCode.DatabaseFileDeletionInSnapshot
          );
        }

        const deletionEvent: DeletionEvent = {
          type: 'deletion',
          c: line.c,
        };
        yield deletionEvent;
      } else {
        // If we encounter anything unexpected we should fail.
        //
        // It might be tempting to make this "robust" by ignoring unrecognized
        // inputs but that could effectively leave us in an invalid state where
        // we claim to be update-to-date with database version X but are
        // actually missing some of the records.
        //
        // If anything unexpected shows up we should fail so we can debug
        // exactly what happenned.
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileInvalidRecord,
          `Got unexpected record: ${JSON.stringify(line)}`
        );
      }
    }

    // Dispatch a new ProgressEvent if we have passed the appropriate threshold
    if (
      totalRecords &&
      recordsRead / totalRecords - lastProgressPercent > maxProgressResolution
    ) {
      lastProgressPercent = recordsRead / totalRecords;
      yield { type: 'progress', loaded: recordsRead, total: totalRecords };
    }
  }
}

async function* ljsonStreamIterator(
  stream: ReadableStream<Uint8Array>
): AsyncIterableIterator<object> {
  const reader = stream.getReader();
  const lineEnd = /\n|\r|\r\n/m;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const parseLine = (line: string): any => {
    let json;
    try {
      json = JSON.parse(line);
    } catch (e) {
      reader.releaseLock();
      throw new DownloadError(
        DownloadErrorCode.DatabaseFileInvalidJSON,
        `Could not parse JSON in database file: ${line}`
      );
    }

    return json;
  };

  while (true) {
    let readResult: ReadableStreamReadResult<Uint8Array>;
    try {
      readResult = await reader.read();
    } catch (e) {
      reader.releaseLock();
      throw new DownloadError(
        DownloadErrorCode.DatabaseFileNotAccessible,
        e.message
      );
    }

    const { done, value } = readResult;

    if (done) {
      buffer += decoder.decode();
      if (buffer) {
        yield parseLine(buffer);
        buffer = '';
      }

      reader.releaseLock();
      return;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(lineEnd);

    // We don't know if the last line is actually the last line of the
    // input or not until we get done: true so we just assume it is
    // a partial line for now.
    buffer = lines.length ? lines.splice(lines.length - 1, 1)[0] : '';

    for (const line of lines) {
      if (!line) {
        continue;
      }

      yield parseLine(line);
    }
  }
}
