import { defaultTemplate } from './default.js'

// Minimal — Helvetica, thin headings, no shading, lots of whitespace.

export const minimalTemplate = {
  ...defaultTemplate,
  id: 'minimal',
  name: 'Minimal',
  description: 'Helvetica, thin headings, generous whitespace',

  document: { font: 'Helvetica', fontSize: 22 },

  heading1: { fontSize: 36, bold: false, color: '111111', spacingAfter: 320 },
  heading2: { fontSize: 28, bold: false, color: '111111', spacingAfter: 240 },
  heading3: { fontSize: 24, bold: false, color: '222222', spacingAfter: 200 },
  heading4: { fontSize: 22, bold: false, color: '333333', spacingAfter: 160 },
  heading5: { fontSize: 22, bold: false, color: '333333', spacingAfter: 140 },
  heading6: { fontSize: 22, bold: false, color: '444444', spacingAfter: 120 },

  paragraph: { fontSize: 22, spacingAfter: 220, lineSpacing: 320 },
  inlineCode: { font: 'Menlo', fontSize: 20 },
  codeBlock: { font: 'Menlo', fontSize: 20, shading: undefined, spacingAfter: 220 },
  blockquote: { fontSize: 22, italics: true, indentLeft: 720, spacingAfter: 220, color: '777777' },
  table: { headerBold: true, cellMargin: 140, borderColor: 'DDDDDD' },
  link: { color: '111111', underline: true },
  horizontalRule: { spacingBefore: 200, spacingAfter: 200 },
}
