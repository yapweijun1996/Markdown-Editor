import { saveAs } from 'file-saver'
import { markdownToDocx } from '../converter/markdownToDocx.js'

export async function downloadDocx(markdownText, filename = 'document.docx') {
  const blob = await markdownToDocx(markdownText)
  saveAs(blob, filename)
}
