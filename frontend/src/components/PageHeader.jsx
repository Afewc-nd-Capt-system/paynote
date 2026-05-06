import React from 'react'

function PageHeader({ title, subtitle, actionText, onAction }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      flexWrap: 'wrap',
      marginBottom: 24
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--apple-text)',
          letterSpacing: '-0.5px',
          marginBottom: 6,
          lineHeight: 1.1
        }}>{title}</h1>
        <p style={{
          fontSize: 15,
          color: 'var(--apple-muted)',
          margin: 0,
          maxWidth: 560,
          lineHeight: 1.6
        }}>{subtitle}</p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--apple-link) 0%, #5856D6 100%)',
            color: 'white',
            fontSize: 15,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            minWidth: 140,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 8px 20px rgba(0,122,255,0.18)',
            alignSelf: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

export default PageHeader
