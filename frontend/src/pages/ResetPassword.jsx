import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setMessage('Password reset successful! You can now login with your new password.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <h2>Invalid Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password">Request a new reset link</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px' }}>
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>

      {message && <p style={{ color: 'green', marginBottom: '15px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  )
}

export default ResetPassword
