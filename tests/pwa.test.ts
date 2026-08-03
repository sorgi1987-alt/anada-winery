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

test('the production configurator uses a full-screen touch contract on phones', () => {
  const styles = readFileSync('src/styles.css', 'utf8')
  const flow = readFileSync('src/CreateLotFlow.tsx', 'utf8')
  assert.match(styles, /\.lot-flow-layer \.lot-flow\{width:100%;min-width:0;max-width:100%;height:100dvh;max-height:none/)
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/)
  assert.match(styles, /\.lot-flow-layer \.flow-progress\{[^}]+grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
  assert.match(styles, /\.lot-flow-layer \.lot-flow-actions\{[^}]+display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(styles, /\.lot-flow-layer \.lot-flow-actions button\{width:100%;min-width:0;max-width:100%/)
  assert.match(styles, /\.lot-flow-layer \.flow-field input,[^}]+font-size:16px/)
  assert.match(styles, /env\(safe-area-inset-bottom\)/)
  assert.match(styles, /-webkit-overflow-scrolling:touch/)
  assert.match(flow, /document\.body\.style\.overflow = 'hidden'/)
  assert.doesNotMatch(flow, /<input autoFocus required value=\{draft\.name\}/)
})
