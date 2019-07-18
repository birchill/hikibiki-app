import { KanjiEntry } from './common';

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
  databaseVersion: string;
  dateOfCreation: string;
  partial: boolean;
};

export type ProgressEvent = {
  type: 'progress';
  loaded: number;
  total: number | null;
};

export type DownloadEvent =
  | VersionEvent
  | EntryEvent
  | DeletionEvent
  | ProgressEvent;

const DEFAULT_BASE_URL = 'https://d1uxefubru78xw.cloudfront.net/';

type VersionInfo = {
  latest: {
    major: number;
    minor: number;
    patch: number;
    snapshot: number;
    databaseVersion: string;
    dateOfCreation: string;
  };
};

function isVersionInfo(a: any): a is VersionInfo {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.latest === 'object' &&
    a.latest !== null &&
    typeof a.latest.major === 'number' &&
    typeof a.latest.minor === 'number' &&
    typeof a.latest.patch === 'number' &&
    typeof a.latest.snapshot === 'number' &&
    typeof a.latest.databaseVersion === 'string' &&
    typeof a.latest.dateOfCreation === 'string'
  );
}

function validateVersionInfo(versionInfo: VersionInfo): boolean {
  return (
    versionInfo.latest.major >= 1 &&
    versionInfo.latest.minor >= 0 &&
    versionInfo.latest.patch >= 0 &&
    versionInfo.latest.snapshot >= 0 &&
    !!versionInfo.latest.databaseVersion.length &&
    !!versionInfo.latest.dateOfCreation.length
  );
}

type DownloadOptions = {
  baseUrl?: string;
  maxSupportedMajorVersion?: number;
  currentVersion?: {
    major: number;
    minor: number;
    patch: number;
  };
  lang?: string;
};

export const enum DownloadErrorCode {
  VersionFileNotFound,
  VersionFileNotAccessible,
  VersionFileInvalid,
  DatabaseFileNotFound,
  DatabaseFileNotAccessible,
  DatabaseFileVersionMissing,
  DatabaseFileVersionMismatch,
  DatabaseFileVersionDuplicate,
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

export function download(options?: DownloadOptions): ReadableStream {
  const baseUrl =
    options && options.baseUrl ? options.baseUrl : DEFAULT_BASE_URL;
  const lang = options && options.lang ? options.lang : 'en';

  const abortController = new AbortController();

  return new ReadableStream({
    async start(controller) {
      // Get the latest version info
      let versionInfo: VersionInfo;
      try {
        versionInfo = await getVersionInfo({
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
      if (
        options &&
        options.currentVersion &&
        compareVersions(options.currentVersion, versionInfo.latest) > 0
      ) {
        const versionToString = ({ major, minor, patch }: Version) =>
          `${major}.${minor}.${patch}`;
        controller.error(
          new DownloadError(
            DownloadErrorCode.DatabaseTooOld,
            `Database version (${versionToString(
              versionInfo.latest
            )}) older than current version (${versionToString(
              options.currentVersion
            )})`
          )
        );
        controller.close();
        return;
      }

      // Check the version we're about to download is supported
      if (
        options &&
        typeof options.maxSupportedMajorVersion === 'number' &&
        options.maxSupportedMajorVersion < versionInfo.latest.major
      ) {
        const versionToString = ({ major, minor, patch }: Version) =>
          `${major}.${minor}.${patch}`;
        controller.error(
          new DownloadError(
            DownloadErrorCode.UnsupportedDatabaseVersion,
            `Database version (${versionToString(
              versionInfo.latest
            )}) is not supported (supported version: ${
              options.maxSupportedMajorVersion
            })`
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
        !options ||
        !options.currentVersion ||
        // Check for a change in minor version
        compareVersions(options.currentVersion, {
          ...versionInfo.latest,
          patch: 0,
        }) < 0
      ) {
        currentPatch = versionInfo.latest.snapshot;
        try {
          for await (const event of getEvents({
            baseUrl,
            lang,
            version: {
              major: versionInfo.latest.major,
              minor: versionInfo.latest.minor,
              patch: versionInfo.latest.snapshot,
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
        currentPatch = options.currentVersion.patch;
      }

      // Do incremental updates
      while (currentPatch < versionInfo.latest.patch) {
        currentPatch++;
        try {
          for await (const event of getEvents({
            baseUrl,
            lang,
            version: {
              major: versionInfo.latest.major,
              minor: versionInfo.latest.minor,
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
  lang,
  signal,
}: {
  baseUrl: string;
  lang: string;
  signal: AbortSignal;
}): Promise<VersionInfo> {
  // Get the file
  const response = await fetch(`${baseUrl}kanji-rc-${lang}-version.json`, {
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

  // Check it is valid
  if (!isVersionInfo(versionInfo) || !validateVersionInfo(versionInfo)) {
    throw new DownloadError(
      DownloadErrorCode.VersionFileInvalid,
      `Invalid version object: ${JSON.stringify(versionInfo)}`
    );
  }

  return versionInfo;
}

type VersionLine = {
  type: 'version';
  major: number;
  minor: number;
  patch: number;
  databaseVersion: string;
  dateOfCreation: string;
};

function isVersionLine(a: any): a is VersionLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.major === 'number' &&
    typeof a.minor === 'number' &&
    typeof a.patch === 'number' &&
    typeof a.databaseVersion === 'string' &&
    typeof a.dateOfCreation === 'string'
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
    (typeof a.rad.nelson === 'undefined' || a.rad.nelson === 'number') &&
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
  version,
  fileType,
  signal,
}: {
  baseUrl: string;
  lang: string;
  version: Version;
  fileType: 'full' | 'patch';
  signal: AbortSignal;
}): AsyncIterableIterator<DownloadEvent> {
  const url = `${baseUrl}kanji-rc-${lang}-${version.major}.${version.minor}.${version.patch}-${fileType}.ljson`;
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

  // The server needs to send CORS header "Access-Control-Expose-Headers:
  // content-length" in order for us to be able to get this.
  const contentLengthStr = response.headers.get('content-length');
  const contentLength =
    contentLengthStr === null ? null : parseInt(contentLengthStr, 10);

  // Dispatch the first ProgressEvent. The caller can check if 'total' is null
  // or not to determine if they should initialize any progress as an
  // indeterminate state or a zero state.
  yield { type: 'progress', loaded: 0, total: contentLength };

  let versionRead = false;
  let lastProgressPercent = 0;

  // How many percentage should change before we dispatch a new progress event.
  const PROGRESS_RESOLUTION = 0.05;

  for await (const [line, bytesRead] of ljsonStreamIterator(response.body)) {
    if (isVersionLine(line)) {
      if (versionRead) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileVersionDuplicate,
          `Expected database version but got ${JSON.stringify(line)}`
        );
      }

      if (compareVersions(line, version) !== 0) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileVersionMismatch,
          `Expected database version but got ${JSON.stringify(line)}`
        );
      }

      const versionEvent: VersionEvent = {
        type: 'version',
        major: line.major,
        minor: line.minor,
        patch: line.patch,
        databaseVersion: line.databaseVersion,
        dateOfCreation: line.dateOfCreation,
        partial: fileType === 'patch',
      };
      yield versionEvent;
      versionRead = true;
    } else {
      if (!versionRead) {
        throw new DownloadError(
          DownloadErrorCode.DatabaseFileVersionMissing,
          `Expected database version but got ${JSON.stringify(line)}`
        );
      }

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
      contentLength &&
      bytesRead / contentLength - lastProgressPercent > PROGRESS_RESOLUTION
    ) {
      lastProgressPercent = bytesRead / contentLength;
      yield { type: 'progress', loaded: bytesRead, total: contentLength };
    }
  }
}

async function* ljsonStreamIterator(
  stream: ReadableStream<Uint8Array>
): AsyncIterableIterator<[object, number]> {
  const reader = stream.getReader();
  const lineEnd = /\n|\r|\r\n/m;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let bytesRead = 0;

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
        yield [parseLine(buffer), bytesRead];
        buffer = '';
      }

      reader.releaseLock();
      return;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(lineEnd);

    // This is pretty rough. The actual result could be different due to how
    // much was in the buffer already and how much we leave in the buffer at the
    // end.
    const bytesPerLine = value.byteLength / lines.length;

    // We don't know if the last line is actually the last line of the
    // input or not until we get done: true so we just assume it is
    // a partial line for now.
    buffer = lines.length ? lines.splice(lines.length - 1, 1)[0] : '';

    for (const [i, line] of lines.entries()) {
      if (!line) {
        continue;
      }

      yield [parseLine(line), bytesRead + (i + 1) * bytesPerLine];
    }

    // We add the actual number of bytes read here so we don't accumulate
    // error from our rough estimate above.
    bytesRead += value.byteLength;
  }
}
