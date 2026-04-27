import React, { useMemo } from 'react'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})

// Wrap every table in a horizontally scrollable container
// so wide tables can scroll independently on mobile.
const passThrough = (tokens, idx, options, env, self) =>
  self.renderToken(tokens, idx, options)

const baseTableOpen = md.renderer.rules.table_open || passThrough
const baseTableClose = md.renderer.rules.table_close || passThrough

md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
  '<div class="table-wrap">' + baseTableOpen(tokens, idx, options, env, self)

md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
  baseTableClose(tokens, idx, options, env, self) + '</div>'

// External links open in new tab
const baseLinkOpen = md.renderer.rules.link_open || passThrough
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href')
  if (href && /^https?:\/\//i.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return baseLinkOpen(tokens, idx, options, env, self)
}

export default function MarkdownPreview({ markdown }) {
  const html = useMemo(() => md.render(markdown || ''), [markdown])

  return (
    <div className="panel preview-panel" data-panel="preview">
      <div className="panel-label">Preview</div>
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label="Markdown preview"
      />
    </div>
  )
}
