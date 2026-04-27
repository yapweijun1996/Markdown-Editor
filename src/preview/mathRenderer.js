// Lazy-loaded KaTeX renderer with simple post-processing of HTML.
// Block math:  $$...$$ on its own paragraph
// Inline math: $...$  inside text (not preceded by backslash)

let katexLib = null
let cssInjected = false
let pending = null

async function loadKatex() {
  if (katexLib) return katexLib
  if (pending) return pending
  pending = (async () => {
    if (!cssInjected) {
      await import('katex/dist/katex.min.css')
      cssInjected = true
    }
    const mod = await import('katex')
    katexLib = mod.default || mod
    return katexLib
  })().finally(() => { pending = null })
  return pending
}

const HAS_MATH_RE = /(?:^|[^\\])\$\$?[^\n$]/m
export function markdownHasMath(markdown) {
  if (!markdown) return false
  return HAS_MATH_RE.test(markdown)
}

function htmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function safeRender(katex, source, displayMode) {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'html',
    })
  } catch (err) {
    return `<span class="math-error">${htmlEscape(`Math error: ${err.message || err}`)}</span>`
  }
}

export async function renderMathInHtml(html) {
  if (!html || !markdownHasMath(html)) return html
  const katex = await loadKatex()
  let out = html

  // Block math: <p>$$ ... $$</p> (markdown-it wraps in paragraph)
  out = out.replace(
    /<p>\s*\$\$([\s\S]+?)\$\$\s*<\/p>/g,
    (_, eq) => `<div class="math-block">${safeRender(katex, eq.trim(), true)}</div>`
  )

  // Inline math: $...$ but not $$...$$
  out = out.replace(
    /(^|[^\\$])\$([^$\n]+?)\$(?!\$)/g,
    (_, prefix, eq) => `${prefix}${safeRender(katex, eq, false)}`
  )

  return out
}
