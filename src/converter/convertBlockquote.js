import { Paragraph, TextRun, BorderStyle } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { convertInlineNodes } from './convertInline.js'

export function convertBlockquote(node) {
  const cfg = wordStyleConfig.blockquote
  const paragraphs = []

  node.children.forEach((child) => {
    if (child.type === 'paragraph') {
      const runs = convertInlineNodes(child.children).map(
        (run) => new TextRun({ ...run.options, color: cfg.color, italics: cfg.italics })
      )

      paragraphs.push(
        new Paragraph({
          children: convertInlineNodes(child.children),
          indent: { left: cfg.indentLeft },
          border: {
            left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 8 },
          },
          spacing: { after: cfg.spacingAfter },
        })
      )
    }
  })

  return paragraphs
}
