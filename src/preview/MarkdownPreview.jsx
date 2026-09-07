import React, { useEffect, useMemo, useRef, useState } from 'react'
import MarkdownIt from 'markdown-it'
import {
  isInternalImageUri,
  getObjectUrl,
  imageIdFromUri,
  isImageLoadFailed,
  preloadFromMarkdown,
  subscribe,
} from '../images/imageCache.js'
import { renderMathInHtml, markdownHasMath } from './mathRenderer.js'
import { hydrateMermaidBlocks } from './mermaidRenderer.js'
import { escapeHtml } from './htmlEscape.js'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})

const passThrough = (tokens, idx, options, env, self) =>
  self.renderToken(tokens, idx, options)

const baseTableOpen = md.renderer.rules.table_open || passThrough
const baseTableClose = md.renderer.rules.table_close || passThrough

md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
  '<div class="table-wrap">' + baseTableOpen(tokens, idx, options, env, self)

md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
  baseTableClose(tokens, idx, options, env, self) + '</div>'

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

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet('src')
  if (isInternalImageUri(src)) {
    const id = imageIdFromUri(src)
    const objectUrl = getObjectUrl(id)
    if (objectUrl) {
      token.attrSet('src', objectUrl)
    } else {
      token.attrSet('src', '')
      token.attrSet('data-pending', '1')
      const alt = token.content || ''
      if (isImageLoadFailed(id)) {
        const label = alt || 'Image unavailable'
        return `<span class="image-error" role="img" aria-label="${escapeHtml(label)}">Image unavailable: ${escapeHtml(label)}</span>`
      }
      return `<span class="image-loading" aria-label="Loading image">${escapeHtml(alt || 'Loading image…')}</span>`
    }
  }
  return self.renderToken(tokens, idx, options)
}

// Tag mermaid code fences with a class so we can hydrate them after render
const baseFence = md.renderer.rules.fence || passThrough
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = (token.info || '').trim().toLowerCase()
  if (info === 'mermaid') {
    const code = token.content
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre><code class="language-mermaid">${escaped}</code></pre>`
  }
  return baseFence(tokens, idx, options, env, self)
}

export default function MarkdownPreview({ markdown }) {
  const [renderedHtml, setRenderedHtml] = useState('')
  const [imageRevision, setImageRevision] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => subscribe(() => setImageRevision((revision) => revision + 1)), [])

  useEffect(() => {
    preloadFromMarkdown(markdown).catch(() => {})
  }, [markdown])

  // Render markdown synchronously, then async post-process math
  const baseHtml = useMemo(
    () => md.render(markdown || ''),
    [imageRevision, markdown]
  )

  useEffect(() => {
    let cancelled = false
    setRenderedHtml(baseHtml)
    if (markdownHasMath(markdown)) {
      renderMathInHtml(baseHtml)
        .then((html) => {
          if (!cancelled) setRenderedHtml(html)
        })
        .catch(() => {
          if (!cancelled) setRenderedHtml(baseHtml)
        })
    }
    return () => { cancelled = true }
  }, [baseHtml, markdown])

  // After HTML lands in DOM, hydrate mermaid blocks
  useEffect(() => {
    let cancelled = false
    hydrateMermaidBlocks(containerRef.current, { isCancelled: () => cancelled }).catch(() => {})
    return () => { cancelled = true }
  }, [renderedHtml])

  return (
    <div className="panel preview-panel" data-panel="preview">
      <div className="panel-label">Preview</div>
      <div
        ref={containerRef}
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        aria-label="Markdown preview"
      />
    </div>
  )
}
