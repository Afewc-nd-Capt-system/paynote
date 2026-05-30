import React from 'react'

export default function LogoIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Paynote logo">
      <rect width="48" height="48" rx="10" fill="url(#g)" />
      <path d="M14 30c0-6 6-8 10-8s10 2 10 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 20c2-3 6-6 12-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#5856D6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
