import { Paragraph, TextRun, AlignmentType, PageBreak } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'

export function buildCoverPage(
  coverPage,
  cfg = defaultTemplate,
  { fallbackTitle = '', fallbackDate = '' } = {}
) {
  if (!coverPage || !coverPage.enabled) return []

  const fontFamily = cfg.document.font
  const title = coverPage.title || fallbackTitle
  const date = coverPage.date || fallbackDate

  const blocks = []

  // Big spacer at top
  blocks.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 2400 } }))

  if (title) {
    blocks.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({
        text: title,
        font: fontFamily,
        bold: true,
        size: 72, // 36pt
      })],
    }))
  }

  if (coverPage.subtitle) {
    blocks.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({
        text: coverPage.subtitle,
        font: fontFamily,
        size: 36, // 18pt
        color: '555555',
      })],
    }))
  }

  // Push author + date toward bottom
  blocks.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 4800 } }))

  if (coverPage.author) {
    blocks.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: coverPage.author,
        font: fontFamily,
        size: 28, // 14pt
      })],
    }))
  }

  if (date) {
    blocks.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: date,
        font: fontFamily,
        size: 24, // 12pt
        color: '777777',
      })],
    }))
  }

  // Force page break to start the document on next page
  blocks.push(new Paragraph({
    children: [new PageBreak()],
  }))

  return blocks
}
