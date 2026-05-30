import React from 'react'

export default function SettingsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="var(--brand-primary, #007AFF)" strokeWidth="1.2" fill="#E6F0FF" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .1-1.1l-1-2.2 1.6-1.4-1.8-2-2.2.4-1.8-1.6-.4-2.2-2.4-.2-1.4 1.6-2.2-.4-1.6 1.6 1 2.2-1 2.2 2.2.6 1.6 1.8-.4 2.2 2 1.6 2.2-.4 1 1.6z" fill="#DDEBFF" stroke="#C9E0FF" strokeWidth="0.6" />
    </svg>
  )
}
