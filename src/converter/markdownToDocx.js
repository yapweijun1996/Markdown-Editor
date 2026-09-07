import {
  Document, Packer, Paragraph, TextRun,
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

const MAX_LIST_LEVEL = 5
const BULLET_MARKS = ['•', '◦', '▪', '·', '◌', '▫']

function buildListLevels(ordered, start) {
  return Array.from({ length: MAX_LIST_LEVEL + 1 }, (_, level) => ({
    level,
    format: ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
    text: ordered ? `%${level + 1}.` : BULLET_MARKS[level],
    alignment: AlignmentType.LEFT,
    start: ordered && level === 0 ? start : undefined,
    style: {
      paragraph: {
        indent: {
          left: convertInchesToTwip(0.5 + level * 0.4),
          hanging: convertInchesToTwip(0.25),
        },
      },
    },
  }))
}

function collectListNodes(node, context) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'list') {
    const reference = `${node.ordered ? 'ordered' : 'bullet'}-list-${context.nextReference++}`
    const start = Number.isInteger(node.start) && node.start > 0 ? node.start : 1
    context.listReferences.set(node, reference)
    context.config.push({
      reference,
      levels: buildListLevels(!!node.ordered, start),
    })
  }
  for (const child of node.children || []) collectListNodes(child, context)
}

function buildListContext(ast) {
  const context = { listReferences: new WeakMap(), config: [], nextReference: 1 }
  collectListNodes(ast, context)
  return context
}

function readableNodeValue(node) {
  if (typeof node.value === 'string' && node.value) return node.value
  if (node.children) {
    return node.children.map(readableNodeValue).filter(Boolean).join(' ').trim()
  }
  return node.identifier || ''
}

function unsupportedBlock(node) {
  const readableValue = readableNodeValue(node)
  const value = readableValue
    ? ` ${readableValue}`
    : ''
  return new Paragraph({
    children: [new TextRun({
      text: `[Unsupported Markdown node: ${node.type}]${value}`,
      italics: true,
      color: '888888',
    })],
  })
}

function paragraphIsImageOnly(node) {
  if (node.type !== 'paragraph') return false
  const meaningful = (node.children || []).filter(
    (c) => !(c.type === 'text' && !c.value.trim())
  )
  return meaningful.length === 1 && meaningful[0].type === 'image'
}

async function convertNode(node, cfg, context) {
  // TOC placeholder takes priority over default paragraph handling
  if (isTocPlaceholder(node)) {
    return buildTableOfContents()
  }

  switch (node.type) {
    case 'heading':
      return [await convertHeading(node, cfg)]

    case 'paragraph': {
      if (paragraphIsImageOnly(node)) {
        const imageNode = node.children.find((c) => c.type === 'image')
        return [await convertImage(imageNode)]
      }
      return [await convertParagraph(node, cfg)]
    }

    case 'image':
      return [await convertImage(node)]

    case 'list':
      return await convertList(
        node,
        cfg,
        (child) => convertNode(child, cfg, context),
        context
      )

    case 'table':
      return [await convertTable(node, cfg)]

    case 'code':
      if (isMermaidCodeBlock(node)) {
        return [await convertMermaid(node)]
      }
      return convertCodeBlock(node, cfg)

    case 'blockquote':
      return await convertBlockquote(node, cfg, (child) => convertNode(child, cfg, context))

    case 'thematicBreak':
      return [new Paragraph({
        border: { bottom: { style: 'single', size: 1, color: 'CCCCCC', space: 1 } },
        spacing: { before: 120, after: 120 },
      })]

    default:
      return [unsupportedBlock(node)]
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
  const listContext = buildListContext(ast)

  const childrenArrays = await Promise.all(
    ast.children.map((node) => convertNode(node, cfg, listContext))
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
    numbering: { config: listContext.config },
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
