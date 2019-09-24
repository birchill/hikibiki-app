import { h, render } from 'preact';

import { DatabaseVersion } from './common';
import { DatabaseState, KanjiResult } from './database';
import { DB_LANGUAGES } from './db-languages';
import { CloneableUpdateState } from './update-state';
import { WorkerMessage } from './worker-messages';
import * as messages from './worker-messages';

import { App } from './components/App';
import { PanelState } from './components/DatabaseStatus';

import './index.css';

const dbWorker = new Worker('./db-worker', { type: 'module' });

let databaseState: DatabaseState = DatabaseState.Initializing;
let databaseVersions: {
  kanjidb?: DatabaseVersion;
  bushudb?: DatabaseVersion;
} = {};
let updateState: CloneableUpdateState = { state: 'idle', lastCheck: null };
let entries: Array<KanjiResult> = [];

dbWorker.onmessage = (evt: MessageEvent) => {
  switch ((evt.data as WorkerMessage).type) {
    case 'dbstateupdated':
      const { state } = evt.data;
      if (
        databaseState !== DatabaseState.Ok &&
        state.databaseState === DatabaseState.Ok
      ) {
        runQuery();
      } else if (entries.length && state.databaseState !== DatabaseState.Ok) {
        entries = [];
      }
      databaseState = state.databaseState;
      updateState = state.updateState;
      databaseVersions = state.versions;
      runInitialDbUpdate();
      update();
      break;

    case 'queryresult':
      entries = evt.data.results;
      update();
      break;
  }
};

let triggeredInitialUpdate = false;

async function runInitialDbUpdate() {
  if (triggeredInitialUpdate) {
    return;
  }

  triggeredInitialUpdate = true;

  // Check if we have an existing language selected
  let preferredLang: string | null = null;
  if (databaseVersions.kanjidb) {
    preferredLang = databaseVersions.kanjidb.lang;
  }
  if (!preferredLang) {
    // Otherwise use the user's most preferred language
    const userLanguages = navigator.languages.map(lang => lang.substring(0, 2));
    for (const lang of userLanguages) {
      if (DB_LANGUAGES.includes(lang)) {
        preferredLang = lang;
        break;
      }
    }
  }

  if (preferredLang) {
    await setPreferredLang(preferredLang);
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(updateDb, { timeout: 4000 });
  } else {
    window.setTimeout(updateDb, 1000);
  }
}

dbWorker.onmessageerror = (evt: MessageEvent) => {
  console.log(`Worker error: ${JSON.stringify(evt)}`);
};

const updateDb = () => {
  dbWorker.postMessage(messages.updateDb());
};

const cancelDbUpdate = () => {
  dbWorker.postMessage(messages.cancelDbUpdate());
};

const destroyDb = () => {
  dbWorker.postMessage(messages.destroyDb());
};

async function setPreferredLang(lang: string | null): Promise<boolean> {
  dbWorker.postMessage(messages.setPreferredLang({ lang }));

  return new Promise((resolve, reject) => {
    const checkForResult = (evt: MessageEvent) => {
      const workerMessage = evt.data;
      if (workerMessage.type !== 'setpreferredlangresult') {
        return;
      }

      // Check it wasn't an overlapping request
      if (workerMessage.lang !== lang) {
        return;
      }

      dbWorker.removeEventListener('message', checkForResult);
      if (!workerMessage.ok) {
        reject();
      }
      resolve();
    };

    dbWorker.addEventListener('message', checkForResult);
  });
}

async function onSetLang(lang: string) {
  await setPreferredLang(lang);
  updateDb();
}

let enabledReferences = new Set<string>(['kanken']);
let enabledLinks = new Set<string>(['kanjialive', 'wiktionary']);

// See if we have any stored settings
//
// You've heard how bad localStorage is. Trust me, it's fine for this particular
// usage. Once we have more than two prefs, we should switch to an async
// approach local IDB, but for now it's not worth it.
const storedReferences = localStorage.getItem('kanji-references');
if (storedReferences !== null) {
  // Drop any empty items since ''.split(',') will give [''] but we want
  // an empty array in that case.
  const asArray = storedReferences.split(',').filter(item => item.length);
  enabledReferences = new Set<string>(asArray);
}
const storedLinks = localStorage.getItem('kanji-links');
if (storedLinks !== null) {
  const asArray = storedLinks.split(',').filter(item => item.length);
  enabledLinks = new Set<string>(asArray);
}

function toggleSetValue(
  set: Set<string>,
  storageKey: string,
  key: string,
  state: boolean
) {
  if (state) {
    set.add(key);
  } else {
    set.delete(key);
  }
  update();

  // Update our local storage
  localStorage.setItem(storageKey, Array.from(set.values()).join(','));
}

const onToggleReference = toggleSetValue.bind(
  null,
  enabledReferences,
  'kanji-references'
);
const onToggleLink = toggleSetValue.bind(null, enabledLinks, 'kanji-links');

let kanjiPanelState: PanelState = PanelState.Collapsed;

const params = new URL(document.location.href).searchParams;
const kanji = params.get('kanji');

function runQuery() {
  if (kanji) {
    dbWorker.postMessage(messages.query({ kanji: [...kanji] }));
  }
}

function update() {
  render(
    <App
      databaseState={databaseState}
      databaseVersions={databaseVersions}
      updateState={updateState}
      entries={entries}
      kanjiPanelState={kanjiPanelState}
      enabledReferences={Array.from(enabledReferences.values())}
      enabledLinks={Array.from(enabledLinks.values())}
      onUpdateDb={updateDb}
      onCancelDbUpdate={cancelDbUpdate}
      onDestroyDb={destroyDb}
      onSetLang={onSetLang}
      onToggleActive={() => {
        if (kanjiPanelState === PanelState.Disabled) {
          kanjiPanelState = PanelState.Collapsed;
        } else {
          kanjiPanelState = PanelState.Disabled;
        }
        update();
      }}
      onToggleSettings={() => {
        if (kanjiPanelState === PanelState.Collapsed) {
          kanjiPanelState = PanelState.Expanded;
        } else {
          kanjiPanelState = PanelState.Collapsed;
        }
        update();
      }}
      onToggleReference={onToggleReference}
      onToggleLink={onToggleLink}
    />,
    document.body
  );
}

update();
