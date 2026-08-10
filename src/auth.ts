export interface CatalystAuthenticatedUser {
  zuid: string
  userId: string
  emailId: string
  firstName: string
  lastName: string
  roleName?: string
}

interface CatalystUserContent {
  zuid?: string
  user_id?: string
  email_id?: string
  first_name?: string
  last_name?: string
  role_details?: { role_name?: string }
}

interface CatalystSdk {
  auth: {
    signIn: (elementId: string) => void
    isUserAuthenticated: () => Promise<{ content: unknown }>
    signOut: (redirectUrl: string) => void
  }
  userManagement: {
    getCurrentProjectUser: () => Promise<{ content: CatalystUserContent }>
  }
}

declare global {
  interface Window {
    catalyst?: CatalystSdk
  }
}

const SDK_SCRIPT_ID = 'catalyst-web-sdk'
const INIT_SCRIPT_ID = 'catalyst-web-sdk-init'
const SDK_SCRIPT_SRC = 'https://static.zohocdn.com/catalyst/sdk/js/4.0.0/catalystWebSDK.js'
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

export function renderCatalystSignIn(elementId: string): void {
  if (!window.catalyst?.auth) throw new Error('Catalyst SDK is not loaded.')
  window.catalyst.auth.signIn(elementId)
}

export async function isCatalystUserAuthenticated(): Promise<boolean> {
  if (!window.catalyst?.auth) return false
  try {
    const response = await window.catalyst.auth.isUserAuthenticated()
    return Boolean(response?.content)
  } catch {
    return false
  }
}

function toAuthenticatedUser(content: CatalystUserContent): CatalystAuthenticatedUser | null {
  if (!content?.email_id) return null
  return {
    zuid: content.zuid ?? '',
    userId: content.user_id ?? '',
    emailId: content.email_id,
    firstName: content.first_name ?? '',
    lastName: content.last_name ?? '',
    roleName: content.role_details?.role_name,
  }
}

export async function getCurrentCatalystUser(): Promise<CatalystAuthenticatedUser | null> {
  if (!window.catalyst?.userManagement) return null
  try {
    const response = await window.catalyst.userManagement.getCurrentProjectUser()
    return toAuthenticatedUser(response?.content)
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
