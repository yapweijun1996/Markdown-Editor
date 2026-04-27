import React, { useRef, useState } from 'react'
import { batchConvertToZip } from './batchProcess.js'

function isMarkdownFile(file) {
  return file && /\.md$/i.test(file.name)
}

const STATUS_ICON = {
  queued: '○',
  processing: '⏳',
  done: '✓',
  error: '✗',
}

export default function BatchConvertSheet({ onClose }) {
  const [files, setFiles] = useState([])
  const [statuses, setStatuses] = useState({})
  const [errors, setErrors] = useState({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  function addFiles(fileList) {
    const incoming = [...(fileList || [])].filter(isMarkdownFile)
    if (incoming.length === 0) return
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + ':' + f.size))
      const next = [...prev]
      for (const f of incoming) {
        const key = f.name + ':' + f.size
        if (!seen.has(key)) {
          next.push(f)
          seen.add(key)
        }
      }
      return next
    })
    const newStatus = {}
    incoming.forEach((f) => { newStatus[f.name] = 'queued' })
    setStatuses((prev) => ({ ...prev, ...newStatus }))
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

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
    setStatuses((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  async function handleStart() {
    if (files.length === 0 || running) return
    setRunning(true)
    setResult(null)
    setErrors({})

    try {
      const res = await batchConvertToZip({
        files,
        onProgress: ({ current, status }) => {
          setStatuses((prev) => ({ ...prev, [current]: status }))
        },
        onError: ({ file, error }) => {
          setErrors((prev) => ({ ...prev, [file]: error }))
        },
      })
      setResult(res)
    } catch (err) {
      setResult({ done: 0, errored: files.length, total: files.length, error: err.message })
    } finally {
      setRunning(false)
    }
  }

  const doneCount = Object.values(statuses).filter((s) => s === 'done').length
  const errorCount = Object.values(statuses).filter((s) => s === 'error').length
  const progress = files.length === 0 ? 0 : Math.round(((doneCount + errorCount) / files.length) * 100)

  return (
    <div className="modal-backdrop" onClick={running ? undefined : onClose}>
      <div className="modal batch-modal" onClick={(e) => e.stopPropagation()}>
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
            <button className="batch-select-btn" onClick={handleSelectClick}>
              Select Files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              multiple
              style={{ display: 'none' }}
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
                {files.map((f) => {
                  const status = statuses[f.name] || 'queued'
                  return (
                    <div key={f.name} className={`batch-file batch-file-${status}`}>
                      <span className="batch-file-status" aria-hidden="true">
                        {STATUS_ICON[status] || '○'}
                      </span>
                      <span className="batch-file-name">{f.name}</span>
                      {status === 'error' && (
                        <span className="batch-file-error">{errors[f.name]}</span>
                      )}
                      {!running && status !== 'done' && (
                        <button
                          className="batch-file-remove"
                          onClick={() => removeFile(f.name)}
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
              {result.done > 0
                ? `✓ ZIP downloaded: ${result.done} of ${result.total} converted`
                : `✗ Failed: ${result.error || 'all files failed'}`}
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose} disabled={running}>Close</button>
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
