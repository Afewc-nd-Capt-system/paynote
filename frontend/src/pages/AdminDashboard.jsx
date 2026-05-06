import React, { useState, useEffect } from 'react'
import { getAdminStats, getAdminUsers, getAdminInvoices, getAdminLogs } from '../api'
import PageHeader from '../components/PageHeader'

function AdminDashboard({ adminToken, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'stats') {
        const data = await getAdminStats(adminToken)
        setStats(data)
      } else if (activeTab === 'users') {
        const data = await getAdminUsers(adminToken)
        setUsers(data)
      } else if (activeTab === 'invoices') {
        const data = await getAdminInvoices(adminToken)
        setInvoices(data)
      } else if (activeTab === 'logs') {
        const data = await getAdminLogs(adminToken)
        setLogs(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ label, value, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '24px 20px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 12, color: '#86868b', fontWeight: 500, marginBottom: 8 }}>
        {label.toUpperCase()}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f' }}>
        {value}
      </p>
    </div>
  )

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    borderRadius: 10,
    background: activeTab === tab ? '#1d1d1f' : 'transparent',
    color: activeTab === tab ? 'white' : '#86868b',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      padding: '24px'
    }}>
      <PageHeader
        title="Admin Panel"
        subtitle="Monitor your application"
        actionText="Logout"
        onAction={onLogout}
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

      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 24,
        background: 'white',
        padding: 6,
        borderRadius: 14,
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
      }}>
        {['stats', 'users', 'invoices', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={tabStyle(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#86868b', textAlign: 'center', padding: 60 }}>Loading...</p>
      ) : activeTab === 'stats' && stats ? (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            <StatCard label="Total Users" value={stats.stats.totalUsers} icon="👥" color="#007AFF" />
            <StatCard label="Total Invoices" value={stats.stats.totalInvoices} icon="📄" color="#34C759" />
            <StatCard label="Total Revenue" value={`₦${stats.stats.totalRevenue}`} icon="💰" color="#FF9500" />
            <StatCard label="Unpaid Revenue" value={`₦${stats.stats.unpaidRevenue}`} icon="⏳" color="#FF3B30" />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1d1d1f' }}>
                Invoices by Status
              </h3>
              <p style={{ fontSize: 14, color: '#86868b', marginBottom: 6 }}>
                ✓ Paid: <strong>{stats.stats.invoicesByStatus.paid}</strong>
              </p>
              <p style={{ fontSize: 14, color: '#86868b' }}>
                ⏳ Unpaid: <strong>{stats.stats.invoicesByStatus.unpaid}</strong>
              </p>
            </div>

            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1d1d1f' }}>
                Recent Activity
              </h3>
              <p style={{ fontSize: 14, color: '#86868b', marginBottom: 6 }}>
                📝 Recent Invoices: <strong>{stats.recentInvoices.length}</strong>
              </p>
              <p style={{ fontSize: 14, color: '#86868b' }}>
                👤 Recent Users: <strong>{stats.recentUsers.length}</strong>
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1d1d1f' }}>
              Recent Logs
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5ea' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '10px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '10px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.slice(0, 20).map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 0', fontSize: 12, color: '#1d1d1f' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: 12, color: '#1d1d1f', fontWeight: 500 }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: 12, color: '#86868b' }}>
                        {JSON.stringify(log.details).substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1d1d1f' }}>
            All Users ({users.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5ea' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>{user.name}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>{user.email}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#86868b' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'invoices' ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1d1d1f' }}>
            All Invoices ({invoices.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5ea' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice().reverse().slice(0, 50).map((inv, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#1d1d1f', fontFamily: 'monospace' }}>
                    {inv.id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>{inv.customer}</td>
                  <td style={{ padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>₦{inv.amount.toFixed(2)}</td>
                  <td style={{
                    padding: '12px 0',
                    fontSize: 13,
                    fontWeight: 600,
                    color: inv.status === 'paid' ? '#34C759' : '#FF3B30'
                  }}>
                    {inv.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'logs' ? (
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1d1d1f' }}>
            Activity Logs ({logs.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5ea' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Time</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Action</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#86868b', fontWeight: 600, fontSize: 12 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 100).map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 0', fontSize: 12, color: '#1d1d1f' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 0', fontSize: 12, color: '#1d1d1f', fontWeight: 500 }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '12px 0', fontSize: 12, color: '#86868b' }}>
                    {JSON.stringify(log.details).substring(0, 60)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export default AdminDashboard
