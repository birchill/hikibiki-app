declare var self: ServiceWorkerGlobalScope;

type AssetInfo = {
  revision: string | null;
  url: string;
};

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<AssetInfo>;
  }
}

const bundledAssets = self.__WB_MANIFEST;

declare const __BUILD_ID__: string;
const APP_CACHE = __BUILD_ID__;

self.addEventListener('install', (evt: ExtendableEvent) => {
  self.skipWaiting();

  evt.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      cache.addAll(
        bundledAssets
          .filter((asset) => asset.url !== '_headers')
          .map((asset) => (asset.url === 'index.html' ? '/' : `/${asset.url}`))
      );
    })
  );
});

self.addEventListener('activate', (evt: ExtendableEvent) => {
  evt.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== APP_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      ).then(() => self.clients.claim());
    })()
  );
});

self.addEventListener('fetch', (evt: FetchEvent) => {
  // Don't try to cache cross-site requests (typically to get the data files)
  if (!evt.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Don't try and cache the webpack dev server stuff
  if (evt.request.url.indexOf('sockjs-node') !== -1) {
    return;
  }

  // Fix console error that occurs when using Lighthouse in Chrome
  //
  // https://bugs.chromium.org/p/chromium/issues/detail?id=823392
  if (
    evt.request.cache === 'only-if-cached' &&
    evt.request.mode !== 'same-origin'
  ) {
    return;
  }

  // In fact, only return things in our cache
  //
  // It's really tempting to try and update cache items but we'd break version
  // consistency if we do that.
  //
  // For example, suppose this service worker corresponds to "v3" of the app.
  //
  // At some point in the future the user requests "index.html" and we return
  // v3 of index.html. However, because we're over-achievers, we go ahead and
  // fetch index.html from the network and update our cache "for next time".
  //
  // However, since the app has been updated in the meantime, we get back "v5"
  // of index.html and stick that in the cache.
  //
  // Later, when the user opens the app, we service up "v5" of index.html.
  //
  // The trouble is, "v5" of index.html refers to hikibiki.v5.js but that that
  // no longer exists on the server since the app is now up to v8. Instead
  // we simply maintain a single set of assets corresponding to a particular
  // version of the app and only ever serve that set.
  evt.respondWith(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      const response = await cache.match(evt.request, { ignoreSearch: true });
      return response || fetch(evt.request);
    })()
  );
});

// Needed so we can re-type self
export default null;
