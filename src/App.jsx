import React, { useState, useEffect, useRef, useCallback } from 'react'
import MarkdownEditor from './editor/MarkdownEditor.jsx'
import MarkdownPreview from './preview/MarkdownPreview.jsx'
import ShareModal from './share/ShareModal.jsx'
import UpdatePrompt from './pwa/UpdatePrompt.jsx'
import ThemeToggle from './theme/ThemeToggle.jsx'
import SettingsSheet from './preferences/SettingsSheet.jsx'
import DraftRestorePrompt from './preferences/DraftRestorePrompt.jsx'
import MoreMenu from './components/MoreMenu.jsx'
import DocumentLayoutSheet from './components/DocumentLayoutSheet.jsx'
import HistoryPanel from './history/HistoryPanel.jsx'
import BatchConvertSheet from './batch/BatchConvertSheet.jsx'
import { useTheme } from './theme/useTheme.js'
import { usePreferences } from './preferences/usePreferences.js'
import { readDraft, writeDraft, clearDraft } from './preferences/draftStorage.js'
import { useFileUpload } from './editor/useFileUpload.jsx'
import { useHistory } from './history/useHistory.js'
import { useImages } from './images/useImages.js'
import { downloadDocx } from './download/downloadDocx.js'
import { downloadPdf } from './download/downloadPdf.js'
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

/* ── Inline icons (Apple-style line icons) ───────── */
const Icon = {
  more: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.4" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
      <circle cx="19" cy="12" r="1.4" fill="currentColor"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  sample: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  read: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
      <polyline points="3 3 3 8 8 8"/>
      <polyline points="12 7 12 12 15 14"/>
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  newDoc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  layout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  pdf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  batch: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  ),
  clear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  export: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
}

export default function App() {
  useTheme()
  const { prefs, update, reset } = usePreferences()

  const [markdown, setMarkdown] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLayout, setShowLayout] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [mobileTab, setMobileTab] = useState('editor')
  const [draft, setDraft] = useState(null)
  const sharedLinkOpenedRef = useRef(false)

  const { input: fileInput, trigger: pickFile } = useFileUpload({
    onLoad: setMarkdown,
    onError: setError,
  })

  const history = useHistory({
    markdown,
    setMarkdown,
    paused: previewOnly || sharedLinkOpenedRef.current,
  })

  const images = useImages({
    markdown,
    documentId: history.currentDocId,
  })

  const editorRef = useRef(null)

  const handleInsertImageBlob = useCallback(async (blob, filename) => {
    try {
      return await images.insertBlob(blob, filename)
    } catch (err) {
      setError('Failed to insert image. Please try again.')
      return null
    }
  }, [images])

  // Image file picker (used by toolbar/More menu)
  const imagePickerRef = useRef(null)
  function openImagePicker() {
    imagePickerRef.current?.click()
  }
  async function handleImagePickerChange(e) {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    for (const file of files) {
      const uri = await handleInsertImageBlob(file, file.name)
      if (uri && editorRef.current) {
        editorRef.current.insertText(`![${file.name.replace(/\.[^.]+$/, '')}](${uri})`)
      }
    }
  }

  // First load: detect shared link or pending draft
  useEffect(() => {
    const shared = decodeShareUrl()
    if (shared) {
      sharedLinkOpenedRef.current = true
      setMarkdown(shared.markdown || '')
      setPreviewOnly(shared.previewOnly)
      if (!shared.previewOnly) setMobileTab('preview')
      return
    }

    // Try to restore current document from IndexedDB
    if (history.currentDocId) {
      history.openDoc(history.currentDocId)
      return
    }

    // Fallback to localStorage draft
    const existing = readDraft()
    if (existing) setDraft(existing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!prefs.draft.autoSave) return
    if (sharedLinkOpenedRef.current) return
    if (previewOnly) return

    const t = setTimeout(() => {
      writeDraft(markdown)
    }, prefs.draft.autoSaveInterval)
    return () => clearTimeout(t)
  }, [markdown, prefs.draft.autoSave, prefs.draft.autoSaveInterval, previewOnly])

  async function handleExport() {
    if (!markdown.trim()) {
      setError('Please enter Markdown content before exporting.')
      return
    }
    setError('')
    setStatus('Exporting...')
    try {
      const opts = history.currentDoc
        ? {
            templateId: history.currentDoc.templateId,
            layout: history.currentDoc.layout,
            docTitle: history.currentDoc.title,
            filename: `${(history.currentDoc.title || 'document').replace(/[\\/:*?"<>|]+/g, '-')}.docx`,
          }
        : {}
      await downloadDocx(markdown, opts)
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
    clearDraft()
    history.newDoc()
  }

  function handleNewDocument() {
    setStatus('')
    setError('')
    clearDraft()
    history.newDoc()
  }

  function handleLoadSample() {
    setMarkdown(SAMPLE_MARKDOWN)
    setStatus('')
    setError('')
  }

  function handleEditMode() {
    setPreviewOnly(false)
    sharedLinkOpenedRef.current = false
    const baseUrl = `${window.location.origin}${window.location.pathname}`
    window.history.replaceState({}, '', baseUrl)
  }

  function handleRestoreDraft() {
    if (draft) {
      setMarkdown(draft.content)
      setDraft(null)
    }
  }

  function handleDiscardDraft() {
    clearDraft()
    setDraft(null)
  }

  const hasContent = markdown.trim().length > 0

  // Build action list shared by More menu (mobile) and toolbar (desktop)
  const moreItems = [
    { label: 'New Document', icon: Icon.newDoc, onClick: handleNewDocument },
    { label: 'History', icon: Icon.history, onClick: () => setShowHistory(true) },
    {
      label: 'Document Layout',
      icon: Icon.layout,
      onClick: () => setShowLayout(true),
      disabled: !history.currentDoc,
    },
    {
      label: 'Export PDF',
      icon: Icon.pdf,
      onClick: () => downloadPdf(),
      disabled: !hasContent,
    },
    {
      label: 'Batch Convert',
      icon: Icon.batch,
      onClick: () => setShowBatch(true),
    },
    { label: 'Insert Image', icon: Icon.image, onClick: openImagePicker },
    { label: 'Upload .md', icon: Icon.upload, onClick: pickFile },
    { label: 'Load Sample', icon: Icon.sample, onClick: handleLoadSample },
    {
      label: 'Read Mode',
      icon: Icon.read,
      onClick: () => setPreviewOnly(true),
      disabled: !hasContent,
    },
    {
      label: 'Share Link',
      icon: Icon.share,
      onClick: () => setShowShare(true),
      disabled: !hasContent,
    },
    {
      label: 'Clear',
      icon: Icon.clear,
      onClick: handleClear,
      danger: true,
    },
    { type: 'separator' },
    { label: 'Settings', icon: Icon.settings, onClick: () => setShowSettings(true) },
  ]

  const workspaceClass = [
    'workspace',
    previewOnly ? 'workspace-preview-only' : '',
    !previewOnly ? `mobile-tab-${mobileTab}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="app"
      data-editor-fontsize={prefs.editor.fontSize}
      data-editor-fontfamily={prefs.editor.fontFamily}
      data-editor-lineheight={prefs.editor.lineHeight}
      data-editor-wordwrap={prefs.editor.wordWrap ? 'on' : 'off'}
    >
      {fileInput}
      <input
        ref={imagePickerRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImagePickerChange}
        aria-hidden="true"
      />

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
              {/* Desktop-only buttons */}
              <button className="hide-on-mobile" onClick={handleNewDocument}>New</button>
              <button className="hide-on-mobile" onClick={() => setShowHistory(true)}>History</button>
              <button className="hide-on-mobile" onClick={pickFile}>Upload</button>
              <button onClick={handleExport}>Export</button>
              <button
                className="hide-on-mobile"
                onClick={() => downloadPdf()}
                disabled={!hasContent}
                title="Print or save as PDF"
              >
                PDF
              </button>
              <button
                className="hide-on-mobile"
                onClick={() => setPreviewOnly(true)}
                disabled={!hasContent}
              >
                Read
              </button>
              <button
                className="hide-on-mobile"
                onClick={() => setShowShare(true)}
                disabled={!hasContent}
              >
                Share
              </button>
              <button className="hide-on-mobile" onClick={handleLoadSample}>Sample</button>
              <button className="hide-on-mobile" onClick={handleClear}>Clear</button>
              <button
                className="icon-btn hide-on-mobile"
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
                title="Settings"
              >
                {Icon.settings}
              </button>
              <ThemeToggle />

              {/* Mobile-only More menu trigger */}
              <button
                className="icon-btn show-on-mobile"
                onClick={() => setShowMore(true)}
                aria-label="More actions"
                title="More"
              >
                {Icon.more}
              </button>
            </>
          )}
        </div>
      </header>

      {draft && !previewOnly && (
        <DraftRestorePrompt
          draft={draft}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {error && <div className="error-bar">{error}</div>}
      {status && <div className="status-bar">{status}</div>}

      {!previewOnly && (
        <div className="mobile-tabs" role="tablist">
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
          <MarkdownEditor
            ref={editorRef}
            value={markdown}
            onChange={setMarkdown}
            onInsertImageBlob={handleInsertImageBlob}
          />
        )}
        <MarkdownPreview markdown={markdown} />
      </main>

      {showShare && (
        <ShareModal markdown={markdown} onClose={() => setShowShare(false)} />
      )}

      {showSettings && (
        <SettingsSheet
          prefs={prefs}
          update={update}
          reset={reset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showMore && (
        <MoreMenu items={moreItems} onClose={() => setShowMore(false)} />
      )}

      {showBatch && (
        <BatchConvertSheet onClose={() => setShowBatch(false)} />
      )}

      {showLayout && history.currentDoc && (
        <DocumentLayoutSheet
          doc={history.currentDoc}
          onUpdate={history.updateLayout}
          onClose={() => setShowLayout(false)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          docs={history.docs}
          currentDocId={history.currentDocId}
          supported={history.supported}
          onOpen={history.openDoc}
          onNew={handleNewDocument}
          onDelete={history.deleteDoc}
          onPin={history.togglePin}
          onRename={history.rename}
          onRestoreSnapshot={history.restoreSnapshot}
          onClose={() => setShowHistory(false)}
        />
      )}

      <UpdatePrompt />
    </div>
  )
}
