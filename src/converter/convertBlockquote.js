import { Paragraph, BorderStyle } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

export function convertBlockquote(node, cfg = defaultTemplate) {
  const c = cfg.blockquote
  const paragraphs = []

  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const inheritedRun = {
        color: c.color,
        italics: c.italics,
        size: c.fontSize,
      }
      paragraphs.push(new Paragraph({
        children: convertInlineNodes(child.children, inheritedRun, cfg),
        indent: { left: c.indentLeft },
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 8 } },
        spacing: { after: c.spacingAfter },
      }))
    }
  }

  return paragraphs
}
