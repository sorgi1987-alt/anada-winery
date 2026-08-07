import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createServiceWorker } from './pwa/service-worker.ts'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

const pwaPrecache = (): Plugin => ({
  name: 'anada-pwa-precache',
  apply: 'build',
  generateBundle(_options, bundle) {
    const bundledFiles = Object.keys(bundle).filter((file) => file !== 'sw.js' && !file.endsWith('.map')).map((file) => `./${file}`)
    const publicFiles = ['./', './index.html', './manifest.webmanifest', './anada-mark.svg', './anada-192.png', './anada-512.png', './anada-apple-touch.png', './offline.html']
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: createServiceWorker([...publicFiles, ...bundledFiles], packageJson.version) })
  },
})

export default defineConfig({
  plugins: [react(), pwaPrecache()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
