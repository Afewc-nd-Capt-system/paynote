import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api'

function Signup({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()

  const checkPasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[!@#$%^&*]/.test(pwd)) strength++
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setPassword(pwd)
    checkPasswordStrength(pwd)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.trim() || !password.trim() || !name.trim()) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (passwordStrength < 5) {
      setError('Password must contain: 8+ chars, uppercase, lowercase, number, and special character (!@#$%^&*)')
      setLoading(false)
      return
    }

    try {
      const data = await signup(email.trim().toLowerCase(), password, name.trim())
      onLogin(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 2) return '#FF3B30'
    if (passwordStrength < 4) return '#FF9500'
    return '#34C759'
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
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>Create Account</h1>

        <p style={{
          fontSize: 14,
          color: 'var(--apple-muted)',
          marginBottom: 32,
          textAlign: 'center'
        }}>Join Paynote to start invoicing</p>

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
              marginBottom: 8
            }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
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
              marginBottom: 8
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

          <div style={{ marginBottom: 8 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1d1d1f',
              marginBottom: 8
            }}>Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={handlePasswordChange}
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

          {password && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 8
              }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: i < passwordStrength ? getPasswordStrengthColor() : '#e5e5ea'
                    }}
                  />
                ))}
              </div>
              <p style={{
                fontSize: 12,
                color: '#86868b',
                margin: 0
              }}>
                Password strength: {passwordStrength === 0 ? 'Very Weak' : passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : passwordStrength === 3 ? 'Good' : passwordStrength === 4 ? 'Strong' : 'Very Strong'}
              </p>
              <ul style={{
                fontSize: 12,
                color: '#86868b',
                marginTop: 8,
                paddingLeft: 20,
                margin: '8px 0 0 0'
              }}>
                <li>✓ 8+ characters</li>
                <li>✓ Uppercase letter</li>
                <li>✓ Lowercase letter</li>
                <li>✓ Number</li>
                <li>✓ Special character (!@#$%^&*)</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || passwordStrength < 5}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 14,
              background: loading || passwordStrength < 5 ? '#ccc' : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              cursor: loading || passwordStrength < 5 ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              opacity: loading || passwordStrength < 5 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && passwordStrength === 5) {
                e.target.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#86868b',
          fontSize: 14,
          marginTop: 24
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
