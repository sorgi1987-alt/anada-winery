'use strict'
/**
 * Catalyst identity resolution.
 *
 * On this Zoho org, `zcatalyst-sdk-node`'s `userManagement().getCurrentUser()`
 * has been observed (in a sibling project, Zylker-Academy, org 20117369913,
 * documented in a live Zoho support case) to resolve `null` for a session the
 * Web SDK itself reports as fully authenticated - the gateway sometimes hands
 * the SDK a credential type that `/project-user/current` will not resolve,
 * even though the same session's cookies resolve it correctly. Because of
 * that, resolution is an ordered list of strategies rather than a single
 * call: the documented SDK call is tried first, and a direct cookie-forwarded
 * call to Catalyst's own endpoint is the fallback that is known to work.
 *
 * DESIGN RULE: identity is only ever taken from a credential Catalyst itself
 * validated. The platform's `x-zc-user-id` / `x-zc-user-type` request headers
 * are never read as identity - Catalyst's gateway does not strip
 * client-supplied copies of them, so trusting them would be forgeable.
 */
const catalyst = require('zcatalyst-sdk-node')

const CATALYST_PROJECT_ID = '11922000000094785'

const CATALYST_HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.catalystserverless\.(eu|com|in|com\.au|jp|ca|sa)$/i

function platformBaseUrlFrom(request) {
  const headers = (request && request.headers) || {}
  const candidates = [headers['x-zc-project-domain'], headers['x-forwarded-host'], headers.host]
  for (const raw of candidates) {
    if (!raw) continue
    const host = String(raw).split(',')[0].trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    if (host && CATALYST_HOST_RE.test(host)) return `https://${host}`
  }
  return null
}

const str = (v) => (v === null || v === undefined || v === '' ? null : String(v))

function normalizeUser(raw) {
  if (!raw) return null
  const userId = str(raw.user_id || raw.userId || raw.zuid)
  if (!userId) return null
  const emailId = str(raw.email_id || raw.emailId || raw.email)
  const firstName = str(raw.first_name || raw.firstName)
  const lastName = str(raw.last_name || raw.lastName)
  return { userId, zuid: str(raw.zuid), emailId, firstName, lastName }
}

const STRATEGIES = [
  {
    name: 'sdk_user_scope',
    async run(request) {
      const app = catalyst.initialize(request, { scope: 'user' })
      return await app.userManagement().getCurrentUser()
    },
  },
  {
    // Forwards the caller's session cookie, unread, to Catalyst's own
    // project-user endpoint and takes the identity from Catalyst's reply.
    // This is credential forwarding, not a header identity claim: a caller
    // cannot forge IAM session cookies, and the endpoint answers 401 with
    // none presented (verified against the live Zylker-Academy deployment).
    name: 'catalyst_session_forwarded',
    async run(request) {
      const cookie = request.headers && request.headers.cookie
      if (!cookie) throw new Error('no cookie header on the request')
      const base = platformBaseUrlFrom(request)
      if (!base) throw new Error('could not derive a Catalyst base URL from the request host')
      const response = await fetch(`${base}/baas/v1/project/${CATALYST_PROJECT_ID}/project-user/current`, {
        headers: {
          Accept: 'application/json',
          Cookie: cookie,
          ...(request.headers['x-zcsrf-token'] ? { 'X-ZCSRF-TOKEN': request.headers['x-zcsrf-token'] } : {}),
        },
      })
      if (response.status !== 200) throw new Error(`project-user/current answered HTTP ${response.status}`)
      const body = await response.json()
      const data = body && body.data
      if (!data || !data.user_id) throw new Error('project-user/current answered with no user record')
      return data
    },
  },
]

async function resolveUser(request) {
  for (const strategy of STRATEGIES) {
    try {
      const raw = await strategy.run(request)
      const user = normalizeUser(raw)
      if (user) return user
    } catch {
      // Try the next strategy; the caller only cares whether one succeeded.
    }
  }
  return null
}

module.exports = { resolveUser }
