const quoted = (value: string) => JSON.stringify(value)

export const createServiceWorker = (files: string[], version: string) => {
  const precache = [...new Set(files)].sort()
  return `const CACHE_NAME = ${quoted(`anada-pwa-${version}`)}
const PRECACHE = ${JSON.stringify(precache, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('anada-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

const offlineNavigation = async (request) => {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put('./index.html', response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(CACHE_NAME)
    return (await cache.match('./index.html')) || (await cache.match('./')) || (await cache.match('./offline.html')) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

const cachedAsset = async (request) => {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request, { ignoreSearch: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET') return
  const staticDestination = ['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)
  if (url.origin !== self.location.origin && !['style', 'font', 'image'].includes(request.destination)) return
  if (request.mode === 'navigate') {
    event.respondWith(offlineNavigation(request))
    return
  }
  if (staticDestination) {
    event.respondWith(cachedAsset(request))
  }
})
`
}
