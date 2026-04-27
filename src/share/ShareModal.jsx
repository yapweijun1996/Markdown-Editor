import React, { useState, useMemo, useRef, useEffect } from 'react'
import { encodeShareUrl, copyToClipboard } from './shareLink.js'
import QRCodeView from './QRCodeView.jsx'
import { shortenUrl } from './shortenerService.js'

const STORAGE_KEY = 'share.previewOnly'

function readPreviewOnlyPref() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === null) return true
    return v === 'true'
  } catch {
    return true
  }
}

export default function ShareModal({ markdown, onClose }) {
  const [previewOnly, setPreviewOnly] = useState(readPreviewOnlyPref)
  const [copied, setCopied] = useState(false)
  const [shortUrl, setShortUrl] = useState(null)
  const [shortening, setShortening] = useState(false)
  const [shortError, setShortError] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(previewOnly))
    } catch {}
  }, [previewOnly])

  const longUrl = useMemo(
    () => encodeShareUrl(markdown, previewOnly),
    [markdown, previewOnly]
  )

  // Reset short URL when long URL changes (preview-only toggle, content edit)
  useEffect(() => {
    setShortUrl(null)
    setShortError(null)
  }, [longUrl])

  const displayUrl = shortUrl || longUrl
  const tooLong = longUrl.length > 50000
  const tooLongForShortener = longUrl.length > 6000

  async function handleCopy() {
    const ok = await copyToClipboard(displayUrl)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleShorten() {
    if (shortening || tooLongForShortener) return
    setShortening(true)
    setShortError(null)
    try {
      const result = await shortenUrl(longUrl)
      setShortUrl(result)
    } catch (err) {
      setShortError(err?.message || 'Failed to shorten URL')
    } finally {
      setShortening(false)
    }
  }

  function handleSelect() {
    inputRef.current?.select()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
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

          <div className="modal-label">
            {shortUrl ? `Short URL (${displayUrl.length} chars)` : `Share URL (${displayUrl.length} chars)`}
          </div>
          <input
            ref={inputRef}
            className="modal-url"
            type="text"
            value={displayUrl}
            readOnly
            onFocus={handleSelect}
          />

          {tooLong && !shortUrl && (
            <div className="modal-warn">
              ⚠ URL is very long ({longUrl.length} chars). Some messaging apps may
              truncate it when pasted. Consider shortening your Markdown.
            </div>
          )}

          {shortError && (
            <div className="modal-warn">⚠ {shortError}</div>
          )}

          {shortUrl && (
            <div className="modal-info">
              ✓ Shortened via TinyURL. Original {longUrl.length} → {displayUrl.length} chars.
            </div>
          )}

          <div className="share-secondary-actions">
            <button
              className="share-secondary-btn"
              onClick={() => setShowQr((v) => !v)}
            >
              {showQr ? 'Hide QR' : 'Show QR Code'}
            </button>
            {!shortUrl && (
              <button
                className="share-secondary-btn"
                onClick={handleShorten}
                disabled={shortening || tooLongForShortener}
                title={
                  tooLongForShortener
                    ? 'URL too long for TinyURL'
                    : 'Sends URL to tinyurl.com'
                }
              >
                {shortening ? 'Shortening…' : 'Shorten URL (TinyURL)'}
              </button>
            )}
          </div>

          {showQr && <QRCodeView url={displayUrl} />}

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
