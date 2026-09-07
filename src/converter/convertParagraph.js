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

export async function convertParagraph(
  node,
  cfg = defaultTemplate,
  overrides = {},
  options = {}
) {
  const c = cfg.paragraph
  const runs = await convertInlineNodes(node.children, {}, cfg, options)
  const { prefixRuns = [], ...paragraphOverrides } = overrides

  return new Paragraph({
    ...paragraphOverrides,
    children: [...prefixRuns, ...runs],
    spacing: { after: c.spacingAfter, line: c.lineSpacing },
    alignment: c.alignment ? (ALIGN_MAP[c.alignment] || undefined) : undefined,
  })
}
