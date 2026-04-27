import React, { useState, useMemo } from 'react'
import { formatRelativeTime } from '../preferences/draftStorage.js'

const PinIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

function previewSnippet(content) {
  if (!content) return ''
  const cleaned = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return cleaned.slice(0, 140)
}

export default function HistoryPanel({
  docs,
  currentDocId,
  supported,
  onOpen,
  onNew,
  onDelete,
  onPin,
  onRename,
  onClose,
}) {
  const [query, setQuery] = useState('')
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
    )
  }, [docs, query])

  function startRename(doc) {
    setRenameTarget(doc.id)
    setRenameValue(doc.title)
  }
  function commitRename() {
    if (renameTarget) onRename(renameTarget, renameValue)
    setRenameTarget(null)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>History</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="history-toolbar">
          <input
            type="search"
            className="history-search"
            placeholder="Search title or content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="history-new-btn"
            onClick={() => { onNew(); onClose() }}
            title="New document"
          >
            <PlusIcon /> New
          </button>
        </div>

        {!supported ? (
          <div className="history-empty">
            <p>History storage is unavailable in this browser.</p>
            <p className="history-empty-hint">
              Your data may be locked, in private browsing, or storage is full.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty">
            {query ? (
              <p>No documents match "{query}"</p>
            ) : (
              <>
                <p>No saved documents yet.</p>
                <p className="history-empty-hint">
                  Start typing — your work auto-saves here every few seconds.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="history-list">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className={`history-item ${doc.id === currentDocId ? 'active' : ''}`}
              >
                <button
                  className="history-item-main"
                  onClick={() => { onOpen(doc.id); onClose() }}
                >
                  <div className="history-item-row1">
                    {doc.pinned ? <span className="history-pin"><PinIcon filled /></span> : null}
                    {renameTarget === doc.id ? (
                      <input
                        className="history-rename-input"
                        value={renameValue}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setRenameTarget(null)
                        }}
                      />
                    ) : (
                      <span className="history-title">{doc.title}</span>
                    )}
                    <span className="history-time">{formatRelativeTime(doc.updatedAt)}</span>
                  </div>
                  <div className="history-snippet">{previewSnippet(doc.content)}</div>
                  <div className="history-meta">
                    {doc.wordCount} word{doc.wordCount === 1 ? '' : 's'}
                    {doc.id === currentDocId && <span className="history-current-tag"> · current</span>}
                  </div>
                </button>

                <div className="history-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn-mini"
                    onClick={() => onPin(doc.id)}
                    aria-label={doc.pinned ? 'Unpin' : 'Pin'}
                    title={doc.pinned ? 'Unpin' : 'Pin'}
                  >
                    <PinIcon filled={!!doc.pinned} />
                  </button>
                  <button
                    className="icon-btn-mini"
                    onClick={() => startRename(doc)}
                    aria-label="Rename"
                    title="Rename"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="icon-btn-mini danger"
                    onClick={() => {
                      if (confirm(`Delete "${doc.title}"?`)) onDelete(doc.id)
                    }}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
