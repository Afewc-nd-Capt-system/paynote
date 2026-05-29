const USER_SESSION_META = 'paynote_session_meta'
const ADMIN_SESSION_META = 'admin_session_meta'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const IDLE_TIMEOUT_MS = 30 * 60 * 1000

const getSessionMeta = (role = 'user') => {
  const key = role === 'admin' ? ADMIN_SESSION_META : USER_SESSION_META
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    localStorage.removeItem(key)
    return null
  }
}

export const persistSession = (role, user, token) => {
  const now = Date.now()
  const sessionMeta = {
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS
  }

  const metaKey = role === 'admin' ? ADMIN_SESSION_META : USER_SESSION_META
  const userKey = role === 'admin' ? 'admin_user' : 'paynote_user'
  const tokenKey = role === 'admin' ? 'admin_token' : 'paynote_token'

  localStorage.setItem(metaKey, JSON.stringify(sessionMeta))
  localStorage.setItem(userKey, JSON.stringify(user))
  localStorage.setItem(tokenKey, token)

  return sessionMeta
}

export const markSessionActive = (role = 'user') => {
  const metaKey = role === 'admin' ? ADMIN_SESSION_META : USER_SESSION_META
  const current = getSessionMeta(role)
  if (!current) return null

  const nextMeta = {
    ...current,
    lastActiveAt: Date.now()
  }

  localStorage.setItem(metaKey, JSON.stringify(nextMeta))
  return nextMeta
}

export const restoreSession = (role = 'user') => {
  const current = getSessionMeta(role)
  if (!current) return null

  const now = Date.now()
  const userKey = role === 'admin' ? 'admin_user' : 'paynote_user'
  const tokenKey = role === 'admin' ? 'admin_token' : 'paynote_token'

  const hasExpired = now >= current.expiresAt
  const idleTooLong = now - current.lastActiveAt > IDLE_TIMEOUT_MS

  if (hasExpired || idleTooLong) {
    clearSession(role)
    return null
  }

  const user = localStorage.getItem(userKey)
  const token = localStorage.getItem(tokenKey)

  if (!user || !token) {
    clearSession(role)
    return null
  }

  markSessionActive(role)

  return {
    user: JSON.parse(user),
    token,
    meta: current
  }
}

export const clearSession = (role = 'user') => {
  const metaKey = role === 'admin' ? ADMIN_SESSION_META : USER_SESSION_META
  const userKey = role === 'admin' ? 'admin_user' : 'paynote_user'
  const tokenKey = role === 'admin' ? 'admin_token' : 'paynote_token'

  localStorage.removeItem(metaKey)
  localStorage.removeItem(userKey)
  localStorage.removeItem(tokenKey)
}

export const SESSION_MAX_AGE_MS_VALUE = SESSION_MAX_AGE_MS
export const IDLE_TIMEOUT_MS_VALUE = IDLE_TIMEOUT_MS
