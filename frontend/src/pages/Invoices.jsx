import React, { useState, useEffect } from 'react'
import { getInvoices, markInvoicePaid, deleteInvoice } from '../api.js'
import PageHeader from '../components/PageHeader'
import * as htmlToImage from 'html-to-image'

function Invoices({ user }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const settings = JSON.parse(localStorage.getItem('paynote_settings') || '{}')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setError('')
      const token = localStorage.getItem('paynote_token')
      if (!token) {
        setError('Authentication token not found. Please login again.')
        setLoading(false)
        return
      }
      const data = await getInvoices(token)
      setInvoices(data.reverse())
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (id) => {
    try {
      setError('')
      const token = localStorage.getItem('paynote_token')
      if (!token) {
        setError('Authentication token not found. Please login again.')
        return
      }
      const response = await markInvoicePaid(token, id)
      setInvoices(invoices.map(inv =>
        inv.id === id ? { ...inv, status: 'paid' } : inv
      ))
    } catch (err) {
      setError(err.message || 'Failed to mark as paid')
    }
  }

  const deleteInvoiceHandler = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return

    try {
      setError('')
      const token = localStorage.getItem('paynote_token')
      if (!token) {
        setError('Authentication token not found. Please login again.')
        return
      }
      await deleteInvoice(token, id)
      setInvoices(invoices.filter(inv => inv.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete invoice')
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

  const getInvoiceNode = (id) => document.getElementById(`invoice-card-image-${id}`)

  const downloadInvoiceImage = async (id) => {
    const node = getInvoiceNode(id)
    if (!node) {
      alert('Unable to locate the invoice card.')
      return
    }
    try {
      const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff', pixelRatio: 1.5 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `invoice-${id}.png`
      link.click()
    } catch (err) {
      setError('Unable to generate invoice image.')
    }
  }

  

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === filter)

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage all your invoices"
      />

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

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        background: 'white',
        padding: 6,
        borderRadius: 14,
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        width: 'fit-content'
      }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unpaid', label: 'Unpaid' },
          { key: 'paid', label: 'Paid' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: filter === tab.key ? '#1d1d1f' : 'transparent',
              color: filter === tab.key ? 'white' : '#86868b',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#86868b', textAlign: 'center', padding: 60 }}>Loading invoices...</p>
      ) : filteredInvoices.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 18,
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p style={{ color: '#86868b', fontSize: 16, fontWeight: 500 }}>
            {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredInvoices.map(inv => (
            <div
              key={inv.id}
              style={{
                borderRadius: 28,
                padding: '10px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                id={`invoice-card-image-${inv.id}`}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  margin: '0 auto',
                  background: 'white',
                  borderRadius: 28,
                  padding: '18px',
                  boxShadow: '0 14px 36px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background: '#f4f4f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    {settings.logo ? (
                      <img
                        src={settings.logo}
                        alt="Logo"
                        style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 12 }}
                      />
                    ) : (
                      '🏢'
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.24px', color: '#9b9b9f', textTransform: 'uppercase' }}>Invoice</p>
                    <h2 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, color: '#1d1d1f' }}>{settings.businessName || 'My Business'}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6e6e73' }}>{settings.ownerName || 'Business Owner'}</p>
                  </div>
                  <span style={{
                    padding: '8px 12px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 700,
                    background: inv.status === 'paid' ? '#34c75920' : '#ff3b3020',
                    color: inv.status === 'paid' ? '#34c759' : '#ff3b30'
                  }}>
                    {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div style={{ width: '100%', display: 'grid', gap: 12, justifyItems: 'center' }}>
                  <div style={{ width: '100%', display: 'grid', gap: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', letterSpacing: '0.24px', textTransform: 'uppercase' }}>From</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{settings.businessName || 'My Business'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6e6e73' }}>{settings.ownerName || 'Business Owner'}</p>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 10, color: '#ccc' }}>↓</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', letterSpacing: '0.24px', textTransform: 'uppercase' }}>Bill To</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{inv.customer}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6e6e73' }}>{inv.phone}</p>
                    </div>
                  </div>

                  <div style={{ width: '100%', padding: '14px 16px', borderRadius: 16, background: '#f8f8fa', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#9b9b9f', textTransform: 'uppercase', letterSpacing: '0.28px' }}>
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{inv.item}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>₦{inv.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ width: '100%', padding: '12px 16px', borderRadius: 16, background: '#f8f8fa', display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Invoice #</span>
                      <span>{inv.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Date</span>
                      <span>{new Date(inv.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#9b9b9f', letterSpacing: '0.26px' }}>
                      <span>Status</span>
                      <span style={{ fontWeight: 700, color: inv.status === 'paid' ? '#34c759' : '#ff3b30' }}>{inv.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 10, color: '#9b9b9f', textTransform: 'uppercase', letterSpacing: '0.28px' }}>Total</p>
                    <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#1d1d1f' }}>₦{inv.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  onClick={() => downloadInvoiceImage(inv.id)}
                  style={{
                    minWidth: 160,
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: '#f5f5f7',
                    color: '#1d1d1f',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#eeeef0'}
                  onMouseLeave={(e) => e.target.style.background = '#f5f5f7'}
                >
                  🖼 Download Image
                </button>

                {inv.status === 'unpaid' && (
                  <button
                    onClick={() => markAsPaid(inv.id)}
                    style={{
                      minWidth: 120,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: '#34c75915',
                      color: '#34c759',
                      fontSize: 13,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#34c75925'}
                    onMouseLeave={(e) => e.target.style.background = '#34c75915'}
                  >
                    ✓ Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Invoices
