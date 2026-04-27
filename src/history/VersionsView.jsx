import React, { useEffect, useState } from 'react'
import { listSnapshots, deleteSnapshot } from './snapshotRepo.js'
import { formatRelativeTime } from '../preferences/draftStorage.js'

function previewSnippet(content) {
  if (!content) return ''
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 160)
}

export default function VersionsView({ doc, onRestore, onClose }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listSnapshots(doc.id)
      .then((s) => { if (!cancelled) { setSnapshots(s); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [doc.id])

  async function handleDelete(snap) {
    if (!confirm('Delete this snapshot?')) return
    await deleteSnapshot(snap.id)
    setSnapshots((arr) => arr.filter((s) => s.id !== snap.id))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal versions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Versions of "{doc.title}"</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="versions-body">
          <div className="versions-current">
            <div className="versions-current-label">Now</div>
            <div className="versions-current-meta">
              {doc.wordCount} word{doc.wordCount === 1 ? '' : 's'} ·
              updated {formatRelativeTime(doc.updatedAt)}
            </div>
          </div>

          {loading ? (
            <div className="history-empty"><p>Loading snapshots…</p></div>
          ) : snapshots.length === 0 ? (
            <div className="history-empty">
              <p>No snapshots yet</p>
              <p className="history-empty-hint">
                Snapshots are taken automatically every ~30 seconds when content changes.
              </p>
            </div>
          ) : (
            <ol className="versions-timeline">
              {snapshots.map((snap, i) => (
                <li key={snap.id} className="versions-item">
                  <div className="versions-dot" />
                  <div className="versions-content">
                    <div className="versions-row1">
                      <span className="versions-time">
                        {formatRelativeTime(snap.createdAt)}
                      </span>
                      <span className="versions-date">
                        {new Date(snap.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="versions-snippet">
                      {previewSnippet(snap.content)}
                    </div>
                    <div className="versions-actions">
                      <button
                        className="versions-restore"
                        onClick={() => {
                          if (confirm('Restore this version? The current content will be saved as a new snapshot first.')) {
                            onRestore(snap.content)
                            onClose()
                          }
                        }}
                      >
                        Restore
                      </button>
                      <button
                        className="versions-delete"
                        onClick={() => handleDelete(snap)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
