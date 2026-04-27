import { nanoid } from 'nanoid'
import { getDB, STORE_DOCUMENTS, STORE_SNAPSHOTS, deriveTitle, countWords } from './db.js'

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
  }
  await db.put(STORE_DOCUMENTS, doc)
  return doc
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
  return updated
}

export async function getDocument(id) {
  const db = await getDB()
  return (await db.get(STORE_DOCUMENTS, id)) || null
}

export async function listDocuments() {
  const db = await getDB()
  const all = await db.getAll(STORE_DOCUMENTS)
  return all.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned
    return b.updatedAt - a.updatedAt
  })
}

export async function deleteDocument(id) {
  const db = await getDB()
  const tx = db.transaction([STORE_DOCUMENTS, STORE_SNAPSHOTS], 'readwrite')
  await tx.objectStore(STORE_DOCUMENTS).delete(id)

  // Cascade-delete snapshots
  const snapStore = tx.objectStore(STORE_SNAPSHOTS)
  const index = snapStore.index('documentId')
  let cursor = await index.openCursor(IDBKeyRange.only(id))
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
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
