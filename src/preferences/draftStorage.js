const DRAFT_KEY = 'draft.current'

export function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || typeof draft.content !== 'string' || !draft.content.trim()) {
      return null
    }
    return {
      content: draft.content,
      savedAt: typeof draft.savedAt === 'number' ? draft.savedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function writeDraft(content) {
  try {
    if (!content || !content.trim()) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ content, savedAt: Date.now() })
    )
  } catch {}
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

export function formatRelativeTime(epoch) {
  const diff = Date.now() - epoch
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}
