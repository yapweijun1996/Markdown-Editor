import { Paragraph, TextRun, LevelFormat, AlignmentType, convertInchesToTwip } from 'docx'
import { convertInlineNodes } from './convertInline.js'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'

export function convertList(node, numbering, numId) {
  const ordered = node.ordered
  const items = []

  node.children.forEach((listItem, index) => {
    listItem.children.forEach((child) => {
      if (child.type === 'paragraph') {
        const cfg = wordStyleConfig.paragraph
        items.push(
          new Paragraph({
            children: convertInlineNodes(child.children),
            numbering: { reference: ordered ? 'ordered-list' : 'bullet-list', level: 0 },
            spacing: { after: 80 },
          })
        )
      }
    })
  })

  return items
}
