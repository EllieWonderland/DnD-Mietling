const CACHE_NAME = 'dnd-mietling-v4'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/pwa-icon.svg']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // Medien (Audio/Video): immer Netzwerk, nicht cachen
  const mediaExt = ['.mp3', '.mp4', '.mov', '.webm', '.wav', '.ogg']
  const isMedia = mediaExt.some(ext => url.pathname.toLowerCase().endsWith(ext))
    || event.request.destination === 'audio'
    || event.request.destination === 'video'

  if (isMedia) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // HTML / Navigation / Runtime-Config: NETWORK-FIRST.
  // index.html verweist auf gehashte Asset-Dateinamen — eine veraltete
  // gecachte index.html wuerde sonst dauerhaft die alte App-Version laden.
  // config.json ist Runtime-Konfiguration (WS-URL) und darf nie veralten.
  const isFresh = event.request.mode === 'navigate'
    || event.request.destination === 'document'
    || url.pathname === '/'
    || url.pathname.endsWith('.html')
    || url.pathname === '/config.json'

  if (isFresh) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))
    )
    return
  }

  // Uebrige Assets (gehashte JS/CSS, Bilder): cache-first + Hintergrund-Update
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || networkFetch
    })
  )
})
