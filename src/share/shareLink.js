import LZString from 'lz-string'
import {
  getTextByteLength,
  RESOURCE_LIMITS,
} from '../limits/resourceLimits.js'

const PARAM_CONTENT = 'content'
const PARAM_MODE = 'mode'
const MODE_PREVIEW = 'preview'

export function hasLocalImageReferences(markdown) {
  return /mdimg:\/\/[A-Za-z0-9_-]+/.test(markdown || '')
}

export function encodeShareUrl(markdown, previewOnly = false) {
  const source = markdown || ''
  if (source.length > RESOURCE_LIMITS.shareMarkdownCharacters) {
    throw new Error('Markdown is too large to encode in a share link.')
  }
  const compressed = LZString.compressToEncodedURIComponent(source)
  const params = new URLSearchParams()
  params.set(PARAM_CONTENT, compressed)
  if (previewOnly) params.set(PARAM_MODE, MODE_PREVIEW)

  const baseUrl = `${window.location.origin}${window.location.pathname}`
  const url = `${baseUrl}#${params.toString()}`
  if (getTextByteLength(url) > RESOURCE_LIMITS.encodedShareCharacters) {
    throw new Error('The generated share link exceeds the supported size.')
  }
  return url
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
  if (content.length > RESOURCE_LIMITS.encodedShareCharacters) return null

  const markdown = LZString.decompressFromEncodedURIComponent(content)
  if (markdown === null) return null
  if (markdown.length > RESOURCE_LIMITS.shareMarkdownCharacters) return null

  return {
    markdown,
    previewOnly: mode === MODE_PREVIEW,
  }
}

export async function copyToClipboard(text) {
  let textarea = null
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    return ok
  } catch {
    return false
  } finally {
    textarea?.remove()
  }
}
