import React, { useState } from 'react'
import { createInvoice } from '../api'
import PageHeader from '../components/PageHeader'
import * as htmlToImage from 'html-to-image'

function CreateInvoice({ user }) {
  const [form, setForm] = useState({
    customer: '',
    phone: '',
    item: '',
    amount: ''
  })
  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const settings = JSON.parse(localStorage.getItem('paynote_settings') || '{}')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.customer || !form.phone || !form.item || !form.amount) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    try {
      const data = await createInvoice(form.customer, form.phone, form.item, form.amount)
      setCreatedInvoice(data)
      setForm({ customer: '', phone: '', item: '', amount: '' })
    } catch (err) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const dataURLToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)[1]
    const binary = atob(base64)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
  }

  const downloadCreatedInvoiceImage = async () => {
    const node = document.getElementById('created-invoice-preview')
    if (!node) {
      alert('Unable to locate the invoice preview.')
      return
    }
    try {
      const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff', pixelRatio: 1.5 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `invoice-${createdInvoice.id}.png`
      link.click()
    } catch (err) {
      setError('Unable to generate invoice image.')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '16px 18px',
    borderRadius: 14,
    border: '1.5px solid #e5e5ea',
    fontSize: 15,
    outline: 'none',
    background: '#fafafa',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  }

  const userName = typeof user === 'string' ? user : user?.name || user?.email || 'Business Owner'

  return (
    <div style={{ padding: '24px', maxWidth: 940, margin: '0 auto' }}>
      <PageHeader
        title="Create Invoice"
        subtitle="Generate a polished invoice image for your customer"
      />

      <div style={{
        display: 'grid',
        gap: 28,
        marginTop: 16
      }}>
        <section style={{
          background: 'white',
          borderRadius: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.08)',
          padding: 28
        }}>
          {error && (
            <div style={{
              background: '#FFEDEB',
              color: '#C41E3A',
              padding: '14px 18px',
              borderRadius: 14,
              fontSize: 14,
              marginBottom: 20,
              border: '1px solid #FFB3B3'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 18 }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Customer Name</span>
                <input
                  type="text"
                  name="customer"
                  placeholder="e.g. John Smith"
                  value={form.customer}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Customer Phone</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +2348012345678"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Item / Service</span>
                <input
                  type="text"
                  name="item"
                  placeholder="e.g. Design & Development"
                  value={form.item}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Amount (₦)</span>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 22px',
                  borderRadius: 16,
                  background: loading ? '#c7c7cc' : 'linear-gradient(135deg, #007AFF 0%, #5C5CFF 100%)',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 18px 40px rgba(0,122,255,0.22)'
                }}
              >
                {loading ? 'Creating...' : 'Generate Clean Invoice'}
              </button>
            </div>
          </form>
        </section>

        {createdInvoice && (
          <section style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18
          }}>
            <div style={{
              width: '100%',
              maxWidth: 340,
              padding: 0,
              borderRadius: 20,
              background: '#fff',
              boxShadow: 'none'
            }}>
              <div id="created-invoice-preview" style={{
                background: 'white',
                borderRadius: 20,
                padding: '20px 18px',
                width: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: '#f4f4f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 12 }} />
                    ) : '🏢'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.24px', color: '#9b9b9f', textTransform: 'uppercase' }}>Invoice</p>
                    <h1 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#1d1d1f' }}>Paynote</h1>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'grid', gap: 14 }}>
                  <div style={{ width: '100%', display: 'grid', gap: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', letterSpacing: '0.24px', textTransform: 'uppercase' }}>From</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{settings.businessName || 'My Business'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6e6e73' }}>{settings.ownerName || userName}</p>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 10, color: '#ccc' }}>↓</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', letterSpacing: '0.24px', textTransform: 'uppercase' }}>Bill To</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{createdInvoice.customer}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6e6e73' }}>{createdInvoice.phone}</p>
                    </div>
                  </div>

                  <div style={{ width: '100%', padding: '14px 16px', borderRadius: 16, background: '#f8f8fa', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#9b9b9f', textTransform: 'uppercase', letterSpacing: '0.28px' }}>
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{createdInvoice.item}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>₦{Number(createdInvoice.amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ width: '100%', padding: '12px 16px', borderRadius: 16, background: '#f8f8fa', display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Invoice #</span>
                      <span>{createdInvoice.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Date</span>
                      <span>{new Date(createdInvoice.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Status</span>
                      <span style={{ fontWeight: 700, color: createdInvoice.status === 'paid' ? '#34c759' : '#ff3b30' }}>{createdInvoice.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', textTransform: 'uppercase', letterSpacing: '0.28px' }}>Total</p>
                    <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#1d1d1f' }}>₦{Number(createdInvoice.amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={downloadCreatedInvoiceImage}
                style={{
                  minWidth: 160,
                  padding: '12px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'white',
                  color: '#1d1d1f',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                📥 Download PNG
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default CreateInvoice
