import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Brand } from './Brand'
import { images } from './data'
import { useLanguage } from './i18n'
import { getCurrentCatalystUser, isCatalystUserAuthenticated, loadCatalystAuthSdk, renderCatalystSignIn, type CatalystAuthenticatedUser } from './auth'

const AUTH_POLL_INTERVAL_MS = 2000
const LOGIN_ELEMENT_ID = 'catalyst-login-frame'

type SdkState = 'loading' | 'ready' | 'error'

export function Login({ onAuthenticated }: { onAuthenticated: (user: CatalystAuthenticatedUser) => void }) {
  const { t } = useLanguage()
  const [sdkState, setSdkState] = useState<SdkState>('loading')
  const [attempt, setAttempt] = useState(0)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setSdkState('loading')
    loadCatalystAuthSdk()
      .then(() => {
        if (cancelled) return
        renderCatalystSignIn(LOGIN_ELEMENT_ID)
        setSdkState('ready')
      })
      .catch(() => {
        if (!cancelled) setSdkState('error')
      })
    return () => { cancelled = true }
  }, [attempt])

  useEffect(() => {
    if (sdkState !== 'ready') return
    pollRef.current = window.setInterval(async () => {
      const authenticated = await isCatalystUserAuthenticated()
      if (!authenticated) return
      const user = await getCurrentCatalystUser()
      if (user) onAuthenticated(user)
    }, AUTH_POLL_INTERVAL_MS)
    return () => { if (pollRef.current) window.clearInterval(pollRef.current) }
  }, [sdkState, onAuthenticated])

  return (
    <main className="welcome-screen">
      <div className="welcome-visual" style={{ backgroundImage: `url(${images.vineyard})` }}>
        <div className="welcome-brand"><Brand light /></div>
        <div className="welcome-caption">
          <span className="eyebrow light">{t('login.kicker')}</span>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>
      </div>
      <section className="welcome-panel">
        <div id={LOGIN_ELEMENT_ID} className="login-frame">
          {sdkState === 'loading' && <p className="muted">{t('login.loadingSdk')}</p>}
          {sdkState === 'error' && (
            <div className="login-error">
              <p className="muted">{t('login.sdkError')}</p>
              <button type="button" className="secondary-button" onClick={() => setAttempt((current) => current + 1)}>
                <RefreshCw size={16} /> {t('login.retry')}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
