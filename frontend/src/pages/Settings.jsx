import React, { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'

function Settings() {
  const [settings, setSettings] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    logo: ''
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('paynote_settings')
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }, [])

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSettings({ ...settings, logo: reader.result })
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setSettings({ ...settings, logo: '' })
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('paynote_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 14,
    border: '1.5px solid #e5e5ea',
    fontSize: 16,
    outline: 'none',
    background: '#fafafa',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your business details"
      />

      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '32px 28px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        maxWidth: 600
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          marginBottom: 24,
          padding: '18px 16px',
          borderRadius: 18,
          background: '#f5f5f7'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
          }}>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Business Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 18 }}
              />
            ) : (
              <span style={{ fontSize: 28 }}>🏢</span>
            )}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1d1d1f' }}>Upload your logo</p>
            <p style={{ fontSize: 13, color: '#86868b', margin: '6px 0 0' }}>This logo will appear on all invoices.</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 8
          }}>Business Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ width: '100%', fontSize: 14 }}
          />
          {settings.logo && (
            <div style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 16,
              background: '#f5f5f7'
            }}>
              <img
                src={settings.logo}
                alt="Logo preview"
                style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 16, background: 'white', padding: 8 }}
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Remove logo
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 8
          }}>Business Name</label>
          <input
            type="text"
            name="businessName"
            placeholder="e.g. Smith Consulting"
            value={settings.businessName}
            onChange={handleChange}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#007AFF'
              e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e5ea'
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
          }}>Owner Name</label>
          <input
            type="text"
            name="ownerName"
            placeholder="e.g. John Smith"
            value={settings.ownerName}
            onChange={handleChange}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#007AFF'
              e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e5ea'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#1d1d1f',
            marginBottom: 8
          }}>Business Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="e.g. +1234567890"
            value={settings.phone}
            onChange={handleChange}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#007AFF'
              e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e5ea'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 14,
            background: saved ? '#34c759' : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: saved ? '0 4px 16px rgba(52,199,89,0.3)' : '0 4px 16px rgba(0,122,255,0.3)'
          }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default Settings
