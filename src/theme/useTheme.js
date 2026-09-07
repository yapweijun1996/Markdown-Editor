import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme.mode'
export const THEME_MODES = ['light', 'dark', 'system']
let sharedMode
const listeners = new Set()

export function normalizeThemeMode(value) {
  return THEME_MODES.includes(value) ? value : 'system'
}

function readStoredMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return normalizeThemeMode(v)
  } catch {
    return 'system'
  }
}

function getSharedMode() {
  if (!sharedMode) sharedMode = readStoredMode()
  return sharedMode
}

function setSharedMode(next) {
  const mode = normalizeThemeMode(next)
  sharedMode = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {}
  for (const listener of listeners) listener(mode)
}

function handleStorageEvent(event) {
  if (event.key !== STORAGE_KEY) return
  const mode = normalizeThemeMode(event.newValue)
  if (sharedMode === mode) return
  sharedMode = mode
  for (const listener of listeners) listener(mode)
}

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function applyTheme(mode) {
  if (typeof document === 'undefined') return
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#161618' : '#FFFFFF')
  }
}

export function useTheme() {
  const [mode, setModeState] = useState(getSharedMode)

  useEffect(() => {
    listeners.add(setModeState)
    if (typeof window !== 'undefined') window.addEventListener('storage', handleStorageEvent)
    return () => {
      listeners.delete(setModeState)
      if (typeof window !== 'undefined') window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [mode])

  const setMode = useCallback((next) => {
    const current = getSharedMode()
    setSharedMode(typeof next === 'function' ? next(current) : next)
  }, [])

  const cycle = useCallback(() => {
    const current = getSharedMode()
    setSharedMode(current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light')
  }, [])

  return { mode, setMode, cycle }
}
