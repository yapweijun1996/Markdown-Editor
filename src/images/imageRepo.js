import { nanoid } from 'nanoid'
import { getDB, STORE_IMAGES } from '../history/db.js'

const MAX_DIMENSION = 2400

async function readImageDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0 })
    }
    img.src = url
  })
}

async function maybeDownscale(blob, mimeType) {
  const { width, height } = await readImageDimensions(blob)
  if (!width || !height) return { blob, width, height }
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { blob, width, height }
  }
  if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
    return { blob, width, height }
  }
  try {
    const scale = MAX_DIMENSION / Math.max(width, height)
    const newW = Math.round(width * scale)
    const newH = Math.round(height * scale)
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = newW
    canvas.height = newH
    canvas.getContext('2d').drawImage(bitmap, 0, 0, newW, newH)
    const out = await new Promise((r) => canvas.toBlob(r, mimeType, 0.9))
    return { blob: out || blob, width: newW, height: newH }
  } catch {
    return { blob, width, height }
  }
}

export async function createImage({ documentId, blob, filename }) {
  const mimeType = blob.type || 'image/png'
  const processed = await maybeDownscale(blob, mimeType)
  const record = {
    id: nanoid(),
    documentId: documentId || null,
    filename: filename || `image-${Date.now()}.${mimeType.split('/')[1] || 'png'}`,
    mimeType,
    blob: processed.blob,
    width: processed.width,
    height: processed.height,
    sizeBytes: processed.blob.size,
    createdAt: Date.now(),
  }
  const db = await getDB()
  await db.put(STORE_IMAGES, record)
  return record
}

export async function getImage(id) {
  const db = await getDB()
  return (await db.get(STORE_IMAGES, id)) || null
}

export async function listImagesByDocument(documentId) {
  const db = await getDB()
  const idx = db.transaction(STORE_IMAGES).store.index('documentId')
  return await idx.getAll(IDBKeyRange.only(documentId))
}

export async function listAllImages() {
  const db = await getDB()
  return await db.getAll(STORE_IMAGES)
}

export async function deleteImage(id) {
  const db = await getDB()
  await db.delete(STORE_IMAGES, id)
}

export async function deleteImagesByDocument(documentId) {
  const db = await getDB()
  const tx = db.transaction(STORE_IMAGES, 'readwrite')
  const idx = tx.store.index('documentId')
  let cursor = await idx.openCursor(IDBKeyRange.only(documentId))
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

export async function attachImageToDocument(imageId, documentId) {
  const db = await getDB()
  const existing = await db.get(STORE_IMAGES, imageId)
  if (!existing || existing.documentId === documentId) return existing
  await db.put(STORE_IMAGES, { ...existing, documentId })
  return { ...existing, documentId }
}
