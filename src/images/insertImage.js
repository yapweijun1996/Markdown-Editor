const ACCEPTED_PREFIX = 'image/'

export function isImageFile(file) {
  return file && file.type && file.type.startsWith(ACCEPTED_PREFIX)
}

export function pickImagesFromFileList(files) {
  return [...(files || [])].filter(isImageFile)
}

export function pickImageFromClipboard(clipboardData) {
  if (!clipboardData) return null
  const items = clipboardData.items || []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith(ACCEPTED_PREFIX)) {
      return item.getAsFile()
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
