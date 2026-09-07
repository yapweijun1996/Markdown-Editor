import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createDocument,
  updateDocument,
  updateDocumentLayout,
  getDocument,
  listDocuments,
  deleteDocument as repoDelete,
  togglePin as repoTogglePin,
  renameDocument as repoRename,
  DEFAULT_LAYOUT,
} from './documentRepo.js'
import { maybeCreateSnapshot } from './snapshotRepo.js'
import { getSaveDelay } from './savePolicy.js'
import { importHistoryZip } from './exportHistory.js'

const CURRENT_DOC_KEY = 'history.currentDocId'
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
  const [saveStatus, setSaveStatus] = useState('saved')
  const [saveError, setSaveError] = useState('')
  const lastSavedRef = useRef('')
  const saveTimerRef = useRef(null)
  const firstPendingAtRef = useRef(0)
  const saveQueueRef = useRef(Promise.resolve())
  const currentDocIdRef = useRef(currentDocId)
  const markdownRef = useRef(markdown)
  const saveStatusRef = useRef('saved')

  currentDocIdRef.current = currentDocId
  markdownRef.current = markdown

  const setSaveState = useCallback((next) => {
    saveStatusRef.current = next
    setSaveStatus(next)
  }, [])

  // Currently selected document (with layout/template defaults applied)
  const currentDoc =
    currentDocId ? docs.find((d) => d.id === currentDocId) || null : null

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

  const saveContent = useCallback((documentId, content) => {
    const operation = async () => {
      if (!documentId && !content.trim()) {
        return { documentId: null, content, skipped: true }
      }

      let saved = documentId ? await updateDocument(documentId, content) : null
      if (!saved && !content.trim()) {
        return { documentId: null, content, skipped: true }
      }
      if (!saved) saved = await createDocument(content)

      if (
        currentDocIdRef.current === documentId ||
        (!documentId && currentDocIdRef.current === null)
      ) {
        setCurrentDocId(saved.id)
      }
      await refresh()
      return { documentId: saved.id, content, skipped: false }
    }

    const queued = saveQueueRef.current.then(operation, operation)
    saveQueueRef.current = queued.catch(() => {})
    return queued
  }, [refresh])

  const flush = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    const content = markdownRef.current
    const documentId = currentDocIdRef.current
    const needsSave = content !== lastSavedRef.current &&
      (Boolean(documentId) || Boolean(content.trim()))

    if (!needsSave) {
      firstPendingAtRef.current = 0
      if (saveStatusRef.current !== 'error') setSaveState('saved')
      return true
    }

    setSaveState('saving')
    setSaveError('')
    try {
      await saveContent(documentId, content)
      lastSavedRef.current = content
      firstPendingAtRef.current = 0
      setSaveState('saved')
      return true
    } catch (err) {
      setSaveState('error')
      setSaveError('Could not save the current document. The pending change was kept.')
      console.warn('History save failed', err)
      throw err
    }
  }, [saveContent, setSaveState])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

  // Auto-save current document with an inactivity delay and a maximum wait.
  useEffect(() => {
    if (paused) return
    const needsSave = markdown !== lastSavedRef.current &&
      (Boolean(currentDocId) || Boolean(markdown.trim()))
    if (!needsSave) {
      firstPendingAtRef.current = 0
      return
    }

    if (!firstPendingAtRef.current) firstPendingAtRef.current = Date.now()
    setSaveState('pending')
    setSaveError('')
    const delay = getSaveDelay(Date.now(), firstPendingAtRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      flush().catch(() => {})
    }, delay)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [markdown, currentDocId, paused, flush, setSaveState])

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

  // Best-effort final checkpoint when the app is being torn down.
  useEffect(() => () => {
    if (!paused) void flush().catch(() => {})
  }, [flush, paused])

  const openDoc = useCallback(async (id, { flushPending = true } = {}) => {
    try {
      if (flushPending) await flush()
      const doc = await getDocument(id)
      if (!doc) {
        if (currentDocIdRef.current === id) {
          setCurrentDocId(null)
          lastSavedRef.current = ''
          setMarkdown('')
        }
        return null
      }
      setCurrentDocId(doc.id)
      lastSavedRef.current = doc.content
      setSaveError('')
      setSaveState('saved')
      setMarkdown(doc.content)
      return doc
    } catch (err) {
      console.warn('Open doc failed', err)
      return null
    }
  }, [flush, setMarkdown, setSaveState])

  const detachSession = useCallback(() => {
    setCurrentDocId(null)
    lastSavedRef.current = ''
    setSaveError('')
    setSaveState('saved')
  }, [setSaveState])

  const newDoc = useCallback(async ({ flushPending = true } = {}) => {
    if (flushPending) await flush()
    setCurrentDocId(null)
    lastSavedRef.current = ''
    setSaveError('')
    setSaveState('saved')
    setMarkdown('')
    return true
  }, [flush, setMarkdown, setSaveState])

  const forkDocument = useCallback(async (content) => {
    const created = await createDocument(content)
    setCurrentDocId(created.id)
    lastSavedRef.current = created.content
    setSaveError('')
    setSaveState('saved')
    await refresh()
    return created
  }, [refresh, setSaveState])

  const deleteDoc = useCallback(async (id) => {
    if (id === currentDocIdRef.current) await flush()
    await repoDelete(id)
    if (id === currentDocIdRef.current) {
      setCurrentDocId(null)
      lastSavedRef.current = ''
      setMarkdown('')
      setSaveState('saved')
    }
    await refresh()
  }, [flush, refresh, setMarkdown, setSaveState])

  const togglePin = useCallback(async (id) => {
    await repoTogglePin(id)
    await refresh()
  }, [refresh])

  const rename = useCallback(async (id, title) => {
    await repoRename(id, title)
    await refresh()
  }, [refresh])

  const updateLayout = useCallback(async (patch) => {
    if (!currentDocIdRef.current) return null
    await flush()
    const updated = await updateDocumentLayout(currentDocIdRef.current, patch)
    await refresh()
    return updated
  }, [flush, refresh])

  const importBackup = useCallback(async (file, { flushPending = true } = {}) => {
    if (flushPending) await flush()
    const result = await importHistoryZip(file)
    await refresh()
    return result
  }, [flush, refresh])

  const restoreSnapshot = useCallback(async (
    documentId,
    snapshotContent,
    { flushPending = true } = {}
  ) => {
    if (!documentId || snapshotContent == null) return false
    if (flushPending && documentId === currentDocIdRef.current) await flush()
    const target = await getDocument(documentId)
    if (!target) return false

    // The current target content must be recoverable before replacement.
    if (target.content !== snapshotContent) {
      await maybeCreateSnapshot(documentId, target.content, { force: true })
    }
    const updated = await updateDocument(documentId, snapshotContent)
    if (!updated) return false
    setCurrentDocId(documentId)
    setMarkdown(snapshotContent)
    lastSavedRef.current = snapshotContent
    setSaveError('')
    setSaveState('saved')
    await refresh()
    return true
  }, [flush, refresh, setMarkdown, setSaveState])

  return {
    supported,
    saveStatus,
    saveError,
    currentDocId,
    currentDoc,
    docs,
    refresh,
    flush,
    openDoc,
    detachSession,
    newDoc,
    forkDocument,
    deleteDoc,
    togglePin,
    rename,
    updateLayout,
    importBackup,
    restoreSnapshot,
    DEFAULT_LAYOUT,
  }
}
