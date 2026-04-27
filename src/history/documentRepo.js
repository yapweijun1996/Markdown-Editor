import { nanoid } from 'nanoid'
import { getDB, STORE_DOCUMENTS, STORE_SNAPSHOTS, STORE_IMAGES, deriveTitle, countWords } from './db.js'

export const DEFAULT_LAYOUT = {
  pageSize: 'a4',
  orientation: 'portrait',
  header: '',
  footer: '',
  pageNumbers: true,
  coverPage: {
    enabled: false,
    title: '',
    subtitle: '',
    author: '',
    date: '',
  },
}

function withDefaults(doc) {
  if (!doc) return doc
  return {
    ...doc,
    templateId: doc.templateId || 'default',
    layout: {
      ...DEFAULT_LAYOUT,
      ...(doc.layout || {}),
      coverPage: {
        ...DEFAULT_LAYOUT.coverPage,
        ...((doc.layout && doc.layout.coverPage) || {}),
      },
    },
  }
}

export async function createDocument(content) {
  const db = await getDB()
  const now = Date.now()
  const doc = {
    id: nanoid(),
    title: deriveTitle(content),
    content,
    createdAt: now,
    updatedAt: now,
    wordCount: countWords(content),
    sizeBytes: new Blob([content]).size,
    pinned: 0,
    templateId: 'default',
    layout: { ...DEFAULT_LAYOUT, coverPage: { ...DEFAULT_LAYOUT.coverPage } },
  }
  await db.put(STORE_DOCUMENTS, doc)
  return withDefaults(doc)
}

export async function updateDocument(id, content) {
  const db = await getDB()
  const existing = await db.get(STORE_DOCUMENTS, id)
  if (!existing) return null

  const updated = {
    ...existing,
    title: deriveTitle(content),
    content,
    updatedAt: Date.now(),
    wordCount: countWords(content),
    sizeBytes: new Blob([content]).size,
  }
  await db.put(STORE_DOCUMENTS, updated)
  return withDefaults(updated)
}

export async function updateDocumentLayout(id, patch) {
  const db = await getDB()
  const existing = await db.get(STORE_DOCUMENTS, id)
  if (!existing) return null
  const merged = withDefaults(existing)
  const next = {
    ...existing,
    templateId: patch.templateId !== undefined ? patch.templateId : merged.templateId,
    layout: {
      ...merged.layout,
      ...(patch.layout || {}),
      coverPage: {
        ...merged.layout.coverPage,
        ...((patch.layout && patch.layout.coverPage) || {}),
      },
    },
    updatedAt: Date.now(),
  }
  await db.put(STORE_DOCUMENTS, next)
  return withDefaults(next)
}

export async function getDocument(id) {
  const db = await getDB()
  const doc = (await db.get(STORE_DOCUMENTS, id)) || null
  return doc ? withDefaults(doc) : null
}

export async function listDocuments() {
  const db = await getDB()
  const all = await db.getAll(STORE_DOCUMENTS)
  return all
    .map(withDefaults)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned
      return b.updatedAt - a.updatedAt
    })
}

export async function deleteDocument(id) {
  const db = await getDB()
  const tx = db.transaction(
    [STORE_DOCUMENTS, STORE_SNAPSHOTS, STORE_IMAGES],
    'readwrite'
  )
  await tx.objectStore(STORE_DOCUMENTS).delete(id)

  // Cascade-delete snapshots
  const snapStore = tx.objectStore(STORE_SNAPSHOTS)
  let cursor = await snapStore.index('documentId').openCursor(IDBKeyRange.only(id))
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }

  // Cascade-delete images
  const imgStore = tx.objectStore(STORE_IMAGES)
  let imgCursor = await imgStore.index('documentId').openCursor(IDBKeyRange.only(id))
  while (imgCursor) {
    await imgCursor.delete()
    imgCursor = await imgCursor.continue()
  }

  await tx.done
}

export async function togglePin(id) {
  const db = await getDB()
  const existing = await db.get(STORE_DOCUMENTS, id)
  if (!existing) return null
  const updated = { ...existing, pinned: existing.pinned ? 0 : 1 }
  await db.put(STORE_DOCUMENTS, updated)
  return updated
}

export async function renameDocument(id, title) {
  const db = await getDB()
  const existing = await db.get(STORE_DOCUMENTS, id)
  if (!existing) return null
  const cleaned = (title || '').trim().slice(0, 80) || deriveTitle(existing.content)
  const updated = { ...existing, title: cleaned, updatedAt: Date.now() }
  await db.put(STORE_DOCUMENTS, updated)
  return updated
}
