import { normalizeImageMimeType } from '../limits/resourceLimits.js'

export function isImageFile(file) {
  return Boolean(file && normalizeImageMimeType(file.type))
}

export function pickImagesFromFileList(files) {
  return [...(files || [])].filter(isImageFile)
}

export function pickImageFromClipboard(clipboardData) {
  if (!clipboardData) return null
  const items = clipboardData.items || []
  for (const item of items) {
    if (item.kind === 'file' && normalizeImageMimeType(item.type)) {
      const file = item.getAsFile()
      if (isImageFile(file)) return file
    }
  }
  return null
}

export function buildImageMarkdown(uri, alt = '') {
  return `![${alt}](${uri})`
}

export function insertAtCursor(textarea, text) {
  if (!textarea) return text
  const { selectionStart, selectionEnd, value } = textarea
  const start = selectionStart ?? value.length
  const end = selectionEnd ?? value.length
  const before = value.slice(0, start)
  const after = value.slice(end)
  const needsLeadingNewline = before && !before.endsWith('\n') ? '\n' : ''
  const needsTrailingNewline = after && !after.startsWith('\n') ? '\n' : ''
  const insertion = `${needsLeadingNewline}${text}${needsTrailingNewline}`
  const next = before + insertion + after
  // Move cursor after the insertion
  setTimeout(() => {
    const pos = start + insertion.length
    textarea.focus()
    textarea.setSelectionRange(pos, pos)
  }, 0)
  return next
}
