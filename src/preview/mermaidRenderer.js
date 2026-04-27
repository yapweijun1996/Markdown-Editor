// Lazy-loaded Mermaid diagram renderer.

let mermaidLib = null
let pending = null

async function loadMermaid() {
  if (mermaidLib) return mermaidLib
  if (pending) return pending
  pending = (async () => {
    const mod = await import('mermaid')
    const m = mod.default || mod
    m.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
    mermaidLib = m
    return m
  })().finally(() => { pending = null })
  return pending
}

let counter = 0
export async function renderMermaidToSvg(code, idHint = '') {
  const mermaid = await loadMermaid()
  const id = `mermaid-${idHint || counter++}-${Date.now().toString(36)}`
  try {
    const { svg } = await mermaid.render(id, code)
    return { svg, error: null }
  } catch (err) {
    return { svg: null, error: err?.message || String(err) }
  }
}

// Hydrate <code class="language-mermaid"> blocks into SVG diagrams.
// Run after the preview HTML is committed to the DOM.
export async function hydrateMermaidBlocks(rootEl) {
  if (!rootEl) return
  const blocks = rootEl.querySelectorAll('pre > code.language-mermaid')
  if (blocks.length === 0) return
  for (const codeEl of blocks) {
    const pre = codeEl.parentElement
    if (!pre || pre.dataset.mermaidRendered === '1') continue
    pre.dataset.mermaidRendered = '1'

    const source = codeEl.textContent || ''
    const wrapper = document.createElement('div')
    wrapper.className = 'mermaid-block'
    pre.replaceWith(wrapper)

    const { svg, error } = await renderMermaidToSvg(source)
    if (error) {
      wrapper.innerHTML =
        `<div class="mermaid-error">Mermaid error: ${error.replace(/</g, '&lt;')}</div>`
    } else {
      wrapper.innerHTML = svg
    }
  }
}
