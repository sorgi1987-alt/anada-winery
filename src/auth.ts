import { catalystFoundation } from './catalyst'

export interface CatalystAuthenticatedUser {
  zuid: string
  userId: string
  emailId: string
  firstName: string
  lastName: string
}

interface CatalystSdk {
  auth: {
    signOut: (redirectUrl: string) => void
  }
}

declare global {
  interface Window {
    catalyst?: CatalystSdk
  }
}

const SDK_SCRIPT_ID = 'catalyst-web-sdk'
const INIT_SCRIPT_ID = 'catalyst-web-sdk-init'
// Must match the version shown in the Catalyst console's own generated embed
// snippet (Authentication > Authentication Type > Embedded > Login Form) -
// an older/mismatched version here caused the SDK's own internal script to
// throw ("Cannot set properties of null (setting 'placeholder')") instead of
// rendering the sign-in form.
const SDK_SCRIPT_SRC = 'https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js'
const INIT_SCRIPT_SRC = '/__catalyst/sdk/init.js'
const SDK_READY_TIMEOUT_MS = 15000
const SDK_POLL_INTERVAL_MS = 150

function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

let sdkReadyPromise: Promise<void> | null = null

export function loadCatalystAuthSdk(): Promise<void> {
  if (sdkReadyPromise) return sdkReadyPromise
  sdkReadyPromise = (async () => {
    await loadScript(SDK_SCRIPT_ID, SDK_SCRIPT_SRC)
    await loadScript(INIT_SCRIPT_ID, INIT_SCRIPT_SRC)
    const start = Date.now()
    while (!window.catalyst?.auth) {
      if (Date.now() - start > SDK_READY_TIMEOUT_MS) throw new Error('Catalyst SDK did not become ready in time.')
      await new Promise((resolve) => window.setTimeout(resolve, SDK_POLL_INTERVAL_MS))
    }
  })()
  return sdkReadyPromise
}

// Embedded (iframe) sign-in's OAuth handshake (/oauthorize -> .../signin-redirect)
// hangs indefinitely on this project, reproduced consistently across SDK
// versions, browsers and profiles - a platform-side issue, not something
// fixable from application code. A plain top-level redirect to Catalyst's
// hosted sign-in page, verified working end-to-end with real credentials,
// is used instead. The app itself is served from Catalyst's own Web Client
// Hosting (/app/, the platform's default post-login destination) rather
// than a separate domain, so no redirect stub is needed to bring the user
// back - see CATALYST_SCHEMA.md for why the app moved off Slate for this.
export function redirectToHostedSignIn(): void {
  window.location.href = `${catalystFoundation.projectDomain}/__catalyst/auth/login`
}

interface WhoAmIResponse {
  status: 'authenticated' | 'unauthenticated'
  user?: { user_id?: string; zuid?: string; email_id: string; first_name?: string; last_name?: string }
}

// The Web SDK's own isUserAuthenticated()/getCurrentProjectUser() are known
// unreliable on this Zoho org - documented in a sibling project's live Zoho
// support case, they can report a session as invalid even when it is fully
// valid. The backend is the authority instead: it resolves identity with a
// cookie-forwarding fallback (see backend/anada_data_api/identity.js) that is
// proven to work where the SDK's own credential resolution does not.
export async function fetchAuthenticatedUser(): Promise<CatalystAuthenticatedUser | null> {
  try {
    const response = await fetch(`${catalystFoundation.readApiUrl}/whoami`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const payload = await response.json() as WhoAmIResponse
    if (payload.status !== 'authenticated' || !payload.user?.email_id) return null
    return {
      zuid: payload.user.zuid ?? '',
      userId: payload.user.user_id ?? '',
      emailId: payload.user.email_id,
      firstName: payload.user.first_name ?? '',
      lastName: payload.user.last_name ?? '',
    }
  } catch {
    return null
  }
}

export function signOutCatalystUser(redirectUrl: string): void {
  if (!window.catalyst?.auth) {
    window.location.href = redirectUrl
    return
  }
  window.catalyst.auth.signOut(redirectUrl)
}

export function catalystUserDisplayName(user: CatalystAuthenticatedUser): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  return fullName || user.emailId
}
