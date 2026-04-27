export async function downloadDocx(markdownText, filename = 'document.docx') {
  const [{ markdownToDocx }, { saveAs }] = await Promise.all([
    import('../converter/markdownToDocx.js'),
    import('file-saver'),
  ])
  const blob = await markdownToDocx(markdownText)
  saveAs(blob, filename)
}
