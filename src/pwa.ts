import { useCallback, useEffect, useRef, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface PwaStatus {
  online: boolean
  installed: boolean
  installAvailable: boolean
  serviceWorkerReady: boolean
  updateAvailable: boolean
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  activateUpdate: () => void
}

const runningStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

export const usePwaStatus = (): PwaStatus => {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [installed, setInstalled] = useState(runningStandalone)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const updateRequested = useRef(false)

  useEffect(() => {
    const connected = () => setOnline(true)
    const disconnected = () => setOnline(false)
    const captureInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const markInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    window.addEventListener('beforeinstallprompt', captureInstall)
    window.addEventListener('appinstalled', markInstalled)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
      window.removeEventListener('beforeinstallprompt', captureInstall)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let active = true
    const register = async () => {
      try {
        const current = await navigator.serviceWorker.register('./sw.js', { scope: './' })
        if (!active) return
        setRegistration(current)
        setServiceWorkerReady(true)
        if (current.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true)
        current.addEventListener('updatefound', () => {
          const worker = current.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateAvailable(true)
          })
        })
        void current.update()
      } catch {
        if (active) setServiceWorkerReady(false)
      }
    }
    if (document.readyState === 'complete') void register()
    else window.addEventListener('load', register, { once: true })
    return () => {
      active = false
      window.removeEventListener('load', register)
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const refresh = () => {
      if (!updateRequested.current) return
      updateRequested.current = false
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', refresh)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', refresh)
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return 'unavailable' as const
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
    return choice.outcome
  }, [installPrompt])

  const activateUpdate = useCallback(() => {
    if (!registration?.waiting) return
    updateRequested.current = true
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }, [registration])

  return {
    online,
    installed,
    installAvailable: Boolean(installPrompt) && !installed,
    serviceWorkerReady,
    updateAvailable,
    install,
    activateUpdate,
  }
}
