import { openDB } from 'idb'

const DB_NAME = 'markdown-editor-db'
const DB_VERSION = 2

export const STORE_DOCUMENTS = 'documents'
export const STORE_SNAPSHOTS = 'snapshots'
export const STORE_IMAGES = 'images'

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
          const docs = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' })
          docs.createIndex('updatedAt', 'updatedAt')
          docs.createIndex('pinned', 'pinned')
        }
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          const snaps = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' })
          snaps.createIndex('documentId', 'documentId')
          snaps.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const images = db.createObjectStore(STORE_IMAGES, { keyPath: 'id' })
          images.createIndex('documentId', 'documentId')
          images.createIndex('createdAt', 'createdAt')
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked by another tab')
      },
      terminated() {
        dbPromise = null
      },
    }).catch((err) => {
      console.warn('IndexedDB open failed', err)
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}

export function deriveTitle(content) {
  if (!content) return 'Untitled'
  const lines = content.split('\n')
  for (const line of lines) {
    const m = line.match(/^#{1,6}\s+(.+)/)
    if (m) return m[1].trim().replace(/[#*_`]/g, '').slice(0, 80) || 'Untitled'
  }
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) return trimmed.replace(/[#*_`]/g, '').slice(0, 80)
  }
  return 'Untitled'
}

export function countWords(content) {
  if (!content) return 0
  return content.trim().split(/\s+/).filter(Boolean).length
}
