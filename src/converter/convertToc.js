import { Paragraph, TableOfContents, TextRun, HeadingLevel } from 'docx'

const TOC_REGEX_TEXT = /^\s*\[TOC\]\s*$/i
const TOC_REGEX_HTML = /<!--\s*TOC\s*-->/i

export function isTocPlaceholder(node) {
  if (!node) return false
  if (node.type === 'paragraph' && node.children?.length === 1) {
    const c = node.children[0]
    if (c.type === 'text' && TOC_REGEX_TEXT.test(c.value)) return true
  }
  if (node.type === 'html' && TOC_REGEX_HTML.test(node.value || '')) return true
  return false
}

export function buildTableOfContents() {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Table of Contents', bold: true })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-6',
        }),
      ],
    }),
  ]
}
