import React from 'react'
import { useTheme } from './useTheme.js'

const LABELS = { light: 'Light', dark: 'Dark', system: 'Auto' }

const ICONS = {
  light: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
  dark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  ),
}

export default function ThemeToggle() {
  const { mode, cycle } = useTheme()
  return (
    <button
      className="icon-btn theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[mode]} (click to change)`}
      title={`Theme: ${LABELS[mode]}`}
    >
      {ICONS[mode]}
    </button>
  )
}
