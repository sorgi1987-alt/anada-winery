import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { createServiceWorker } from '../pwa/service-worker'

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
  start_url: string
  scope: string
  display: string
  icons: Array<{ src: string; sizes: string; purpose: string }>
  shortcuts: Array<{ url: string }>
}

test('the web app manifest supports standalone installation and cellar shortcuts', () => {
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.scope, './')
  assert.equal(manifest.start_url, './#/dashboard')
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'))
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'))
  assert.deepEqual(manifest.shortcuts.map((shortcut) => shortcut.url), ['./#/dashboard', './#/cellar', './#/movements', './#/tasks'])
})

test('the install icons are real PNG assets at the declared dimensions', () => {
  for (const [file, size] of [['public/anada-192.png', 192], ['public/anada-512.png', 512], ['public/anada-apple-touch.png', 180]] as const) {
    assert.equal(existsSync(file), true)
    const image = readFileSync(file)
    assert.equal(image.subarray(1, 4).toString(), 'PNG')
    assert.equal(image.readUInt32BE(16), size)
    assert.equal(image.readUInt32BE(20), size)
  }
})

test('the generated service worker precaches chunks and never intercepts mutation requests', () => {
  const worker = createServiceWorker(['./index.html', './assets/index-123.js', './assets/index-123.css'], 'test')
  assert.match(worker, /anada-pwa-test/)
  assert.match(worker, /\.\/assets\/index-123\.js/)
  assert.match(worker, /cache\.addAll\(PRECACHE\)/)
  assert.match(worker, /request\.method !== 'GET'/)
  assert.match(worker, /response\.type === 'opaque'/)
  assert.match(worker, /request\.mode === 'navigate'/)
  assert.match(worker, /SKIP_WAITING/)
})
