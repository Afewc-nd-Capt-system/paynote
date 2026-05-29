import React from 'react'

function InstallPrompt({ onInstall, isReady }) {
  if (!isReady) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: 'clamp(12px, 4vw, 18px)',
        bottom: 'clamp(12px, 4vw, 18px)',
        zIndex: 999,
        width: 'min(92vw, 300px)',
        maxWidth: '92vw',
        padding: '16px 18px',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)',
        backdropFilter: 'blur(14px)',
        background: 'rgba(8, 13, 29, 0.82)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)'
        }}>📲</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Install Paynote</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>Use it like a native mobile app</div>
        </div>
      </div>

      <button
        onClick={onInstall}
        style={{
          borderRadius: 999,
          padding: '10px 12px',
          fontWeight: 700,
          fontSize: 12,
          color: '#02121f',
          background: 'linear-gradient(135deg, #67e8f9, #a78bfa)'
        }}
      >
        Install app
      </button>
    </div>
  )
}

export default InstallPrompt
