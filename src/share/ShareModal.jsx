import React, { useState, useMemo, useRef, useEffect } from 'react'
import { encodeShareUrl, copyToClipboard, hasLocalImageReferences } from './shareLink.js'
import QRCodeView from './QRCodeView.jsx'
import { shortenUrl } from './shortenerService.js'
import { RESOURCE_LIMITS } from '../limits/resourceLimits.js'
import { useModalA11y } from '../accessibility/useModalA11y.js'

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
  const [copyError, setCopyError] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const inputRef = useRef(null)
  const shortenRequestRef = useRef({ id: 0, controller: null })
  const modalRef = useModalA11y(onClose)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(previewOnly))
    } catch {}
  }, [previewOnly])

  const shareResult = useMemo(() => {
    try {
      return { url: encodeShareUrl(markdown, previewOnly), error: null }
    } catch (err) {
      return { url: '', error: err?.message || 'Could not create a share link.' }
    }
  }, [markdown, previewOnly])
  const longUrl = shareResult.url

  // Reset short URL when long URL changes (preview-only toggle, content edit)
  useEffect(() => {
    shortenRequestRef.current.controller?.abort()
    shortenRequestRef.current = { id: shortenRequestRef.current.id + 1, controller: null }
    setShortening(false)
    setShortUrl(null)
    setShortError(null)
    setCopyError(null)
  }, [longUrl])

  useEffect(() => () => shortenRequestRef.current.controller?.abort(), [])

  const displayUrl = shortUrl || longUrl
  const encodingError = shareResult.error
  const tooLong = longUrl.length > RESOURCE_LIMITS.shareUrlCharacters
  const tooLongForQr = !displayUrl || displayUrl.length > RESOURCE_LIMITS.qrUrlCharacters
  const tooLongForShortener = Boolean(encodingError) || longUrl.length > 6000
  const hasLocalImages = hasLocalImageReferences(markdown)

  async function handleCopy() {
    if (!displayUrl) return
    const ok = await copyToClipboard(displayUrl)
    if (ok) {
      setCopyError(null)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopyError('Could not copy the link. Select it and copy manually.')
    }
  }

  async function handleShorten() {
    if (shortening || tooLongForShortener) return
    const id = shortenRequestRef.current.id + 1
    const controller = new AbortController()
    shortenRequestRef.current = { id, controller }
    setShortening(true)
    setShortError(null)
    try {
      const result = await shortenUrl(longUrl, { signal: controller.signal })
      if (shortenRequestRef.current.id === id) setShortUrl(result)
    } catch (err) {
      if (shortenRequestRef.current.id === id) {
        setShortError(err?.message || 'Failed to shorten URL')
      }
    } finally {
      if (shortenRequestRef.current.id === id) {
        shortenRequestRef.current.controller = null
        setShortening(false)
      }
    }
  }

  function handleSelect() {
    inputRef.current?.select()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal share-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Share Markdown"
        onClick={(e) => e.stopPropagation()}
      >
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

          {encodingError && (
            <div className="modal-warn">{encodingError}</div>
          )}

          {tooLong && !shortUrl && !encodingError && (
            <div className="modal-warn">
              ⚠ URL is very long ({longUrl.length} chars). Some messaging apps may
              truncate it when pasted. Consider shortening your Markdown.
            </div>
          )}

          {hasLocalImages && (
            <div className="modal-warn">
              ⚠ This text-only link does not include local images. Use History → Import Backup for a portable copy with assets.
            </div>
          )}

          {shortError && (
            <div className="modal-warn">⚠ {shortError}</div>
          )}

          {copyError && (
            <div className="modal-warn">{copyError}</div>
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
              disabled={tooLongForQr}
              title={tooLongForQr ? 'URL is too long for a QR code' : 'Show QR code'}
            >
              {tooLongForQr ? 'QR unavailable for this link' : (showQr ? 'Hide QR' : 'Show QR Code')}
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

          {showQr && !tooLongForQr && <QRCodeView url={displayUrl} />}

          <div className="modal-actions">
            <button className="btn-primary" onClick={handleCopy} disabled={!displayUrl}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
