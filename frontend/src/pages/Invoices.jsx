import React, { useState, useEffect, useMemo } from 'react'
import { getInvoices, markInvoicePaid, deleteInvoice } from '../api.js'
import PageHeader from '../components/PageHeader'
import * as htmlToImage from 'html-to-image'

function Invoices({ user }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const settings = JSON.parse(localStorage.getItem('paynote_settings') || '{}')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setError('')
      const data = await getInvoices()
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
      await markInvoicePaid(id)
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
      await deleteInvoice(id)
      setInvoices(invoices.filter(inv => inv.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete invoice')
    }
  }

  // Download only the receipt (without buttons)
  const downloadInvoiceImage = async (id) => {
    const node = document.getElementById(`receipt-${id}`)
    if (!node) {
      alert('Unable to locate the receipt.')
      return
    }
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        backgroundColor: '#ffffff',
        pixelRatio: 2
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `receipt-${id}.png`
      link.click()
    } catch (err) {
      setError('Failed to generate receipt image.')
    }
  }

  // Filtered + Search
  const filteredInvoices = useMemo(() => {
    let result = invoices

    if (filter !== 'all') {
      result = result.filter(inv => inv.status === filter)
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(inv =>
        (inv.customer && inv.customer.toLowerCase().includes(term)) ||
        (inv.item && inv.item.toLowerCase().includes(term))
      )
    }

    return result
  }, [invoices, filter, searchTerm])

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

      {/* Search + Filter */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search by customer or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 16px',
              borderRadius: 14,
              border: '1px solid #ddd',
              fontSize: 15,
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
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
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
          <p style={{ color: '#86868b', fontSize: 16 }}>
            {searchTerm ? 'No matching invoices' : 'No invoices found'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredInvoices.map(inv => (
            <div key={inv.id} style={{ maxWidth: 420, margin: '0 auto' }}>
              {/* Professional Receipt Style */}
              <div
                id={`receipt-${inv.id}`}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '28px 24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  border: '1px solid #eee',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: '#888', letterSpacing: '1px' }}>RECEIPT</div>
                  <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 700 }}>
                    {settings.businessName || 'My Business'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {settings.ownerName || ''}
                  </p>
                </div>

                {/* Date & Invoice Info */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: 13, 
                  color: '#555',
                  marginBottom: 20,
                  paddingBottom: 12,
                  borderBottom: '1px dashed #ddd'
                }}>
                  <div>
                    <strong>Date:</strong><br />
                    {inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>Status:</strong><br />
                    <span style={{
                      color: inv.status === 'paid' ? '#16a34a' : '#dc2626',
                      fontWeight: 600
                    }}>
                      {inv.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Bill To */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>BILL TO</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{inv.customer}</div>
                </div>

                {/* Item Details */}
                <div style={{
                  background: '#f9f9f9',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{inv.item}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        Qty: {inv.quantity || 1} × ₦{(inv.amount / (inv.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'right' }}>
                      ₦{inv.amount?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 18,
                  fontWeight: 700,
                  paddingTop: 12,
                  borderTop: '2px solid #111'
                }}>
                  <span>Total</span>
                  <span>₦{inv.amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons - Outside the receipt */}
              <div style={{ 
                display: 'flex', 
                gap: 10, 
                marginTop: 12, 
                justifyContent: 'center' 
              }}>
                {inv.status !== 'paid' && (
                  <button 
                    onClick={() => markAsPaid(inv.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: '#16a34a',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark as Paid
                  </button>
                )}
                <button 
                  onClick={() => downloadInvoiceImage(inv.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#007AFF',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Download Receipt
                </button>
                <button 
                  onClick={() => deleteInvoiceHandler(inv.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#ff3b30',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Invoices
