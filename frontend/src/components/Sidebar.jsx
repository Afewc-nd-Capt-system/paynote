import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import LogoIcon from './icons/LogoIcon'
import DashboardIcon from './icons/DashboardIcon'
import CreateIcon from './icons/CreateIcon'
import InvoicesIcon from './icons/InvoicesIcon'
import SettingsIcon from './icons/SettingsIcon'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/create', label: 'Create Invoice', icon: <CreateIcon /> },
  { path: '/invoices', label: 'Invoices', icon: <InvoicesIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
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
          width: 'min(86vw, 280px)',
          maxWidth: 280,
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(247,249,255,0.82))',
          boxShadow: '16px 0 44px rgba(15,23,42,0.12)',
          borderRight: '1px solid rgba(148,163,184,0.2)',
          backdropFilter: 'blur(10px)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(16px, 4vw, 24px) 0',
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
              width: 48,
              height: 48,
              borderRadius: 10,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent'
            }}>
              <img src="/logo.png" alt="Paynote" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--brand-foreground, #1d1d1f)',
                letterSpacing: '-0.5px'
              }}>Paynote</h1>
              <p style={{
                fontSize: 12,
                color: 'var(--apple-muted, #86868b)',
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
                borderRadius: 14,
                marginBottom: 6,
                color: isActive ? '#0f172a' : '#64748b',
                background: isActive ? 'linear-gradient(90deg, rgba(14,165,233,0.18), rgba(96,165,250,0.22))' : 'rgba(255,255,255,0.32)',
                border: isActive ? '1px solid rgba(14,165,233,0.24)' : '1px solid transparent',
                boxShadow: isActive ? '0 12px 30px rgba(14,165,233,0.16)' : 'none',
                fontWeight: isActive ? 700 : 600,
                fontSize: 15,
                transition: 'all 0.25s ease',
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
              borderRadius: 14,
              background: 'rgba(255,255,255,0.72)',
              color: '#b91c1c',
              fontWeight: 700,
              fontSize: 15,
              border: '1px solid rgba(254,202,202,0.96)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(254,242,242,0.94)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.72)'}
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
