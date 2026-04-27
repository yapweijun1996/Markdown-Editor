import { defaultTemplate } from './default.js'

// Technical Document — compact, monospace-friendly, larger code blocks.

export const technicalDocumentTemplate = {
  ...defaultTemplate,
  id: 'technicalDocument',
  name: 'Technical Document',
  description: 'Compact, mono-friendly, larger code blocks',

  document: { font: 'Inter', fontSize: 20 },

  heading1: { fontSize: 32, bold: true, color: '0F172A', spacingAfter: 220 },
  heading2: { fontSize: 26, bold: true, color: '1E293B', spacingAfter: 180 },
  heading3: { fontSize: 22, bold: true, color: '334155', spacingAfter: 140 },
  heading4: { fontSize: 21, bold: true, color: '334155', spacingAfter: 120 },
  heading5: { fontSize: 20, bold: true, color: '334155', spacingAfter: 110 },
  heading6: { fontSize: 20, bold: true, color: '334155', spacingAfter: 100 },

  paragraph: { fontSize: 20, spacingAfter: 140, lineSpacing: 260 },
  inlineCode: { font: 'JetBrains Mono', fontSize: 19 },
  codeBlock: { font: 'JetBrains Mono', fontSize: 20, shading: 'F1F5F9', spacingAfter: 200 },
  blockquote: { fontSize: 20, italics: false, indentLeft: 480, spacingAfter: 140, color: '475569' },
  table: { headerBold: true, headerShading: 'F1F5F9', cellMargin: 80, borderColor: 'CBD5E1' },
  link: { color: '0EA5E9', underline: true },
}
