import React, { useState } from 'react'
import { adminLogin } from '../api'

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await adminLogin(email.trim().toLowerCase(), password)
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#f5f5f7'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '36px 24px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto 24px'
        }}>
          🔐
        </div>

        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--apple-text)',
          marginBottom: 8,
          letterSpacing: '-0.5px'
        }}>Admin Panel</h1>

        <p style={{
          fontSize: 14,
          color: 'var(--apple-muted)',
          marginBottom: 32
        }}>Monitor your business</p>

        {error && (
          <div style={{
            background: '#FFE5E5',
            color: '#C41E3A',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            marginBottom: 20,
            border: '1px solid #FFB3B3'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: 8,
              textAlign: 'left'
            }}>Email</label>
            <input
              type="email"
              placeholder="admin@paynote.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 14,
                border: '1.5px solid var(--apple-border)',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                background: '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--apple-danger)'
                e.target.style.boxShadow = '0 0 0 4px rgba(255,59,48,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--apple-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: 8,
              textAlign: 'left'
            }}>Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 14,
                border: '1.5px solid var(--apple-border)',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                background: '#fafafa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--apple-danger)'
                e.target.style.boxShadow = '0 0 0 4px rgba(255,59,48,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--apple-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 14,
              background: loading ? '#ccc' : 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {loading ? 'Logging in...' : 'Access Admin Panel'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: '#F0F0F7',
          borderRadius: 12,
          fontSize: 12,
          color: '#86868b'
        }}>
          Demo Credentials:<br/>
          Email: admin@paynote.com<br/>
          Password: Admin@2024!
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
