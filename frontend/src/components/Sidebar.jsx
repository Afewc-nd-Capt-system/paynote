import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/create', label: 'Create Invoice', icon: '📝' },
  { path: '/invoices', label: 'Invoices', icon: '📄' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

function Sidebar({ user, isOpen, onClose, onLogout }) {
  const navigate = useNavigate()

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.18)',
            zIndex: 200,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      <aside
        className="sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 260,
          height: '100vh',
          background: '#ffffff',
          boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 24px 32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              💰
            </div>
            <div>
              <h1 style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#1d1d1f',
                letterSpacing: '-0.5px'
              }}>Paynote</h1>
              <p style={{
                fontSize: 12,
                color: '#86868b',
                marginTop: 2
              }}>{typeof user === 'string' ? user : user?.name || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNav(item.path)}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 12,
                marginBottom: 4,
                color: isActive ? '#007AFF' : '#86868b',
                background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: 15,
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 12px', marginTop: 'auto' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'transparent',
              color: '#ff3b30',
              fontWeight: 500,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,59,48,0.06)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <span style={{ fontSize: 18 }}>🚪</span>
            Log Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
          }
        }
        @media (min-width: 769px) {
          .sidebar-overlay {
            display: none !important;
          }
        }
        .nav-item:hover {
          background: rgba(0,0,0,0.03) !important;
        }
      `}</style>
    </>
  )
}

export default Sidebar
