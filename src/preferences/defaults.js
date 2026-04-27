export const PREFS_VERSION = 1

export const DEFAULT_PREFS = {
  version: PREFS_VERSION,
  editor: {
    fontSize: 'md',
    fontFamily: 'mono',
    lineHeight: 'normal',
    wordWrap: true,
  },
  draft: {
    autoSave: true,
    autoSaveInterval: 3000,
  },
}

export const FONT_SIZE_PX = {
  sm: 13,
  md: 15,
  lg: 17,
  xl: 19,
}

export const LINE_HEIGHT_VALUE = {
  compact: 1.4,
  normal: 1.7,
  relaxed: 2.0,
}

export const FONT_FAMILY_STACK = {
  mono:   'var(--font-mono)',
  system: 'var(--font-system)',
  serif:  'Georgia, "Times New Roman", "Songti SC", serif',
}

export const AUTO_SAVE_INTERVALS = [
  { label: '3s',  value: 3000 },
  { label: '5s',  value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
]
