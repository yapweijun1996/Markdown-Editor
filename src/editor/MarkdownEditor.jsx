import React from 'react'

export default function MarkdownEditor({ value, onChange }) {
  return (
    <div className="panel editor-panel">
      <div className="panel-label">Markdown Editor</div>
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your Markdown here..."
        spellCheck={false}
        aria-label="Markdown editor"
      />
    </div>
  )
}
