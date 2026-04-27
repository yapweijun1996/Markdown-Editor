import {
  Document, Packer, Paragraph,
  AlignmentType, LevelFormat, convertInchesToTwip,
} from 'docx'
import { parseMarkdown } from '../parser/parseMarkdown.js'
import { getTemplate } from '../styles/templates/index.js'
import { convertHeading } from './convertHeading.js'
import { convertParagraph } from './convertParagraph.js'
import { convertList } from './convertList.js'
import { convertTable } from './convertTable.js'
import { convertCodeBlock, isMermaidCodeBlock } from './convertCodeBlock.js'
import { convertBlockquote } from './convertBlockquote.js'
import { convertImage } from './convertImage.js'
import { convertMermaid } from './convertMermaid.js'
import { isTocPlaceholder, buildTableOfContents } from './convertToc.js'
import { buildPageHeader, buildPageFooter, buildPageProps } from './pageLayout.js'
import { buildCoverPage } from './coverPage.js'

const NUMBERING = {
  config: [
    {
      reference: 'bullet-list',
      levels: [0, 1, 2, 3, 4, 5].map((lvl) => ({
        level: lvl,
        format: LevelFormat.BULLET,
        text: ['•', '◦', '▪', '·', '∘', '▫'][lvl] || '•',
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: {
            indent: {
              left: convertInchesToTwip(0.5 + lvl * 0.4),
              hanging: convertInchesToTwip(0.25),
            },
          },
        },
      })),
    },
    {
      reference: 'ordered-list',
      levels: [0, 1, 2, 3, 4, 5].map((lvl) => ({
        level: lvl,
        format: LevelFormat.DECIMAL,
        text: `%${lvl + 1}.`,
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: {
            indent: {
              left: convertInchesToTwip(0.5 + lvl * 0.4),
              hanging: convertInchesToTwip(0.25),
            },
          },
        },
      })),
    },
  ],
}

function paragraphIsImageOnly(node) {
  if (node.type !== 'paragraph') return false
  const meaningful = (node.children || []).filter(
    (c) => !(c.type === 'text' && !c.value.trim())
  )
  return meaningful.length === 1 && meaningful[0].type === 'image'
}

async function convertNode(node, cfg) {
  // TOC placeholder takes priority over default paragraph handling
  if (isTocPlaceholder(node)) {
    return buildTableOfContents()
  }

  switch (node.type) {
    case 'heading':
      return [convertHeading(node, cfg)]

    case 'paragraph': {
      if (paragraphIsImageOnly(node)) {
        const imageNode = node.children.find((c) => c.type === 'image')
        return [await convertImage(imageNode)]
      }
      return [convertParagraph(node, cfg)]
    }

    case 'image':
      return [await convertImage(node)]

    case 'list':
      return convertList(node, cfg)

    case 'table':
      return [convertTable(node, cfg)]

    case 'code':
      if (isMermaidCodeBlock(node)) {
        return [await convertMermaid(node)]
      }
      return convertCodeBlock(node, cfg)

    case 'blockquote':
      return convertBlockquote(node, cfg)

    case 'thematicBreak':
      return [new Paragraph({
        border: { bottom: { style: 'single', size: 1, color: 'CCCCCC', space: 1 } },
        spacing: { before: 120, after: 120 },
      })]

    default:
      return []
  }
}

export async function markdownToDocx(markdownText, options = {}) {
  const {
    templateId = 'default',
    layout = {},
    docTitle,
  } = options

  const cfg = getTemplate(templateId)
  const ast = parseMarkdown(markdownText)

  const childrenArrays = await Promise.all(
    ast.children.map((node) => convertNode(node, cfg))
  )
  const bodyChildren = childrenArrays.flat()

  const titleForLayout = docTitle || layout?.coverPage?.title || ''

  const sectionChildren = [
    ...buildCoverPage(layout.coverPage, cfg),
    ...bodyChildren,
  ]

  const pageProps = buildPageProps({
    pageSize: layout.pageSize,
    orientation: layout.orientation,
  })

  const header = buildPageHeader({ headerText: layout.header, title: titleForLayout })
  const footer = buildPageFooter({
    footerText: layout.footer,
    showPageNumbers: layout.pageNumbers !== false,
    title: titleForLayout,
  })

  const section = {
    properties: pageProps,
    children: sectionChildren,
  }
  if (header) section.headers = { default: header }
  if (footer) section.footers = { default: footer }

  const doc = new Document({
    numbering: NUMBERING,
    styles: {
      default: {
        document: {
          run: { font: cfg.document.font, size: cfg.document.fontSize },
        },
      },
    },
    sections: [section],
  })

  return Packer.toBlob(doc)
}
