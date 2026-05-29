import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const data = await login(email.trim().toLowerCase(), password)
      onLogin(data.user)
      navigate('/dashboard')
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
      padding: 'clamp(12px, 4vw, 24px)',
      background: 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at bottom, rgba(124,58,237,0.16), transparent 26%), #f4f5f8'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.72)',
        borderRadius: 'clamp(20px, 4.8vw, 28px)',
        padding: 'clamp(20px, 5.6vw, 36px) clamp(16px, 4.2vw, 24px)',
        width: 'min(100%, 420px)',
        maxWidth: '92vw',
        boxShadow: '0 30px 90px rgba(15,23,42,0.18)',
        textAlign: 'center',
        border: '1px solid rgba(148,163,184,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto 24px'
        }}>
          💰
        </div>

        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--apple-text)',
          marginBottom: 8,
          letterSpacing: '-0.5px'
        }}>Welcome to Paynote</h1>

        <p style={{
          fontSize: 14,
          color: 'var(--apple-muted)',
          marginBottom: 32
        }}>Simple invoicing for your business</p>

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
              placeholder="your@email.com"
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
                e.target.style.borderColor = 'var(--apple-link)'
                e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)'
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
              placeholder="Enter your password"
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
                e.target.style.borderColor = 'var(--apple-link)'
                e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)'
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
              background: loading ? '#ccc' : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#86868b',
          fontSize: 14,
          marginTop: 24
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
