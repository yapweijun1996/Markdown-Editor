import { Paragraph, HeadingLevel } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

export function convertHeading(node, cfg = defaultTemplate) {
  const depth = node.depth
  const headingCfg = cfg[`heading${depth}`] || cfg.heading1
  const runs = convertInlineNodes(node.children, {
    bold: headingCfg.bold,
    color: headingCfg.color,
    size: headingCfg.fontSize,
  }, cfg)

  return new Paragraph({
    heading: HEADING_MAP[depth] || HeadingLevel.HEADING_1,
    children: runs,
    spacing: { after: headingCfg.spacingAfter },
  })
}
