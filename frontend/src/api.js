// Replace with your local IP address
// Example: const API = "http://192.168.1.100:5000"
const API = "http://10.162.26.235:5000"

// ============ Auth Functions ============

export const signup = async (email, password, name) => {
  try {
    const response = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Signup failed')
    return data
  } catch (error) {
    throw error
  }
}

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Login failed')
    return data
  } catch (error) {
    throw error
  }
}

export const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API}/auth/verify`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Token verification failed')
    return data
  } catch (error) {
    throw error
  }
}

// ============ Invoice Functions ============

export const createInvoice = async (token, customer, phone, item, amount) => {
  try {
    const response = await fetch(`${API}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customer, phone, item, amount })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create invoice')
    return data
  } catch (error) {
    throw error
  }
}

export const getInvoices = async (token) => {
  try {
    const response = await fetch(`${API}/invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to fetch invoices')
    return data
  } catch (error) {
    throw error
  }
}

export const markInvoicePaid = async (token, id) => {
  try {
    const response = await fetch(`${API}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to mark invoice as paid')
    return data
  } catch (error) {
    throw error
  }
}

export const deleteInvoice = async (token, id) => {
  try {
    const response = await fetch(`${API}/invoice/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to delete invoice')
    return data
  } catch (error) {
    throw error
  }
}

// ============ Admin Functions ============

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Admin login failed')
    return data
  } catch (error) {
    throw error
  }
}

export const getAdminStats = async (token) => {
  try {
    const response = await fetch(`${API}/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to fetch stats')
    return data
  } catch (error) {
    throw error
  }
}

export const getAdminUsers = async (token) => {
  try {
    const response = await fetch(`${API}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to fetch users')
    return data
  } catch (error) {
    throw error
  }
}

export const getAdminInvoices = async (token) => {
  try {
    const response = await fetch(`${API}/admin/invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to fetch invoices')
    return data
  } catch (error) {
    throw error
  }
}

export const getAdminLogs = async (token) => {
  try {
    const response = await fetch(`${API}/admin/logs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error('Failed to fetch logs')
    return data
  } catch (error) {
    throw error
  }
}

export default API
