import React from 'react'

export default function DashboardIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="var(--brand-primary, #007AFF)" />
      <rect x="14" y="3" width="7" height="4" rx="1" fill="#E6F0FF" />
      <rect x="14" y="9" width="7" height="12" rx="1" fill="#DDEBFF" />
      <rect x="3" y="12" width="7" height="6" rx="1" fill="#BFD9FF" />
    </svg>
  )
}
