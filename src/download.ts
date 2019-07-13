// import { KanjiEntry } from './common';

/*
type EntryEvent = KanjiEntry & { type: 'entry' };

interface DeletionEvent {
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

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  snapshot: number;
  databaseVersion: string;
  dateOfCreation: string;
}

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

type DownloadOptions = {
  baseUrl?: string;
  currentVersion?: {
    major: number;
    minor: number;
    patch: number;
  };
};

export function download(options?: DownloadOptions): ReadableStream {
  let controller: ReadableStreamDefaultController | undefined;
  const baseUrl =
    options && options.baseUrl ? options.baseUrl : DEFAULT_BASE_URL;

  return new ReadableStream({
    async start(defaultController) {
      controller = defaultController;

      // Fetch the initial version information
      const response = await fetch(baseUrl + 'kanji-rc-en-version.json');
      const versionInfo = await response.json();
      if (!isVersionInfo(versionInfo)) {
        controller.error(
          new Error(`Invalid version object: ${JSON.stringify(versionInfo)}`)
        );
      }

      // TODO: This will also be set when the major version changes etc.
      const doFullFetch = !options || !options.currentVersion;
      if (doFullFetch) {
        /*const baseline =*/ await fetch(
          `${baseUrl}kanji-rc-en-${versionInfo.major}.${versionInfo.minor}.${versionInfo.snapshot}-full.ljson`
        );
        // XXX Parse the baseline

        // Push the first version
        // (XXX This is just here for now to keep the tests passing. We really
        // should read the first line of the baseline first, check the version
        // there matches, then dispatch this.)
        const versionEvent: VersionEvent = {
          type: 'version',
          major: versionInfo.major,
          minor: versionInfo.minor,
          patch: versionInfo.snapshot,
          partial: false,
        };
        controller.enqueue(versionEvent);
      }

      controller.close();
    },
    cancel() {
      // XXX Cancel any fetch request here
    },
  });
}
