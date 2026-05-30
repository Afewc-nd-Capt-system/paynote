import React from 'react'

export default function CreateIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.2" />
      <path d="M8 11h8" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8v8" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
