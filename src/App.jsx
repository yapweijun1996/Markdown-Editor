import React, { useState, useEffect } from 'react'
import MarkdownEditor from './editor/MarkdownEditor.jsx'
import FileUploader from './editor/FileUploader.jsx'
import MarkdownPreview from './preview/MarkdownPreview.jsx'
import ShareModal from './share/ShareModal.jsx'
import UpdatePrompt from './pwa/UpdatePrompt.jsx'
import ThemeToggle from './theme/ThemeToggle.jsx'
import { useTheme } from './theme/useTheme.js'
import { downloadDocx } from './download/downloadDocx.js'
import { decodeShareUrl } from './share/shareLink.js'

const SAMPLE_MARKDOWN = `# Sample Document

## Introduction

This is a **sample** Markdown document with *italic* text and \`inline code\`.

## Features

- Bullet item one
- Bullet item two
- Bullet item three

## Numbered List

1. First step
2. Second step
3. Third step

## Code Block

\`\`\`js
console.log("Hello, World!");
\`\`\`

## Table

| Name     | Role      |
|----------|-----------|
| Wei Jun  | Developer |
| Alice    | Designer  |

## Blockquote

> This is an important note.

---

End of document.
`

export default function App() {
  // Initialize theme on first render
  useTheme()

  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [mobileTab, setMobileTab] = useState('editor')

  useEffect(() => {
    const shared = decodeShareUrl()
    if (shared) {
      setMarkdown(shared.markdown)
      setPreviewOnly(shared.previewOnly)
      if (!shared.previewOnly) setMobileTab('preview')
    }
  }, [])

  useEffect(() => {
    function onHashChange() {
      const shared = decodeShareUrl()
      if (shared) {
        setMarkdown(shared.markdown)
        setPreviewOnly(shared.previewOnly)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  async function handleExport() {
    if (!markdown.trim()) {
      setError('Please enter Markdown content before exporting.')
      return
    }
    setError('')
    setStatus('Exporting...')
    try {
      await downloadDocx(markdown)
      setStatus('Export successful!')
    } catch (err) {
      setError('Export failed. Please try again.')
      setStatus('')
    }
  }

  function handleClear() {
    setMarkdown('')
    setStatus('')
    setError('')
  }

  function handleLoadSample() {
    setMarkdown(SAMPLE_MARKDOWN)
    setStatus('')
    setError('')
  }

  function handleEditMode() {
    setPreviewOnly(false)
    const baseUrl = `${window.location.origin}${window.location.pathname}`
    window.history.replaceState({}, '', baseUrl)
  }

  const workspaceClass = [
    'workspace',
    previewOnly ? 'workspace-preview-only' : '',
    !previewOnly ? `mobile-tab-${mobileTab}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app">
      <header className="toolbar">
        <span className="toolbar-title">
          MD→Word
          {previewOnly && <span className="badge-readonly">PREVIEW</span>}
        </span>
        <div className="toolbar-actions">
          {previewOnly ? (
            <>
              <button onClick={handleExport}>Export</button>
              <button onClick={handleEditMode}>Edit</button>
              <ThemeToggle />
            </>
          ) : (
            <>
              <FileUploader onLoad={setMarkdown} onError={setError} />
              <button onClick={handleExport}>Export</button>
              <button onClick={() => setPreviewOnly(true)} disabled={!markdown.trim()}>
                Read
              </button>
              <button onClick={() => setShowShare(true)} disabled={!markdown.trim()}>
                Share
              </button>
              <button onClick={handleLoadSample}>Sample</button>
              <button onClick={handleClear}>Clear</button>
              <ThemeToggle />
            </>
          )}
        </div>
      </header>

      {error && <div className="error-bar">{error}</div>}
      {status && <div className="status-bar">{status}</div>}

      {!previewOnly && (
        <div className="mobile-tabs" role="tablist" aria-label="Switch between editor and preview">
          <button
            role="tab"
            aria-selected={mobileTab === 'editor'}
            className={mobileTab === 'editor' ? 'active' : ''}
            onClick={() => setMobileTab('editor')}
          >
            Editor
          </button>
          <button
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={mobileTab === 'preview' ? 'active' : ''}
            onClick={() => setMobileTab('preview')}
          >
            Preview
          </button>
        </div>
      )}

      <main className={workspaceClass}>
        {!previewOnly && (
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        )}
        <MarkdownPreview markdown={markdown} />
      </main>

      {showShare && (
        <ShareModal markdown={markdown} onClose={() => setShowShare(false)} />
      )}

      <UpdatePrompt />
    </div>
  )
}
