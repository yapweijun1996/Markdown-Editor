import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { convertInlineNodes } from './convertInline.js'

export function convertTable(node) {
  const cfg = wordStyleConfig.table
  const border = {
    top:    { style: BorderStyle.SINGLE, size: 1, color: cfg.borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: cfg.borderColor },
    left:   { style: BorderStyle.SINGLE, size: 1, color: cfg.borderColor },
    right:  { style: BorderStyle.SINGLE, size: 1, color: cfg.borderColor },
  }

  const rows = node.children.map((rowNode, rowIndex) => {
    const isHeader = rowNode.type === 'tableRow' && rowIndex === 0

    const cells = rowNode.children.map((cellNode) => {
      const runs = convertInlineNodes(cellNode.children)
      if (isHeader && cfg.headerBold) {
        runs.forEach((run) => { if (run.options) run.options.bold = true })
      }

      return new TableCell({
        children: [new Paragraph({ children: runs })],
        borders: border,
        margins: { top: cfg.cellMargin, bottom: cfg.cellMargin, left: cfg.cellMargin, right: cfg.cellMargin },
      })
    })

    return new TableRow({ children: cells })
  })

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}
