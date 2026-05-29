const API = import.meta.env.VITE_API_URL
let csrfToken = null

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken

  const response = await fetch(`${API}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Failed to initialize security token')
  }

  csrfToken = data?.csrfToken || null
  if (!csrfToken) {
    throw new Error('Security token missing')
  }

  return csrfToken
}

const request = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase()

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCsrfToken()
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token
    }
  }

  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Request failed')
  }

  return data
}

// ============ Auth Functions ============

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
  return request('/auth/logout', {
    method: 'POST'
  })
}

export const verifyToken = async () => {
  return request('/auth/verify', {
    method: 'GET'
  })
}

// ============ Invoice Functions ============

export const createInvoice = async (customer, phone, item, amount) => {
  return request('/invoice', {
    method: 'POST',
    body: JSON.stringify({ customer, phone, item, amount })
  })
}

export const getInvoices = async () => {
  return request('/invoices', {
    method: 'GET'
  })
}

export const markInvoicePaid = async (id) => {
  return request('/mark-paid', {
    method: 'POST',
    body: JSON.stringify({ id })
  })
}

export const deleteInvoice = async (id) => {
  return request(`/invoice/${id}`, {
    method: 'DELETE'
  })
}

// ============ Admin Functions ============

export const adminLogin = async (email, password) => {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export const adminLogout = async () => {
  return request('/admin/logout', {
    method: 'POST'
  })
}

export const verifyAdminSession = async () => {
  return request('/admin/verify', {
    method: 'GET'
  })
}

export const getAdminStats = async () => {
  return request('/admin/stats', {
    method: 'GET'
  })
}

export const getAdminUsers = async () => {
  return request('/admin/users', {
    method: 'GET'
  })
}

export const getAdminInvoices = async () => {
  return request('/admin/invoices', {
    method: 'GET'
  })
}

export const getAdminLogs = async () => {
  return request('/admin/logs', {
    method: 'GET'
  })
}

export default API
