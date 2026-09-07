import { Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle, ShadingType } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineNodes } from './convertInline.js'

export async function convertTable(node, cfg = defaultTemplate) {
  const c = cfg.table
  const border = {
    top:    { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    left:   { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
    right:  { style: BorderStyle.SINGLE, size: 1, color: c.borderColor },
  }

  const rows = []
  for (const [rowIndex, rowNode] of node.children.entries()) {
    const isHeader = rowIndex === 0

    const cells = []
    for (const cellNode of rowNode.children) {
      const headerExtra = {
        ...(isHeader && c.headerColor ? { color: c.headerColor } : {}),
        ...(isHeader && c.headerBold ? { bold: true } : {}),
      }
      const runs = await convertInlineNodes(cellNode.children, headerExtra, cfg)

      const cellOpts = {
        children: [new Paragraph({ children: runs })],
        borders: border,
        margins: { top: c.cellMargin, bottom: c.cellMargin, left: c.cellMargin, right: c.cellMargin },
      }
      if (isHeader && c.headerShading) {
        cellOpts.shading = { type: ShadingType.SOLID, color: c.headerShading, fill: c.headerShading }
      }
      cells.push(new TableCell(cellOpts))
    }

    rows.push(new TableRow({ children: cells }))
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}
