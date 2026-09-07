import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PREFS } from '../src/preferences/defaults.js'
import { normalizePrefs } from '../src/preferences/storage.js'
import { normalizeThemeMode } from '../src/theme/useTheme.js'

test('normalizePrefs recovers invalid persisted values without leaking unknown fields', () => {
  const normalized = normalizePrefs({
    version: 1,
    editor: { fontSize: 'huge', fontFamily: 'comic', wordWrap: 'yes', injected: true },
    draft: { autoSave: 1, autoSaveInterval: 1 },
    presentation: { color: 'purple', size: 'giant', trail: false, fullscreen: null },
    injected: true,
  })

  assert.deepEqual(normalized, {
    ...DEFAULT_PREFS,
    editor: { ...DEFAULT_PREFS.editor },
    draft: { ...DEFAULT_PREFS.draft },
    presentation: { ...DEFAULT_PREFS.presentation, trail: false },
  })
})

test('normalizeThemeMode falls back to system for invalid persisted modes', () => {
  assert.equal(normalizeThemeMode('dark'), 'dark')
  assert.equal(normalizeThemeMode('solarized'), 'system')
  assert.equal(normalizeThemeMode(null), 'system')
})
