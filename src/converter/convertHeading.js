import { Paragraph, HeadingLevel } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { convertInlineNodes } from './convertInline.js'

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

export function convertHeading(node) {
  const depth = node.depth
  const cfg = wordStyleConfig[`heading${depth}`] || wordStyleConfig.heading1
  const runs = convertInlineNodes(node.children)

  return new Paragraph({
    heading: HEADING_MAP[depth] || HeadingLevel.HEADING_1,
    children: runs,
    spacing: { after: cfg.spacingAfter },
  })
}
