import { TextRun } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertParagraph } from './convertParagraph.js'

const MAX_LEVEL = 5

function buildIndent(level) {
  return { left: 720 + level * 576 }
}

async function buildItems(node, level, paragraphs, cfg, convertBlock, context) {
  const ordered = !!node.ordered
  const reference = context.listReferences?.get(node) || (ordered ? 'ordered-list' : 'bullet-list')
  const lvl = Math.min(level, MAX_LEVEL)

  for (const item of node.children) {
    if (!item.children) continue
    let paragraphIndex = 0
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        const firstParagraph = paragraphIndex === 0
        const prefixRuns = firstParagraph && typeof item.checked === 'boolean'
          ? [new TextRun({ text: item.checked ? '☑ ' : '☐ ' })]
          : []
        const overrides = {
          numbering: firstParagraph ? { reference, level: lvl } : false,
          prefixRuns,
        }
        if (!firstParagraph) overrides.indent = buildIndent(lvl)
        paragraphs.push(await convertParagraph(child, cfg, overrides, context))
        paragraphIndex += 1
      } else if (child.type === 'list') {
        // nested list: recurse with level+1
        await buildItems(child, level + 1, paragraphs, cfg, convertBlock, context)
      } else if (convertBlock) {
        const blocks = await convertBlock(child)
        paragraphs.push(...blocks)
      }
    }
  }
}

export async function convertList(node, cfg = defaultTemplate, convertBlock, context = {}) {
  const paragraphs = []
  await buildItems(node, 0, paragraphs, cfg, convertBlock, context)
  return paragraphs
}
