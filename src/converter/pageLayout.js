import {
  Header, Footer, Paragraph, TextRun, PageNumber, AlignmentType,
  PageOrientation,
} from 'docx'

// Page sizes in twips (1/20 of a point)
export const PAGE_SIZES = {
  a4:     { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
  a3:     { width: 16838, height: 23811 },
}

// Keep the physical page mapping in twips. The docx package applies the
// landscape swap when it serializes w:pgSz, so callers must pass these values
// in their portrait/base order.
export const PAGE_MARGINS = {
  top: 1440,
  right: 1440,
  bottom: 1440,
  left: 1440,
  header: 708,
  footer: 708,
  gutter: 0,
}

const PX_PER_TWIP = 96 / 1440

const ORIENTATION_MAP = {
  portrait: PageOrientation.PORTRAIT,
  landscape: PageOrientation.LANDSCAPE,
}

function expandTokens(text, ctx) {
  if (!text) return ''
  return text
    .replace(/\{title\}/gi, ctx.title || '')
    .replace(/\{date\}/gi, ctx.date || '')
}

function buildHeaderFooterRun(template, ctx) {
  if (!template) return null
  const expanded = expandTokens(template, ctx)
  const runs = []
  // Split by {page} / {total} so we can interpolate page-number fields
  const parts = expanded.split(/(\{page\}|\{total\})/gi)
  for (const part of parts) {
    if (!part) continue
    const lower = part.toLowerCase()
    if (lower === '{page}') {
      runs.push(new TextRun({ children: [PageNumber.CURRENT], size: 18 }))
    } else if (lower === '{total}') {
      runs.push(new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }))
    } else {
      runs.push(new TextRun({ text: part, size: 18 }))
    }
  }
  return runs
}

export function buildPageHeader({ headerText, title }) {
  if (!headerText) return null
  const runs = buildHeaderFooterRun(headerText, { title, date: new Date().toLocaleDateString() })
  return new Header({
    children: [new Paragraph({
      children: runs,
      alignment: AlignmentType.LEFT,
    })],
  })
}

export function buildPageFooter({ footerText, showPageNumbers, title }) {
  const runs = []
  const ctx = { title, date: new Date().toLocaleDateString() }

  if (footerText) {
    runs.push(...buildHeaderFooterRun(footerText, ctx))
  }

  if (showPageNumbers) {
    if (runs.length) runs.push(new TextRun({ text: '   ', size: 18 }))
    runs.push(new TextRun({ text: 'Page ', size: 18 }))
    runs.push(new TextRun({ children: [PageNumber.CURRENT], size: 18 }))
    runs.push(new TextRun({ text: ' of ', size: 18 }))
    runs.push(new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }))
  }

  if (runs.length === 0) return null

  return new Footer({
    children: [new Paragraph({
      children: runs,
      alignment: AlignmentType.CENTER,
    })],
  })
}

export function getPageDimensions({ pageSize = 'a4', orientation = 'portrait' } = {}) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.a4
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width }
  }
  return { width: size.width, height: size.height }
}

export function getWritablePageWidthPx(options = {}) {
  const { width } = getPageDimensions(options)
  const writableTwips = Math.max(1, width - PAGE_MARGINS.left - PAGE_MARGINS.right)
  return Math.round(writableTwips * PX_PER_TWIP)
}

export function buildPageProps({ pageSize = 'a4', orientation = 'portrait' }) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.a4
  return {
    page: {
      size: {
        width: size.width,
        height: size.height,
        orientation: ORIENTATION_MAP[orientation] || PageOrientation.PORTRAIT,
      },
      margin: PAGE_MARGINS,
    },
  }
}
