import { defaultTemplate } from './default.js'

// Business Report — Calibri body, navy headings, justified, professional polish.

export const businessReportTemplate = {
  ...defaultTemplate,
  id: 'businessReport',
  name: 'Business Report',
  description: 'Calibri body, navy headings, justified text',

  document: { font: 'Calibri', fontSize: 22 },

  heading1: { fontSize: 40, bold: true, color: '1F3864', spacingAfter: 280 },
  heading2: { fontSize: 32, bold: true, color: '2E5597', spacingAfter: 220 },
  heading3: { fontSize: 26, bold: true, color: '2E5597', spacingAfter: 180 },
  heading4: { fontSize: 24, bold: true, color: '2E5597', spacingAfter: 160 },
  heading5: { fontSize: 22, bold: true, color: '2E5597', spacingAfter: 140 },
  heading6: { fontSize: 22, bold: true, color: '2E5597', spacingAfter: 120 },

  paragraph: { fontSize: 22, spacingAfter: 160, lineSpacing: 300, alignment: 'justified' },
  inlineCode: { font: 'Consolas', fontSize: 20 },
  codeBlock: { font: 'Consolas', fontSize: 20, shading: 'F2F2F2', spacingAfter: 160 },
  blockquote: { fontSize: 22, italics: true, indentLeft: 720, spacingAfter: 160, color: '595959' },
  table: { headerBold: true, headerShading: '1F3864', headerColor: 'FFFFFF', cellMargin: 120, borderColor: '1F3864' },
  link: { color: '1F3864', underline: true },
}
