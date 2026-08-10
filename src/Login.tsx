import { ArrowUpRight } from 'lucide-react'
import { Brand } from './Brand'
import { images } from './data'
import { useLanguage } from './i18n'
import { redirectToHostedSignIn } from './auth'

export function Login() {
  const { t } = useLanguage()

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
        <p className="muted">{t('login.subtitle')}</p>
        <button type="button" className="primary-button full" onClick={redirectToHostedSignIn}>
          {t('login.continue')} <ArrowUpRight size={18} />
        </button>
      </section>
    </main>
  )
}
