import {
  DEFAULT_PREFS,
  PREFS_VERSION,
  FONT_SIZE_PX,
  LINE_HEIGHT_VALUE,
  FONT_FAMILY_STACK,
  AUTO_SAVE_INTERVALS,
  LASER_COLOR_HEX,
  LASER_SIZE_PX,
} from './defaults.js'

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
  if (!stored || typeof stored !== 'object') return normalizePrefs(DEFAULT_PREFS)
  if (stored.version === PREFS_VERSION) {
    return normalizePrefs(stored)
  }
  return normalizePrefs(DEFAULT_PREFS)
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

function pickBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizePrefs(stored) {
  const merged = deepMerge(DEFAULT_PREFS, stored)
  const editor = merged.editor && typeof merged.editor === 'object' ? merged.editor : {}
  const draft = merged.draft && typeof merged.draft === 'object' ? merged.draft : {}
  const presentation = merged.presentation && typeof merged.presentation === 'object'
    ? merged.presentation
    : {}
  return {
    version: PREFS_VERSION,
    editor: {
      fontSize: pick(editor.fontSize, Object.keys(FONT_SIZE_PX), DEFAULT_PREFS.editor.fontSize),
      fontFamily: pick(editor.fontFamily, Object.keys(FONT_FAMILY_STACK), DEFAULT_PREFS.editor.fontFamily),
      lineHeight: pick(editor.lineHeight, Object.keys(LINE_HEIGHT_VALUE), DEFAULT_PREFS.editor.lineHeight),
      wordWrap: pickBoolean(editor.wordWrap, DEFAULT_PREFS.editor.wordWrap),
    },
    draft: {
      autoSave: pickBoolean(draft.autoSave, DEFAULT_PREFS.draft.autoSave),
      autoSaveInterval: pick(
        draft.autoSaveInterval,
        AUTO_SAVE_INTERVALS.map((option) => option.value),
        DEFAULT_PREFS.draft.autoSaveInterval
      ),
    },
    presentation: {
      color: pick(presentation.color, Object.keys(LASER_COLOR_HEX), DEFAULT_PREFS.presentation.color),
      size: pick(presentation.size, Object.keys(LASER_SIZE_PX), DEFAULT_PREFS.presentation.size),
      trail: pickBoolean(presentation.trail, DEFAULT_PREFS.presentation.trail),
      fullscreen: pickBoolean(presentation.fullscreen, DEFAULT_PREFS.presentation.fullscreen),
    },
  }
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return normalizePrefs(DEFAULT_PREFS)
    return migrate(JSON.parse(raw))
  } catch {
    return normalizePrefs(DEFAULT_PREFS)
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
