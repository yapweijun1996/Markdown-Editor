import { TextRun, ExternalHyperlink } from 'docx'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'

export function convertInlineNodes(nodes, inherited = {}) {
  if (!nodes) return []
  return nodes.flatMap((node) => convertInlineNode(node, inherited))
}

function convertInlineNode(node, inherited) {
  switch (node.type) {
    case 'text':
      return [new TextRun({ text: node.value, ...inherited })]

    case 'strong':
      return convertInlineNodes(node.children, { ...inherited, bold: true })

    case 'emphasis':
      return convertInlineNodes(node.children, { ...inherited, italics: true })

    case 'inlineCode': {
      const cfg = wordStyleConfig.inlineCode
      return [new TextRun({ text: node.value, font: cfg.font, size: cfg.fontSize, ...inherited })]
    }

    case 'link': {
      const cfg = wordStyleConfig.link
      const runs = convertInlineNodes(node.children, {
        ...inherited,
        color: cfg.color,
        underline: {},
      })
      return [new ExternalHyperlink({ link: node.url, children: runs })]
    }

    case 'break':
      return [new TextRun({ text: '', break: 1 })]

    default:
      if (node.children) return convertInlineNodes(node.children, inherited)
      if (node.value) return [new TextRun({ text: node.value, ...inherited })]
      return []
  }
}
