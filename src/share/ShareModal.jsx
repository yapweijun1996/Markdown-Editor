import React, { useState, useMemo, useRef } from 'react'
import { encodeShareUrl, copyToClipboard } from './shareLink.js'

export default function ShareModal({ markdown, onClose }) {
  const [previewOnly, setPreviewOnly] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const url = useMemo(
    () => encodeShareUrl(markdown, previewOnly),
    [markdown, previewOnly]
  )

  const tooLong = url.length > 8000

  async function handleCopy() {
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleSelect() {
    inputRef.current?.select()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Share Markdown</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={previewOnly}
              onChange={(e) => setPreviewOnly(e.target.checked)}
            />
            Preview only mode (recipient cannot edit)
          </label>

          <div className="modal-label">Share URL ({url.length} chars)</div>
          <input
            ref={inputRef}
            className="modal-url"
            type="text"
            value={url}
            readOnly
            onFocus={handleSelect}
          />

          {tooLong && (
            <div className="modal-warn">
              ⚠ URL is very long ({url.length} chars). Some browsers/messaging
              apps may truncate it. Consider shortening your Markdown.
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-primary" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
