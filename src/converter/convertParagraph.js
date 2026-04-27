import { Paragraph, AlignmentType } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

const ALIGN_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justified: AlignmentType.JUSTIFIED,
  justify: AlignmentType.JUSTIFIED,
}

export function convertParagraph(node, cfg = defaultTemplate) {
  const c = cfg.paragraph
  const runs = convertInlineNodes(node.children, {}, cfg)

  return new Paragraph({
    children: runs,
    spacing: { after: c.spacingAfter, line: c.lineSpacing },
    alignment: c.alignment ? (ALIGN_MAP[c.alignment] || undefined) : undefined,
  })
}
