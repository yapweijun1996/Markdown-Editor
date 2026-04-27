import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

const processor = unified().use(remarkParse).use(remarkGfm)

export function parseMarkdown(markdownText) {
  return processor.parse(markdownText)
}
