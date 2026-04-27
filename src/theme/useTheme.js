import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme.mode'
const VALID_MODES = ['light', 'dark', 'system']

function readStoredMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return VALID_MODES.includes(v) ? v : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function applyTheme(mode) {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#161618' : '#FFFFFF')
  }
}

export function useTheme() {
  const [mode, setMode] = useState(readStoredMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {}
    applyTheme(mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  function cycle() {
    setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light'))
  }

  return { mode, setMode, cycle }
}
