import { TextRun, ExternalHyperlink } from 'docx'
import { defaultTemplate } from '../styles/templates/default.js'

export function convertInlineNodes(nodes, inherited = {}, cfg = defaultTemplate) {
  if (!nodes) return []
  return nodes.flatMap((node) => convertInlineNode(node, inherited, cfg))
}

function convertInlineNode(node, inherited, cfg) {
  switch (node.type) {
    case 'text':
      return [new TextRun({ text: node.value, ...inherited })]

    case 'strong':
      return convertInlineNodes(node.children, { ...inherited, bold: true }, cfg)

    case 'emphasis':
      return convertInlineNodes(node.children, { ...inherited, italics: true }, cfg)

    case 'inlineCode': {
      const c = cfg.inlineCode
      return [new TextRun({ text: node.value, font: c.font, size: c.fontSize, ...inherited })]
    }

    case 'link': {
      const c = cfg.link
      const runs = convertInlineNodes(node.children, {
        ...inherited,
        color: c.color,
        underline: {},
      }, cfg)
      return [new ExternalHyperlink({ link: node.url, children: runs })]
    }

    case 'break':
      return [new TextRun({ text: '', break: 1 })]

    default:
      if (node.children) return convertInlineNodes(node.children, inherited, cfg)
      if (node.value) return [new TextRun({ text: node.value, ...inherited })]
      return []
  }
}
