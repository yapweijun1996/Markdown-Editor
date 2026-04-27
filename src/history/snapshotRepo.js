import { nanoid } from 'nanoid'
import { getDB, STORE_SNAPSHOTS } from './db.js'

const MAX_SNAPSHOTS_PER_DOC = 50
const MIN_DIFF_BYTES = 32

export async function maybeCreateSnapshot(documentId, content) {
  if (!documentId || !content) return null
  const db = await getDB()

  const existing = await listSnapshots(documentId)
  if (existing.length > 0) {
    const latest = existing[0]
    if (latest.content === content) return null
    if (Math.abs(latest.content.length - content.length) < MIN_DIFF_BYTES) {
      return null
    }
  }

  const snap = {
    id: nanoid(),
    documentId,
    content,
    createdAt: Date.now(),
  }
  await db.put(STORE_SNAPSHOTS, snap)

  // FIFO eviction
  const all = await listSnapshots(documentId)
  if (all.length > MAX_SNAPSHOTS_PER_DOC) {
    const excess = all.slice(MAX_SNAPSHOTS_PER_DOC)
    const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite')
    for (const s of excess) {
      await tx.store.delete(s.id)
    }
    await tx.done
  }
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
