import { Paragraph, TextRun, ShadingType } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'

export function convertCodeBlock(node, cfg = defaultTemplate) {
  const c = cfg.codeBlock
  const lines = (node.value || '').split('\n')

  return lines.map((line, i) => {
    const props = {
      children: [new TextRun({ text: line, font: c.font, size: c.fontSize })],
      spacing: { after: i === lines.length - 1 ? c.spacingAfter : 0 },
    }
    if (c.shading) {
      props.shading = { type: ShadingType.SOLID, color: c.shading, fill: c.shading }
    }
    return new Paragraph(props)
  })
}
