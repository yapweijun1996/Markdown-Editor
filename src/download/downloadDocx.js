export async function downloadDocx(markdownText, options = {}) {
  const { filename = 'document.docx', ...converterOptions } = options
  const [{ markdownToDocx }, { saveAs }] = await Promise.all([
    import('../converter/markdownToDocx.js'),
    import('file-saver'),
  ])
  const blob = await markdownToDocx(markdownText, converterOptions)
  saveAs(blob, filename)
}
