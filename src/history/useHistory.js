import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createDocument,
  updateDocument,
  getDocument,
  listDocuments,
  deleteDocument as repoDelete,
  togglePin as repoTogglePin,
  renameDocument as repoRename,
} from './documentRepo.js'
import { maybeCreateSnapshot } from './snapshotRepo.js'

const CURRENT_DOC_KEY = 'history.currentDocId'
const DOC_AUTOSAVE_MS = 8000
const SNAPSHOT_AUTOSAVE_MS = 30000

function readCurrentId() {
  try {
    return localStorage.getItem(CURRENT_DOC_KEY) || null
  } catch {
    return null
  }
}

function writeCurrentId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_DOC_KEY, id)
    else localStorage.removeItem(CURRENT_DOC_KEY)
  } catch {}
}

export function useHistory({ markdown, setMarkdown, paused }) {
  const [currentDocId, setCurrentDocId] = useState(readCurrentId)
  const [docs, setDocs] = useState([])
  const [supported, setSupported] = useState(true)
  const lastSavedRef = useRef('')

  // Mirror current id to storage
  useEffect(() => {
    writeCurrentId(currentDocId)
  }, [currentDocId])

  const refresh = useCallback(async () => {
    try {
      const all = await listDocuments()
      setDocs(all)
    } catch (err) {
      console.warn('History list failed', err)
      setSupported(false)
    }
  }, [])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

  // Auto-save current document (debounced)
  useEffect(() => {
    if (paused) return
    if (!markdown.trim()) return
    if (markdown === lastSavedRef.current) return

    const t = setTimeout(async () => {
      try {
        if (currentDocId) {
          const updated = await updateDocument(currentDocId, markdown)
          if (!updated) {
            // Stale id (deleted in another tab) — create a new doc
            const created = await createDocument(markdown)
            setCurrentDocId(created.id)
          }
        } else {
          const created = await createDocument(markdown)
          setCurrentDocId(created.id)
        }
        lastSavedRef.current = markdown
        refresh()
      } catch (err) {
        console.warn('History save failed', err)
        setSupported(false)
      }
    }, DOC_AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [markdown, currentDocId, paused, refresh])

  // Snapshot creation (longer debounce)
  useEffect(() => {
    if (paused) return
    if (!currentDocId || !markdown.trim()) return

    const t = setTimeout(() => {
      maybeCreateSnapshot(currentDocId, markdown).catch((err) => {
        console.warn('Snapshot save failed', err)
      })
    }, SNAPSHOT_AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [markdown, currentDocId, paused])

  const openDoc = useCallback(async (id) => {
    try {
      const doc = await getDocument(id)
      if (!doc) return
      setCurrentDocId(doc.id)
      lastSavedRef.current = doc.content
      setMarkdown(doc.content)
    } catch (err) {
      console.warn('Open doc failed', err)
    }
  }, [setMarkdown])

  const newDoc = useCallback(() => {
    setCurrentDocId(null)
    lastSavedRef.current = ''
    setMarkdown('')
  }, [setMarkdown])

  const deleteDoc = useCallback(async (id) => {
    await repoDelete(id)
    if (id === currentDocId) {
      setCurrentDocId(null)
      lastSavedRef.current = ''
      setMarkdown('')
    }
    refresh()
  }, [currentDocId, refresh, setMarkdown])

  const togglePin = useCallback(async (id) => {
    await repoTogglePin(id)
    refresh()
  }, [refresh])

  const rename = useCallback(async (id, title) => {
    await repoRename(id, title)
    refresh()
  }, [refresh])

  return {
    supported,
    currentDocId,
    docs,
    refresh,
    openDoc,
    newDoc,
    deleteDoc,
    togglePin,
    rename,
  }
}
