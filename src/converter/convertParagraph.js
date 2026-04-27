import { Paragraph } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { convertInlineNodes } from './convertInline.js'

export function convertParagraph(node) {
  const cfg = wordStyleConfig.paragraph
  const runs = convertInlineNodes(node.children)

  return new Paragraph({
    children: runs,
    spacing: { after: cfg.spacingAfter, line: cfg.lineSpacing },
  })
}
