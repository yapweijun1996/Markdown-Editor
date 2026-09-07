import { TextRun, ExternalHyperlink } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'
import { convertInlineImage } from './convertImage.js'

export async function convertInlineNodes(
  nodes,
  inherited = {},
  cfg = defaultTemplate,
  options = {}
) {
  if (!nodes) return []
  const runs = []
  for (const node of nodes) {
    runs.push(...await convertInlineNode(node, inherited, cfg, options))
  }
  return runs
}

async function convertInlineNode(node, inherited, cfg, options) {
  switch (node.type) {
    case 'text':
      return [new TextRun({ text: node.value, ...inherited })]

    case 'strong':
      return await convertInlineNodes(node.children, { ...inherited, bold: true }, cfg, options)

    case 'emphasis':
      return await convertInlineNodes(node.children, { ...inherited, italics: true }, cfg, options)

    case 'delete':
      return await convertInlineNodes(node.children, { ...inherited, strike: true }, cfg, options)

    case 'inlineCode': {
      const c = cfg.inlineCode
      return [new TextRun({ text: node.value, font: c.font, size: c.fontSize, ...inherited })]
    }

    case 'link': {
      const c = cfg.link
      const runs = await convertInlineNodes(node.children, {
        ...inherited,
        color: c.color,
        underline: {},
      }, cfg, options)
      return [new ExternalHyperlink({ link: node.url, children: runs })]
    }

    case 'image':
      return [await convertInlineImage(node, inherited, options)]

    case 'break':
      return [new TextRun({ text: '', break: 1 })]

    default:
      if (node.children) return await convertInlineNodes(node.children, inherited, cfg, options)
      if (node.value) return [new TextRun({ text: node.value, ...inherited })]
      return []
  }
}
