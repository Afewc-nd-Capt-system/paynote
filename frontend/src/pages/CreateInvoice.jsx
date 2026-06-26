import React, { useState } from 'react'
import { createInvoice } from '../api'
import PageHeader from '../components/PageHeader'
import * as htmlToImage from 'html-to-image'

function CreateInvoice({ user }) {
  const [customer, setCustomer] = useState('')
  const [items, setItems] = useState([
    { id: Date.now(), name: '', quantity: 1, unitPrice: '' }
  ])
  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const settings = JSON.parse(localStorage.getItem('paynote_settings') || '{}')

  // Add new item row
  const addItem = () => {
    setItems([...items, { 
      id: Date.now(), 
      name: '', 
      quantity: 1, 
      unitPrice: '' 
    }])
  }

  // Remove item row
  const removeItem = (id) => {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }

  // Update item field
  const updateItem = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Calculate line totals + grand total
  const lineItems = items.map(item => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return { ...item, total: qty * price }
  })

  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!customer.trim()) {
      setError('Customer name is required')
      return
    }

    const hasEmptyItem = items.some(item => !item.name.trim() || !item.unitPrice)
    if (hasEmptyItem) {
      setError('Please fill all item details')
      return
    }

    setLoading(true)
    try {
      // This will work after we update api.js
      const data = await createInvoice(customer, lineItems)
      setCreatedInvoice({ ...data, items: lineItems, grandTotal })
    } catch (err) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async () => {
    const node = document.getElementById('created-invoice-preview')
    if (!node) return

    try {
      const dataUrl = await htmlToImage.toPng(node, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2 
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `invoice-${createdInvoice.id || Date.now()}.png`
      link.click()
    } catch {
      setError('Failed to download invoice')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      <PageHeader
        title="Create Invoice"
        subtitle="Create professional invoices with multiple items"
      />

      <div style={{ display: 'grid', gap: 32, marginTop: 16 }}>
        {/* Form Section */}
        <section style={{
          background: 'white',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)'
        }}>
          {error && (
            <div style={{
              background: '#FFE5E5',
              color: '#C41E3A',
              padding: '12px 16px',
              borderRadius: 12,
              marginBottom: 20
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Customer Name */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Customer Name
              </label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Enter customer name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1.5px solid #e5e5ea',
                  fontSize: 15
                }}
                required
              />
            </div>

            {/* Items Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 12 
              }}>
                <label style={{ fontWeight: 600 }}>Items</label>
                <button 
                  type="button" 
                  onClick={addItem}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: '#007AFF',
                    color: 'white',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Item
                </button>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.2fr 1fr auto',
                  gap: 12,
                  marginBottom: 12,
                  alignItems: 'end'
                }}>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5ea' }}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5ea' }}
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5ea' }}
                  />
                  <div style={{ fontWeight: 600, paddingBottom: '12px' }}>
                    ₦{item.total?.toFixed(2) || '0.00'}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)}
                    style={{ color: '#ff3b30', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 24,
              paddingTop: 16,
              borderTop: '2px solid #eee'
            }}>
              <span>Grand Total</span>
              <span>₦{grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: loading ? '#ccc' : 'linear-gradient(135deg, #007AFF, #5856D6)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Invoice...' : 'Create Invoice'}
            </button>
          </form>
        </section>

        {/* Invoice Preview */}
        {createdInvoice && (
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div id="created-invoice-preview" style={{
              width: '100%',
              maxWidth: 380,
              background: 'white',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              marginBottom: 20
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#888' }}>INVOICE</div>
                <h2 style={{ margin: '8px 0' }}>{settings.businessName || 'My Business'}</h2>
              </div>

              <div style={{ marginBottom: 20 }}>
                <strong>Bill To:</strong> {createdInvoice.customer || customer}
              </div>

              <div style={{ marginBottom: 20 }}>
                {createdInvoice.items?.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 8,
                    fontSize: 14 
                  }}>
                    <div>{item.quantity} × {item.name}</div>
                    <div>₦{item.total?.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 700,
                borderTop: '2px solid #111',
                paddingTop: 12
              }}>
                <span>Total</span>
                <span>₦{createdInvoice.grandTotal?.toFixed(2) || grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={downloadInvoice}
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                background: '#007AFF',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              Download Invoice
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

export default CreateInvoice
