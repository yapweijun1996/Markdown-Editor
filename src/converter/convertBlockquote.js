import { Paragraph, BorderStyle, TextRun } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

export async function convertBlockquote(node, cfg = defaultTemplate, convertBlock) {
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
        children: await convertInlineNodes(child.children, inheritedRun, cfg),
        indent: { left: c.indentLeft },
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 8 } },
        spacing: { after: c.spacingAfter },
      }))
    } else if (convertBlock) {
      const blocks = await convertBlock(child)
      paragraphs.push(...blocks)
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text: `[Unsupported Markdown node: ${child.type}]`,
          italics: true,
          color: '888888',
        })],
      }))
    }
  }

  return paragraphs
}
