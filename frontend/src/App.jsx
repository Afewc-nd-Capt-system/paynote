import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { logout as logoutUser, verifyToken, verifyAdminSession, adminLogout } from './api'
import { persistSession, restoreSession as restoreStoredSession, clearSession } from './authSession'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function App() {
  const [user, setUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    // 1. Instantly restore from localStorage (no network)
    const storedUserSession = restoreStoredSession('user')
    if (storedUserSession?.user && isMounted) {
      setUser(storedUserSession.user)
    }

    const storedAdminSession = restoreStoredSession('admin')
    if (storedAdminSession?.user && isMounted) {
      setAdminUser(storedAdminSession.user)
    }

    // 2. Hide loading screen immediately (non-blocking)
    if (isMounted) setLoading(false)

    // 3. Verify session in background (don't block the UI)
    const verifyInBackground = async () => {
      // === User session verification ===
      if (localStorage.getItem('paynote_token')) {
        try {
          const userResponse = await verifyToken()
          if (isMounted && userResponse?.user) {
            setUser(userResponse.user)
          } else if (isMounted) {
            setUser(null)
            clearSession('user')
          }
        } catch {
          if (isMounted) {
            setUser(null)
            clearSession('user')
          }
        }
      } else if (isMounted) {
        setUser(null)
        clearSession('user')
      }

      // === Admin session verification ===
      if (localStorage.getItem('admin_token')) {
        try {
          const adminResponse = await verifyAdminSession()
          if (isMounted && adminResponse?.user) {
            setAdminUser(adminResponse.user)
            setAdminToken(null)
          } else if (isMounted) {
            setAdminUser(null)
            setAdminToken(null)
            clearSession('admin')
          }
        } catch {
          if (isMounted) {
            setAdminUser(null)
            setAdminToken(null)
            clearSession('admin')
          }
        }
      } else if (isMounted) {
        setAdminUser(null)
        setAdminToken(null)
        clearSession('admin')
      }
    }

    verifyInBackground()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    setIsInstalled(standalone)

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleLogin = (loginResponse) => {
    const userData = loginResponse?.user || loginResponse
    setUser(userData)

    if (loginResponse?.token) {
      persistSession('user', userData, loginResponse.token)
    }
  }

  const handleAdminLogin = (adminResponse) => {
    const adminData = adminResponse?.user || adminResponse
    setAdminUser(adminData)
    setAdminToken(null)

    if (adminResponse?.token) {
      persistSession('admin', adminData, adminResponse.token)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      // Ignore logout errors so the client clears local UI state
    }

    clearSession('user')
    setUser(null)
    setSidebarOpen(false)
  }

  const handleAdminLogout = async () => {
    try {
      await adminLogout()
    } catch (error) {
      // Ignore logout errors so the client clears local UI state
    }

    clearSession('admin')
    setAdminUser(null)
    setAdminToken(null)
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const isAuthPage = ['/login', '/signup', '/admin-login', '/forgot-password', '/reset-password'].includes(location.pathname)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(14,165,233,0.16), transparent 28%), radial-gradient(circle at bottom, rgba(124,58,237,0.12), transparent 25%), #f4f5f8'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '24px 28px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(148,163,184,0.18)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.12)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#fff',
            background: 'linear-gradient(135deg, #0f172a, #2563eb)'
          }}>💰</div>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#0f172a'
          }}>Restoring your workspace</div>
          <div style={{
            fontSize: 13,
            color: '#64748b'
          }}>Checking your secure session...</div>
        </div>
      </div>
    )
  }

  if (!user && !adminUser && !isAuthPage) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, rgba(14,165,233,0.12), transparent 24()), radial-gradient(circle at bottom right, rgba(124,58,237,0.13), transparent 28%), #f4f5f8'
    }}>
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
            background: 'rgba(255,255,255,0.82)',
            borderRadius: 12,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(15,23,42,0.16)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148,163,184,0.28)'
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
        marginLeft: user ? 'min(86vw, 280px)' : 0,
        padding: 'clamp(12px, 3.4vw, 24px)',
        paddingBottom: 24,
        width: '100%',
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>

      <InstallPrompt isReady={!isInstalled && Boolean(installPrompt)} onInstall={handleInstall} />

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
