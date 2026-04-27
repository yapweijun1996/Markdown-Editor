import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, ShadingType } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

export function convertTable(node, cfg = defaultTemplate) {
  const c = cfg.table
  const border = {
    top:    { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    left:   { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    right:  { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
  }

  const rows = node.children.map((rowNode, rowIndex) => {
    const isHeader = rowIndex === 0

    const cells = rowNode.children.map((cellNode) => {
      const headerExtra = isHeader && c.headerColor ? { color: c.headerColor } : {}
      const runs = convertInlineNodes(cellNode.children, headerExtra, cfg)
      if (isHeader && c.headerBold) {
        runs.forEach((run) => { if (run.options) run.options.bold = true })
      }

      const cellOpts = {
        children: [new Paragraph({ children: runs })],
        borders: border,
        margins: { top: c.cellMargin, bottom: c.cellMargin, left: c.cellMargin, right: c.cellMargin },
      }
      if (isHeader && c.headerShading) {
        cellOpts.shading = { type: ShadingType.SOLID, color: c.headerShading, fill: c.headerShading }
      }
      return new TableCell(cellOpts)
    })

    return new TableRow({ children: cells })
  })

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}
