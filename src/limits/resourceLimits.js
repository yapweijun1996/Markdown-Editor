export const RESOURCE_LIMITS = Object.freeze({
  markdownBytes: 2 * 1024 * 1024,
  shareMarkdownCharacters: 1_000_000,
  shareUrlCharacters: 50_000,
  encodedShareCharacters: 200_000,
  qrUrlCharacters: 2_953,
  imageBytes: 25 * 1024 * 1024,
  imagePixels: 40_000_000,
  diagramCharacters: 100_000,
  batchFiles: 100,
  batchTotalBytes: 50 * 1024 * 1024,
})

export const SUPPORTED_IMAGE_MIME_TYPES = Object.freeze({
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/gif': 'image/gif',
  'image/bmp': 'image/bmp',
  'image/svg+xml': 'image/svg+xml',
})

export function normalizeImageMimeType(mimeType) {
  return SUPPORTED_IMAGE_MIME_TYPES[String(mimeType || '').toLowerCase()] || null
}

export function getTextByteLength(value) {
  return new TextEncoder().encode(String(value || '')).byteLength
}
