import React, { useRef, useState } from 'react'
import { batchConvertToZip, createBatchEntry } from './batchProcess.js'
import { useModalA11y } from '../accessibility/useModalA11y.js'

function isMarkdownFile(file) {
  return file && /\.md$/i.test(file.name)
}

function fileSignature(file) {
  return [file.name, file.size, file.lastModified, file.webkitRelativePath || ''].join(':')
}

const STATUS_ICON = {
  queued: '○',
  processing: '⏳',
  done: '✓',
  error: '✗',
  cancelled: '–',
}

export default function BatchConvertSheet({ onClose }) {
  const [files, setFiles] = useState([])
  const [statuses, setStatuses] = useState({})
  const [errors, setErrors] = useState({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [batchIds, setBatchIds] = useState([])
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const modalRef = useModalA11y(running ? () => {} : onClose)

  function addFiles(fileList) {
    if (running) return
    const incoming = [...(fileList || [])].filter(isMarkdownFile)
    if (incoming.length === 0) return
    const incomingEntries = incoming.map(createBatchEntry)
    setFiles((prev) => {
      const seen = new Set(prev.map(({ file }) => fileSignature(file)))
      const next = [...prev]
      for (const entry of incomingEntries) {
        const key = fileSignature(entry.file)
        if (!seen.has(key)) {
          next.push(entry)
          seen.add(key)
        }
      }
      return next
    })
    const newStatus = {}
    incomingEntries.forEach((entry) => { newStatus[entry.id] = 'queued' })
    setStatuses((prev) => ({ ...prev, ...newStatus }))
    setBatchIds([])
    setResult(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function handleSelectClick() {
    inputRef.current?.click()
  }

  function handleFileChange(e) {
    addFiles(e.target.files)
    e.target.value = ''
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((entry) => entry.id !== id))
    setStatuses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setBatchIds((prev) => prev.filter((entryId) => entryId !== id))
  }

  async function runBatch(batch) {
    if (batch.length === 0 || running) return
    const controller = new AbortController()
    abortRef.current = controller
    setBatchIds(batch.map((entry) => entry.id))
    setRunning(true)
    setResult(null)
    setErrors({})

    try {
      const res = await batchConvertToZip({
        files: batch,
        signal: controller.signal,
        onProgress: ({ fileId, status }) => {
          setStatuses((prev) => ({ ...prev, [fileId]: status }))
        },
        onError: ({ fileId, error }) => {
          setErrors((prev) => ({ ...prev, [fileId]: error }))
        },
      })
      setResult(res)
    } catch (err) {
      if (controller.signal.aborted) {
        setStatuses((prev) => {
          const next = { ...prev }
          batch.forEach((entry) => { next[entry.id] = 'cancelled' })
          return next
        })
      }
      setResult({
        cancelled: controller.signal.aborted,
        done: 0,
        errored: batch.length,
        total: batch.length,
        error: err.message,
      })
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setRunning(false)
    }
  }

  function handleStart() {
    runBatch(files.slice())
  }

  function handleRetry() {
    runBatch(files.filter((entry) => statuses[entry.id] === 'error'))
  }

  function handleCancel() {
    abortRef.current?.abort()
  }

  const batchStatuses = batchIds.map((id) => statuses[id])
  const doneCount = batchStatuses.filter((status) => status === 'done').length
  const errorCount = batchStatuses.filter((status) => status === 'error').length
  const cancelledCount = batchStatuses.filter((status) => status === 'cancelled').length
  const progress = batchIds.length === 0
    ? 0
    : Math.round(((doneCount + errorCount + cancelledCount) / batchIds.length) * 100)

  return (
    <div className="modal-backdrop" onClick={running ? undefined : onClose}>
      <div
        ref={modalRef}
        className="modal batch-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Batch Convert"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span>Batch Convert</span>
          <button className="modal-close" onClick={onClose} disabled={running}>×</button>
        </div>

        <div className="modal-body batch-body">
          <div
            className="batch-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="batch-drop-text">
              Drop <code>.md</code> files here, or
            </div>
            <button className="batch-select-btn" onClick={handleSelectClick} disabled={running}>
              Select Files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              multiple
              style={{ display: 'none' }}
              disabled={running}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <>
              <div className="batch-progress">
                <div className="batch-progress-text">
                  {running
                    ? `Processing ${doneCount + errorCount} / ${files.length}…`
                    : `${files.length} file${files.length === 1 ? '' : 's'} ready`}
                  {errorCount > 0 && <span className="batch-errors"> · {errorCount} failed</span>}
                </div>
                <div className="batch-progress-bar">
                  <div className="batch-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="batch-file-list">
                {files.map((entry) => {
                  const { file } = entry
                  const status = statuses[entry.id] || 'queued'
                  return (
                    <div key={entry.id} className={`batch-file batch-file-${status}`}>
                      <span className="batch-file-status" aria-hidden="true">
                        {STATUS_ICON[status] || '○'}
                      </span>
                      <span className="batch-file-name">{file.name}</span>
                      {status === 'error' && (
                        <span className="batch-file-error">{errors[entry.id]}</span>
                      )}
                      {!running && status !== 'done' && (
                        <button
                          className="batch-file-remove"
                          onClick={() => removeFile(entry.id)}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {result && !running && (
            <div className={`batch-result ${result.done > 0 ? 'success' : 'error'}`}>
              {result.cancelled
                ? `– Cancelled: ${result.done} of ${result.total} converted`
                : result.done > 0
                ? `✓ ZIP downloaded: ${result.done} of ${result.total} converted`
                : `✗ Failed: ${result.error || 'all files failed'}`}
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose} disabled={running}>Close</button>
            {running && <button onClick={handleCancel}>Cancel</button>}
            {!running && errorCount > 0 && (
              <button onClick={handleRetry}>Retry failed</button>
            )}
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={running || files.length === 0}
            >
              {running ? 'Converting…' : `Convert ${files.length || ''} → ZIP`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
