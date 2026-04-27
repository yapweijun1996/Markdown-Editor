import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, LevelFormat, convertInchesToTwip,
} from 'docx'
import { parseMarkdown } from '../parser/parseMarkdown.js'
import { wordStyleConfig } from '../styles/wordStyleConfig.js'
import { convertHeading } from './convertHeading.js'
import { convertParagraph } from './convertParagraph.js'
import { convertList } from './convertList.js'
import { convertTable } from './convertTable.js'
import { convertCodeBlock } from './convertCodeBlock.js'
import { convertBlockquote } from './convertBlockquote.js'

const NUMBERING = {
  config: [
    {
      reference: 'bullet-list',
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } },
          },
        },
      ],
    },
    {
      reference: 'ordered-list',
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } },
          },
        },
      ],
    },
  ],
}

function convertNode(node) {
  switch (node.type) {
    case 'heading':
      return [convertHeading(node)]

    case 'paragraph':
      return [convertParagraph(node)]

    case 'list':
      return convertList(node)

    case 'table':
      return [convertTable(node)]

    case 'code':
      return convertCodeBlock(node)

    case 'blockquote':
      return convertBlockquote(node)

    case 'thematicBreak':
      return [new Paragraph({ border: { bottom: { style: 'single', size: 1, color: 'CCCCCC', space: 1 } }, spacing: { before: 120, after: 120 } })]

    default:
      return []
  }
}

export async function markdownToDocx(markdownText) {
  const ast = parseMarkdown(markdownText)
  const cfg = wordStyleConfig.document

  const children = ast.children.flatMap(convertNode)

  const doc = new Document({
    numbering: NUMBERING,
    styles: {
      default: {
        document: {
          run: { font: cfg.font, size: cfg.fontSize },
        },
      },
    },
    sections: [{ children }],
  })

  return Packer.toBlob(doc)
}
