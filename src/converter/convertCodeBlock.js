import { Paragraph, TextRun, ShadingType } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'

export function convertCodeBlock(node) {
  const cfg = wordStyleConfig.codeBlock
  const lines = (node.value || '').split('\n')

  return lines.map((line, i) =>
    new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: cfg.font,
          size: cfg.fontSize,
        }),
      ],
      shading: {
        type: ShadingType.SOLID,
        color: cfg.shading,
        fill: cfg.shading,
      },
      spacing: { after: i === lines.length - 1 ? cfg.spacingAfter : 0 },
    })
  )
}
