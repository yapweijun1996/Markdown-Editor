import { nanoid } from 'nanoid'
import { getDB, STORE_SNAPSHOTS } from './db.js'

const MAX_SNAPSHOTS_PER_DOC = 50

export function shouldCreateSnapshot(latest, content, { force = false } = {}) {
  if (content == null) return false
  if (!force && !content) return false
  if (latest?.content === content) return false
  return true
}

export async function maybeCreateSnapshot(documentId, content, options = {}) {
  if (!documentId || content == null) return null
  const db = await getDB()

  const existing = await listSnapshots(documentId)
  if (!shouldCreateSnapshot(existing[0], content, options)) return null

  const snap = {
    id: nanoid(),
    documentId,
    content,
    createdAt: Date.now(),
  }
  const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite')
  await tx.store.put(snap)

  // FIFO eviction stays in the same transaction as insertion.
  const all = await tx.store.index('documentId').getAll(IDBKeyRange.only(documentId))
  all.sort((a, b) => b.createdAt - a.createdAt)
  if (all.length > MAX_SNAPSHOTS_PER_DOC) {
    const excess = all.slice(MAX_SNAPSHOTS_PER_DOC)
    for (const s of excess) {
      await tx.store.delete(s.id)
    }
  }
  await tx.done
  return snap
}

export async function listSnapshots(documentId) {
  const db = await getDB()
  const index = db.transaction(STORE_SNAPSHOTS).store.index('documentId')
  const all = await index.getAll(IDBKeyRange.only(documentId))
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteSnapshot(id) {
  const db = await getDB()
  await db.delete(STORE_SNAPSHOTS, id)
}
