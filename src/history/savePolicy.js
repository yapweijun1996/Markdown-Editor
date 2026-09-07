export const DOC_AUTOSAVE_MS = 8000
export const DOC_AUTOSAVE_MAX_MS = 30000

export function getSaveDelay(now, firstPendingAt) {
  if (!firstPendingAt) return DOC_AUTOSAVE_MS
  const elapsed = Math.max(0, now - firstPendingAt)
  return Math.max(0, Math.min(DOC_AUTOSAVE_MS, DOC_AUTOSAVE_MAX_MS - elapsed))
}
