import LZString from 'lz-string'

const PARAM_CONTENT = 'content'
const PARAM_MODE = 'mode'
const MODE_PREVIEW = 'preview'

export function encodeShareUrl(markdown, previewOnly = false) {
  const compressed = LZString.compressToEncodedURIComponent(markdown || '')
  const params = new URLSearchParams()
  params.set(PARAM_CONTENT, compressed)
  if (previewOnly) params.set(PARAM_MODE, MODE_PREVIEW)

  const baseUrl = `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}#${params.toString()}`
}

function readHashParams() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash)
}

export function decodeShareUrl() {
  let params = readHashParams()
  let content = params.get(PARAM_CONTENT)
  let mode = params.get(PARAM_MODE)

  if (!content) {
    const search = new URLSearchParams(window.location.search)
    content = search.get(PARAM_CONTENT)
    mode = mode || search.get(PARAM_MODE)
  }

  if (!content) return null

  const markdown = LZString.decompressFromEncodedURIComponent(content)
  if (markdown === null) return null

  return {
    markdown,
    previewOnly: mode === MODE_PREVIEW,
  }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}
