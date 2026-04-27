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

export async function convertImage(node) {
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
    const decoded = await decodeDataUri(url)
    if (decoded) {
      buffer = decoded.buffer
      mime = decoded.mime
    }
  }
  // Remote http(s) images are out of scope (V3 non-goal: remote image downloading)

  if (!buffer) {
    const cfg = wordStyleConfig.paragraph
    return new Paragraph({
      children: [
        new TextRun({
          text: alt ? `[Image: ${alt}]` : '[Image not available]',
          italics: true,
          color: '888888',
        }),
      ],
      spacing: { after: cfg.spacingAfter },
    })
  }

  const { width, height } = await readDimensions(buffer, mime)
  const type = detectImageType(mime)

  return new Paragraph({
    children: [
      new ImageRun({
        data: buffer,
        transformation: { width, height },
        type,
        altText: alt
          ? { name: alt, description: alt, title: alt }
          : undefined,
      }),
    ],
    spacing: { after: 160 },
  })
}
