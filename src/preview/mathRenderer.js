// Lazy-loaded KaTeX renderer with structure-aware HTML post-processing.

let katexLib = null
let cssInjected = false
let pending = null

async function loadKatex() {
  if (katexLib) return katexLib
  if (pending) return pending
  pending = (async () => {
    if (!cssInjected) {
      try {
        await import('katex/dist/katex.min.css')
      } catch {
        // Math HTML remains usable when a CSS asset is unavailable.
      }
      cssInjected = true
    }
    const mod = await import('katex')
    katexLib = mod.default || mod
    return katexLib
  })().finally(() => { pending = null })
  return pending
}

function htmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function containsMathText(text) {
  if (/\$\$(?!\$)[\s\S]+?\$\$/.test(text)) return true
  const inline = /(^|[^\\$])\$(?!\$|\s|\d)([^$\n]+?)\$(?!\$)/g
  let match
  while ((match = inline.exec(text))) {
    if (match[2].trim() && !/\s$/.test(match[2])) return true
  }
  return false
}

function stripMarkdownCode(markdown) {
  const lines = markdown.split('\n')
  const visible = []
  let fence = null

  for (const line of lines) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch) {
      fence = fenceMatch[1]
      continue
    }
    visible.push(line.replace(/(`+)[\s\S]*?\1/g, ''))
  }
  return visible.join('\n')
}

export function markdownHasMath(markdown) {
  return Boolean(markdown && containsMathText(stripMarkdownCode(markdown)))
}

function safeRender(katex, source, displayMode) {
  try {
    return katex.renderToString(decodeHtmlEntities(source), {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'html',
    })
  } catch (err) {
    return `<span class="math-error">${htmlEscape(`Math error: ${err.message || err}`)}</span>`
  }
}

function isProtectedTag(tag) {
  const name = tag.match(/^<\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase()
  if (['pre', 'code', 'script', 'style'].includes(name)) return true
  return /class\s*=\s*["'][^"']*(?:katex|math-block)[^"']*["']/i.test(tag)
}

function mapHtmlTextNodes(html, mapText) {
  const tagPattern = /<[^>]*>/g
  let output = ''
  let cursor = 0
  let protectedDepth = 0
  let match

  while ((match = tagPattern.exec(html))) {
    const text = html.slice(cursor, match.index)
    output += protectedDepth ? text : mapText(text)

    const tag = match[0]
    output += tag
    const closing = /^<\s*\/\s*([a-z0-9-]+)/i.test(tag)
    const selfClosing = /\/\s*>$/.test(tag)
    if (closing) {
      if (protectedDepth) protectedDepth -= 1
    } else if (!selfClosing && isProtectedTag(tag)) {
      protectedDepth += 1
    }
    cursor = match.index + tag.length
  }

  const tail = html.slice(cursor)
  output += protectedDepth ? tail : mapText(tail)
  return output
}

function htmlHasMath(html) {
  let found = false
  mapHtmlTextNodes(html, (text) => {
    if (containsMathText(text)) found = true
    return text
  })
  return found
}

function renderInlineMathText(text, katex) {
  const inline = /(^|[^\\$])\$(?!\$|\s|\d)([^$\n]+?)\$(?!\$)/g
  return text.replace(inline, (match, prefix, equation) => {
    if (!equation.trim() || /\s$/.test(equation)) return match
    return `${prefix}${safeRender(katex, equation, false)}`
  })
}

export async function renderMathInHtml(html) {
  if (!html || !htmlHasMath(html)) return html
  const katex = await loadKatex()

  let out = html.replace(
    /<p>\s*\$\$([\s\S]+?)\$\$\s*<\/p>/g,
    (_, equation) => `<div class="math-block">${safeRender(katex, equation.trim(), true)}</div>`
  )

  out = mapHtmlTextNodes(out, (text) => renderInlineMathText(text, katex))
  return out
}
