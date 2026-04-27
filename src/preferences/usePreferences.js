import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_PREFS } from './defaults.js'
import { loadPrefs, savePrefs, resetPrefs } from './storage.js'

export function usePreferences() {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const update = useCallback((section, key, value) => {
    setPrefs((p) => ({
      ...p,
      [section]: { ...p[section], [key]: value },
    }))
  }, [])

  const reset = useCallback(() => {
    resetPrefs()
    setPrefs(DEFAULT_PREFS)
  }, [])

  return { prefs, update, reset }
}
