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
import { convertImage } from './convertImage.js'

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

function paragraphIsImageOnly(node) {
  if (node.type !== 'paragraph') return false
  const meaningfulChildren = (node.children || []).filter(
    (c) => !(c.type === 'text' && !c.value.trim())
  )
  return meaningfulChildren.length === 1 && meaningfulChildren[0].type === 'image'
}

async function convertNode(node) {
  switch (node.type) {
    case 'heading':
      return [convertHeading(node)]

    case 'paragraph': {
      // Block-level images: paragraph containing only an image
      if (paragraphIsImageOnly(node)) {
        const imageNode = node.children.find((c) => c.type === 'image')
        return [await convertImage(imageNode)]
      }
      return [convertParagraph(node)]
    }

    case 'image':
      return [await convertImage(node)]

    case 'list':
      return convertList(node)

    case 'table':
      return [convertTable(node)]

    case 'code':
      return convertCodeBlock(node)

    case 'blockquote':
      return convertBlockquote(node)

    case 'thematicBreak':
      return [new Paragraph({
        border: { bottom: { style: 'single', size: 1, color: 'CCCCCC', space: 1 } },
        spacing: { before: 120, after: 120 },
      })]

    default:
      return []
  }
}

export async function markdownToDocx(markdownText) {
  const ast = parseMarkdown(markdownText)
  const cfg = wordStyleConfig.document

  const childrenArrays = await Promise.all(
    ast.children.map((node) => convertNode(node))
  )
  const children = childrenArrays.flat()

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
