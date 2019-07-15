import { KanjiEntry } from './common';

/*
type EntryEvent = KanjiEntry & { type: 'entry' };

type DeletionEvent = {
  type: 'deletion';
  c: string;
}

type Event = VersionEvent | EntryEvent | DeletionEvent;
*/

type VersionEvent = {
  type: 'version';
  major: number;
  minor: number;
  patch: number;
  partial: boolean;
};

export type DownloadEvent = VersionEvent;

// Produces a ReadableStream of Events

const DEFAULT_BASE_URL = 'https://d1uxefubru78xw.cloudfront.net/';

type VersionInfo = {
  major: number;
  minor: number;
  patch: number;
  snapshot: number;
  databaseVersion: string;
  dateOfCreation: string;
};

function isVersionInfo(a: any): a is VersionInfo {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.major === 'number' &&
    typeof a.minor === 'number' &&
    typeof a.patch === 'number' &&
    typeof a.snapshot === 'number' &&
    typeof a.databaseVersion === 'string' &&
    typeof a.dateOfCreation === 'string'
  );
}

function validateVersionInfo(versionInfo: VersionInfo): boolean {
  return (
    versionInfo.major >= 1 &&
    versionInfo.minor >= 0 &&
    versionInfo.patch >= 0 &&
    versionInfo.snapshot >= 0 &&
    !!versionInfo.databaseVersion.length &&
    !!versionInfo.dateOfCreation.length
  );
}

type DownloadOptions = {
  baseUrl?: string;
  currentVersion?: {
    major: number;
    minor: number;
    patch: number;
  };
};

export const enum DownloadErrorCode {
  VersionFileNotFound,
  VersionFileNotAccessible,
  VersionFileInvalid,
  DatabaseFileNotFound,
  DatabaseFileNotAccessible,
  DatabaseFileVersionMissing,
  DatabaseFileVersionMismatch,
  DatabaseFileInvalidJSON,
  DatabaseFileInvalidRecord,
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

  return new ReadableStream({
    async start(controller) {
      // Get the latest version info
      let latestVersion: VersionInfo;
      try {
        latestVersion = await getLatestVersion(baseUrl);
      } catch (e) {
        controller.error(e);
        return;
      }

      // TODO: This will also be set when the major version changes etc.
      const doFullFetch = !options || !options.currentVersion;
      if (doFullFetch) {
        const databaseFile = `kanji-rc-en-${latestVersion.major}.${latestVersion.minor}.${latestVersion.snapshot}-full.ljson`;
        const baseline = await fetch(`${baseUrl}${databaseFile}`);
        if (!baseline.ok) {
          const code =
            baseline.status === 404
              ? DownloadErrorCode.DatabaseFileNotFound
              : DownloadErrorCode.DatabaseFileNotAccessible;
          controller.error(
            new DownloadError(
              code,
              `Database file ${databaseFile} not accessible (status: ${baseline.status})`
            )
          );
          return;
        }

        if (baseline.body === null) {
          controller.error(
            new DownloadError(
              DownloadErrorCode.DatabaseFileNotAccessible,
              'Body is null'
            )
          );
          return;
        }

        const reader = baseline.body.getReader();
        const lineEnd = /\n|\r|\r\n/m;
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let versionRead = false;

        const read = async () => {
          let readResult: ReadableStreamReadResult<Uint8Array>;
          try {
            readResult = await reader.read();
          } catch (e) {
            controller.error(
              new DownloadError(
                DownloadErrorCode.DatabaseFileNotAccessible,
                e.message
              )
            );
            return;
          }

          const { done, value } = readResult;

          if (done) {
            if (buffer) {
              // XXX Process last line
            }

            controller.close();
            return;
          }

          buffer += decoder.decode(value);
          const lines = buffer.split(lineEnd);

          // We don't know if the last line is actually the last line of the
          // input or not until we get done: true so we just assume it is
          // a partial line for now.
          buffer = lines.length ? lines.splice(lines.length - 1, 1)[0] : '';

          for (const line of lines) {
            if (!line) {
              continue;
            }

            let jsonLine: Line;
            try {
              jsonLine = parseLine(line);
            } catch (e) {
              controller.error(e);
              return;
            }

            // XXX Do proper parsing of record type here
            if (!versionRead) {
              if (!isVersionLine(jsonLine)) {
                controller.error(
                  new DownloadError(
                    DownloadErrorCode.DatabaseFileVersionMissing,
                    `Expected database version but got ${line}`
                  )
                );
                return;
              }
              // XXX Once we fix the typings above we can drop the any casts
              // below
              if (
                jsonLine.major !== latestVersion.major ||
                jsonLine.minor !== latestVersion.minor ||
                jsonLine.patch !== latestVersion.snapshot
              ) {
                controller.error(
                  new DownloadError(
                    DownloadErrorCode.DatabaseFileVersionMismatch,
                    `Expected database version but got ${line}`
                  )
                );
                return;
              }
              // XXX Return the database version and creation date from the file
              const versionEvent: VersionEvent = {
                type: 'version',
                major: jsonLine.major,
                minor: jsonLine.minor,
                patch: jsonLine.patch,
                partial: false,
              };
              controller.enqueue(versionEvent);
              versionRead = true;
            }
          }

          read();
        };
        read();
      } else {
        controller.error(new Error('Incremental updates not supported yet'));
        controller.close();
      }
    },

    cancel() {
      // XXX Cancel any fetch request here
    },
  });
}

async function getLatestVersion(baseUrl: string): Promise<VersionInfo> {
  // Get the file
  const response = await fetch(baseUrl + 'kanji-rc-en-version.json');
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

function isEntryLine(a: any): a is EntryLine {
  return (
    typeof a === 'object' &&
    a !== null &&
    typeof a.r === 'object' &&
    // XXX Check these arrays only contain string values
    (typeof a.r.on === 'undefined' || Array.isArray(a.r.on)) &&
    (typeof a.r.kun === 'undefined' || Array.isArray(a.r.kun)) &&
    (typeof a.r.na === 'undefined' || Array.isArray(a.r.na)) &&
    // XXX Check this array is a string array
    Array.isArray(a.m) &&
    typeof a.rad === 'object' &&
    typeof a.rad.x === 'number' &&
    (typeof a.rad.nelson === 'undefined' || a.rad.nelson === 'number') &&
    // XXX Check this array is a string array
    (typeof a.rad.name === 'undefined' || Array.isArray(a.rad.name)) &&
    // XXX Validate references and misc fields too
    typeof a.deleted === 'undefined'
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
    typeof a.deleted === 'boolean' &&
    a.deleted
  );
}

type Line = VersionLine | EntryLine | DeletionLine;

function parseLine(line: string): Line {
  let json;
  try {
    json = JSON.parse(line);
  } catch (e) {
    throw new DownloadError(
      DownloadErrorCode.DatabaseFileInvalidJSON,
      `Could not parse JSON in database file: ${line}`
    );
  }

  if (!isVersionLine(json) && !isEntryLine(json) && !isDeletionLine(json)) {
    throw new DownloadError(
      DownloadErrorCode.DatabaseFileInvalidRecord,
      `Could not recognize record: ${line}`
    );
  }

  return json;
}
