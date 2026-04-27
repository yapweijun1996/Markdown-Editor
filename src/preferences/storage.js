import { DEFAULT_PREFS, PREFS_VERSION } from './defaults.js'

const PREFS_KEY = 'prefs.v1'

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base
  const out = { ...base }
  for (const key of Object.keys(base)) {
    const v = override[key]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = deepMerge(base[key], v)
    } else if (v !== undefined) {
      out[key] = v
    }
  }
  return out
}

function migrate(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_PREFS
  if (stored.version === PREFS_VERSION) {
    return deepMerge(DEFAULT_PREFS, stored)
  }
  return DEFAULT_PREFS
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return migrate(JSON.parse(raw))
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

export function resetPrefs() {
  try {
    localStorage.removeItem(PREFS_KEY)
  } catch {}
}
