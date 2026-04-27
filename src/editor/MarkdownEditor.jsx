import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import {
  pickImageFromClipboard,
  pickImagesFromFileList,
  buildImageMarkdown,
  insertAtCursor,
} from '../images/insertImage.js'

const MarkdownEditor = forwardRef(function MarkdownEditor(
  { value, onChange, onInsertImageBlob },
  ref
) {
  const taRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useImperativeHandle(ref, () => ({
    insertText(text) {
      const next = insertAtCursor(taRef.current, text)
      onChange(next)
    },
    focus() { taRef.current?.focus() },
  }))

  async function handleImageBlobs(blobs) {
    if (!onInsertImageBlob) return
    for (const blob of blobs) {
      const uri = await onInsertImageBlob(blob, blob.name)
      if (uri) {
        const md = buildImageMarkdown(uri, '')
        const next = insertAtCursor(taRef.current, md)
        onChange(next)
      }
    }
  }

  async function handlePaste(e) {
    const file = pickImageFromClipboard(e.clipboardData)
    if (file) {
      e.preventDefault()
      await handleImageBlobs([file])
    }
  }

  function handleDragOver(e) {
    if (!e.dataTransfer?.types?.includes('Files')) return
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    setDragging(false)
  }

  async function handleDrop(e) {
    setDragging(false)
    const images = pickImagesFromFileList(e.dataTransfer?.files)
    if (images.length === 0) return
    e.preventDefault()
    await handleImageBlobs(images)
  }

  return (
    <div
      className={`panel editor-panel ${dragging ? 'editor-dragging' : ''}`}
      data-panel="editor"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="panel-label">Markdown Editor</div>
      <textarea
        ref={taRef}
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Write your Markdown here…  (paste or drag images to embed)"
        spellCheck={false}
        aria-label="Markdown editor"
      />
      {dragging && (
        <div className="editor-drop-overlay" aria-hidden="true">
          <div className="editor-drop-message">Drop image to insert</div>
        </div>
      )}
    </div>
  )
})

export default MarkdownEditor
