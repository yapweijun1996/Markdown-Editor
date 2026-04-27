import { Paragraph } from 'docx'
import { convertInlineNodes } from './convertInline.js'
import { defaultTemplate } from '../styles/templates/default.js'

const MAX_LEVEL = 5

function buildItems(node, level, paragraphs, cfg) {
  const ordered = !!node.ordered
  const reference = ordered ? 'ordered-list' : 'bullet-list'
  const lvl = Math.min(level, MAX_LEVEL)

  for (const item of node.children) {
    if (!item.children) continue
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        paragraphs.push(new Paragraph({
          children: convertInlineNodes(child.children, {}, cfg),
          numbering: { reference, level: lvl },
          spacing: { after: 80 },
        }))
      } else if (child.type === 'list') {
        // nested list: recurse with level+1
        buildItems(child, level + 1, paragraphs, cfg)
      }
    }
  }
}

export function convertList(node, cfg = defaultTemplate) {
  const paragraphs = []
  buildItems(node, 0, paragraphs, cfg)
  return paragraphs
}
