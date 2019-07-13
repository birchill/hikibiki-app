// import { KanjiEntry } from './common';

/*
interface EntryEvent = KanjiEntry & { type: 'entry' };

interface DeletionEvent {
  type: 'deletion';
  c: string;
}

type Event = VersionEvent | EntryEvent | DeletionEvent;
*/

interface VersionEvent {
  type: 'version';
  major: number;
  minor: number;
  patch: number;
  partial: boolean;
}

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
  // XXX Take a base version here
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

      // Push the first version
      // XXX Actually add the logic here for deciding which event to dispatch
      const versionEvent: VersionEvent = {
        type: 'version',
        major: versionInfo.major,
        minor: versionInfo.minor,
        patch: versionInfo.patch,
        partial: false,
      };
      controller.enqueue(versionEvent);
      controller.close();
    },
    cancel() {
      // XXX Catch any fetch request here
    },
  });
}
