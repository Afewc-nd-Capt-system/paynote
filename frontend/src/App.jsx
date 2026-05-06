import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { verifyToken } from './api'

function App() {
  const [user, setUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const stored = localStorage.getItem('paynote_user')
    const token = localStorage.getItem('paynote_token')
    const adminStored = localStorage.getItem('admin_user')
    const adminTok = localStorage.getItem('admin_token')
    
    if (adminStored && adminTok) {
      try {
        const adminData = JSON.parse(adminStored)
        setAdminUser(adminData)
        setAdminToken(adminTok)
      } catch (e) {
        localStorage.removeItem('admin_user')
        localStorage.removeItem('admin_token')
      }
    }
    
    if (stored && token) {
      try {
        const userData = JSON.parse(stored)
        // Verify token is valid
        verifyToken(token)
          .then(() => {
            setUser(userData)
          })
          .catch(() => {
            // Token is invalid, clear storage
            localStorage.removeItem('paynote_user')
            localStorage.removeItem('paynote_token')
            setUser(null)
          })
          .finally(() => setLoading(false))
      } catch (e) {
        localStorage.removeItem('paynote_user')
        localStorage.removeItem('paynote_token')
        setUser(null)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData.user)
    setAdminToken(adminData.token)
  }

  const handleLogout = () => {
    localStorage.removeItem('paynote_user')
    localStorage.removeItem('paynote_token')
    setUser(null)
    setSidebarOpen(false)
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_token')
    setAdminUser(null)
    setAdminToken(null)
  }

  const isAuthPage = ['/login', '/signup', '/admin-login'].includes(location.pathname)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7'
      }}>
        <div style={{
          fontSize: 18,
          color: '#86868b'
        }}>Loading...</div>
      </div>
    )
  }

  if (!user && !adminUser && !isAuthPage) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {user && (
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {user && (
        <div
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 100,
            background: 'white',
            borderRadius: 12,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
      )}

      <main style={{
        flex: 1,
        marginLeft: user ? 260 : 0,
        padding: '24px',
        paddingBottom: 24,
        maxWidth: user ? 'calc(100% - 260px)' : '100%',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <Routes>
          <Route path="/admin-login" element={
            adminUser ? <Navigate to="/admin" replace /> : <AdminLogin onLogin={handleAdminLogin} />
          } />
          <Route path="/admin" element={
            adminUser ? <AdminDashboard adminToken={adminToken} onLogout={handleAdminLogout} /> : <Navigate to="/admin-login" replace />
          } />
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" replace /> : <Signup onLogin={handleLogin} />
          } />
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/create" element={
            user ? <CreateInvoice user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/invoices" element={
            user ? <Invoices user={user} /> : <Navigate to="/login" replace />
          } />
          <Route path="/settings" element={
            user ? <Settings /> : <Navigate to="/login" replace />
          } />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          main {
            margin-left: 0 !important;
            max-width: 100% !important;
            padding-top: 72px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
