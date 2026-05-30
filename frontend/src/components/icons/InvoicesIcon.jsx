import React from 'react'

export default function InvoicesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="3" width="12" height="18" rx="2" fill="#fff" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.2" />
      <path d="M8 7h6" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 11h6" stroke="#9BBFF9" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="#DDEBFF" />
    </svg>
  )
}
