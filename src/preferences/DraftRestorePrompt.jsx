import React from 'react'
import { formatRelativeTime } from './draftStorage.js'

export default function DraftRestorePrompt({ draft, onRestore, onDiscard }) {
  if (!draft) return null

  const preview = draft.content.slice(0, 80).replace(/\n/g, ' ')

  return (
    <div className="draft-prompt" role="alert">
      <div className="draft-prompt-text">
        <strong>Unsaved draft from {formatRelativeTime(draft.savedAt)}</strong>
        <span className="draft-prompt-preview">{preview}…</span>
      </div>
      <div className="draft-prompt-actions">
        <button className="draft-btn-primary" onClick={onRestore}>
          Restore
        </button>
        <button onClick={onDiscard}>Discard</button>
      </div>
    </div>
  )
}
