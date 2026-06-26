// frontend/src/api.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ==================== REQUEST HELPER ====================
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('paynote_token') || localStorage.getItem('admin_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  const data = await res.json()

  if (!res.ok) {
    const error = new Error(data.error || data.message || 'Request failed')
    error.status = res.status
    throw error
  }

  return data
}

// ==================== SESSION HELPERS ====================
export const persistSession = (role, data) => {
  if (role === 'admin') {
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
  } else {
    localStorage.setItem('paynote_token', data.token)
    localStorage.setItem('paynote_user', JSON.stringify(data.user))
  }
}

export const clearSession = (role = 'user') => {
  if (role === 'admin') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  } else {
    localStorage.removeItem('paynote_token')
    localStorage.removeItem('paynote_user')
  }
}

export const restoreStoredSession = (role = 'user') => {
  if (role === 'admin') {
    const token = localStorage.getItem('admin_token')
    const user = localStorage.getItem('admin_user')
    return token && user ? { token, user: JSON.parse(user) } : null
  } else {
    const token = localStorage.getItem('paynote_token')
    const user = localStorage.getItem('paynote_user')
    return token && user ? { token, user: JSON.parse(user) } : null
  }
}

// ==================== AUTH ====================
export const signup = async (email, password, name) => {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  })
}

export const login = async (email, password) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export const logout = async () => {
  return request('/auth/logout', { method: 'POST' })
}

export const verifyToken = async () => {
  return request('/auth/verify', { method: 'GET' })
}

// ==================== INVOICES ====================
export const createInvoice = async (customer, items) => {
  return request('/invoice', {
    method: 'POST',
    body: JSON.stringify({ customer, items })
  })
}

export const getInvoices = async () => {
  return request('/invoices', { method: 'GET' })
}

export const markInvoicePaid = async (id) => {
  return request('/mark-paid', {
    method: 'POST',
    body: JSON.stringify({ id })
  })
}

export const deleteInvoice = async (id) => {
  return request(`/invoice/${id}`, { method: 'DELETE' })
}

export const checkoutBilling = async () => {
  return request('/billing/checkout', { method: 'POST' })
}

// ==================== ADMIN ====================
export const adminLogin = async (email, password) => {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export const adminLogout = async () => {
  return request('/admin/logout', { method: 'POST' })
}

export const verifyAdminSession = async () => {
  return request('/admin/verify', { method: 'GET' })
}

export const getAdminStats = async () => {
  return request('/admin/stats', { method: 'GET' })
}

export const getAdminUsers = async () => {
  return request('/admin/users', { method: 'GET' })
}

export const getAdminInvoices = async () => {
  return request('/admin/invoices', { method: 'GET' })
}

export const getAdminLogs = async () => {
  return request('/admin/logs', { method: 'GET' })
}
