import React, { useMemo } from 'react'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export default function MarkdownPreview({ markdown }) {
  const html = useMemo(() => md.render(markdown || ''), [markdown])

  return (
    <div className="panel preview-panel">
      <div className="panel-label">Preview</div>
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label="Markdown preview"
      />
    </div>
  )
}
