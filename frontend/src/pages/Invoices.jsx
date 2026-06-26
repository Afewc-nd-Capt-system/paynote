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

  // ========================
  // IMPROVED FILTERING + SEARCH
  // ========================
  const filteredInvoices = useMemo(() => {
    let result = invoices

    // Status filter
    if (filter !== 'all') {
      result = result.filter(inv => inv.status === filter)
    }

    // Search filter
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

      {/* Search + Filter Section */}
      <div style={{ marginBottom: 24 }}>
        {/* Search Bar */}
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

        {/* Filter Tabs */}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
          <p style={{ color: '#86868b', fontSize: 16, fontWeight: 500 }}>
            {searchTerm 
              ? 'No invoices match your search' 
              : filter === 'all' 
                ? 'No invoices yet' 
                : `No ${filter} invoices`}
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
                {/* Invoice Card Content (kept from original) */}
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
                  </div>
                </div>

                {/* Invoice Details */}
                <div style={{ textAlign: 'left', padding: '0 8px' }}>
                  <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Bill To:</strong> {inv.customer}</p>
                  <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Phone:</strong> {inv.phone || 'N/A'}</p>
                  <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Item:</strong> {inv.item}</p>
                  <p style={{ margin: '8px 0', fontSize: 20, fontWeight: 700 }}>₦{inv.amount?.toFixed(2)}</p>
                </div>

                {/* Status + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    background: inv.status === 'paid' ? '#34c75920' : '#ff3b3020',
                    color: inv.status === 'paid' ? '#34c759' : '#ff3b30'
                  }}>
                    {inv.status}
                  </span>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {inv.status !== 'paid' && (
                      <button onClick={() => markAsPaid(inv.id)} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#34c759', color: 'white', cursor: 'pointer' }}>
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => downloadInvoiceImage(inv.id)} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#007AFF', color: 'white', cursor: 'pointer' }}>
                      Download
                    </button>
                    <button onClick={() => deleteInvoiceHandler(inv.id)} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ff3b30', color: 'white', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Invoices
