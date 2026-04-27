import { getImage } from './imageRepo.js'

const cache = new Map()
const pending = new Map()
const subscribers = new Set()

export const MDIMG_PROTOCOL = 'mdimg://'

export function isInternalImageUri(uri) {
  return typeof uri === 'string' && uri.startsWith(MDIMG_PROTOCOL)
}

export function imageIdFromUri(uri) {
  if (!isInternalImageUri(uri)) return null
  return uri.slice(MDIMG_PROTOCOL.length)
}

export function uriFromImageId(id) {
  return `${MDIMG_PROTOCOL}${id}`
}

export function setBlob(id, blob) {
  const existing = cache.get(id)
  if (existing) {
    URL.revokeObjectURL(existing.objectUrl)
  }
  const objectUrl = URL.createObjectURL(blob)
  cache.set(id, { blob, objectUrl })
  notify()
  return objectUrl
}

export function getObjectUrl(id) {
  return cache.get(id)?.objectUrl || null
}

export function getBlob(id) {
  return cache.get(id)?.blob || null
}

export async function ensureLoaded(id) {
  if (cache.has(id)) return cache.get(id).objectUrl
  if (pending.has(id)) return pending.get(id)
  const promise = getImage(id).then((rec) => {
    if (!rec) return null
    return setBlob(id, rec.blob)
  }).finally(() => pending.delete(id))
  pending.set(id, promise)
  return promise
}

export function extractImageIds(markdown) {
  if (!markdown) return []
  const ids = new Set()
  const re = /mdimg:\/\/([A-Za-z0-9_-]+)/g
  let m
  while ((m = re.exec(markdown))) ids.add(m[1])
  return [...ids]
}

export async function preloadFromMarkdown(markdown) {
  const ids = extractImageIds(markdown)
  await Promise.all(ids.map(ensureLoaded))
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

function notify() {
  for (const fn of subscribers) fn()
}
