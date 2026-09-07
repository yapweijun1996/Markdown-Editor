import { Paragraph, ImageRun, TextRun } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { isInternalImageUri, getBlob, imageIdFromUri, ensureLoaded } from '../images/imageCache.js'

const MAX_DOCX_WIDTH_PX = 600
const TYPE_FROM_MIME = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/gif':  'gif',
  'image/bmp':  'bmp',
  'image/svg+xml': 'svg',
}

async function blobToArrayBuffer(blob) {
  if (blob.arrayBuffer) return await blob.arrayBuffer()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

async function decodeDataUri(uri) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/.exec(uri)
  if (!match) return null
  const mime = match[1] || 'image/png'
  const isBase64 = !!match[2]
  const data = match[3]
  let binary
  if (isBase64) {
    const raw = atob(data)
    binary = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) binary[i] = raw.charCodeAt(i)
  } else {
    binary = new TextEncoder().encode(decodeURIComponent(data))
  }
  return { buffer: binary.buffer, mime }
}

function detectImageType(mime) {
  return TYPE_FROM_MIME[mime] || 'png'
}

function readDimensions(buffer, mime) {
  return new Promise((resolve) => {
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      typeof Image === 'undefined'
    ) {
      resolve({ width: 320, height: 240 })
      return
    }
    const blob = new Blob([buffer], { type: mime })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      let outW = w
      let outH = h
      if (w > MAX_DOCX_WIDTH_PX) {
        const scale = MAX_DOCX_WIDTH_PX / w
        outW = MAX_DOCX_WIDTH_PX
        outH = Math.round(h * scale)
      }
      resolve({ width: outW, height: outH })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 320, height: 240 })
    }
    img.src = url
  })
}

function createImageRun(data) {
  const type = detectImageType(data.mime)
  return new ImageRun({
    data: data.buffer,
    transformation: { width: data.width, height: data.height },
    type,
    altText: data.alt
      ? { name: data.alt, description: data.alt, title: data.alt }
      : undefined,
  })
}

function unavailableImageText(alt) {
  return alt ? `[Image: ${alt}]` : '[Image not available]'
}

export async function loadImageData(node) {
  const url = node.url || ''
  const alt = (node.alt || node.title || '').trim()

  let buffer = null
  let mime = 'image/png'

  if (isInternalImageUri(url)) {
    const id = imageIdFromUri(url)
    let blob = getBlob(id)
    if (!blob) {
      await ensureLoaded(id)
      blob = getBlob(id)
    }
    if (blob) {
      mime = blob.type || 'image/png'
      buffer = await blobToArrayBuffer(blob)
    }
  } else if (url.startsWith('data:')) {
    let decoded = null
    try {
      decoded = await decodeDataUri(url)
    } catch {
      decoded = null
    }
    if (decoded) {
      buffer = decoded.buffer
      mime = decoded.mime
    }
  }
  // Remote http(s) images are out of scope (V3 non-goal: remote image downloading)

  if (!buffer) return null

  const { width, height } = await readDimensions(buffer, mime)
  return { buffer, mime, alt, width, height }
}

export async function convertInlineImage(node, inherited = {}) {
  const data = await loadImageData(node)
  if (!data) {
    return new TextRun({
      ...inherited,
      text: unavailableImageText((node.alt || node.title || '').trim()),
      italics: true,
      color: '888888',
    })
  }
  return createImageRun(data)
}

export async function convertImage(node) {
  const data = await loadImageData(node)
  if (!data) {
    const cfg = wordStyleConfig.paragraph
    return new Paragraph({
      children: [
        new TextRun({
          text: unavailableImageText((node.alt || node.title || '').trim()),
          italics: true,
          color: '888888',
        }),
      ],
      spacing: { after: cfg.spacingAfter },
    })
  }

  return new Paragraph({
    children: [createImageRun(data)],
    spacing: { after: 160 },
  })
}
