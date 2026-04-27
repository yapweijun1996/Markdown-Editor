function pad(n) { return String(n).padStart(2, '0') }

function timestampForFilename() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

function sanitizeName(name) {
  return (name || 'untitled').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'untitled'
}

export async function batchConvertToZip({ files, options = {}, onProgress, onError }) {
  if (!files || files.length === 0) {
    throw new Error('No files to convert.')
  }

  const [{ default: JSZip }, { saveAs }, { markdownToDocx }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
    import('../converter/markdownToDocx.js'),
  ])

  const zip = new JSZip()
  const usedNames = new Set()
  const total = files.length
  let done = 0
  let errored = 0

  for (const file of files) {
    onProgress?.({ done, total, current: file.name, status: 'processing' })
    try {
      const text = await file.text()
      const blob = await markdownToDocx(text, options)
      const buffer = await blob.arrayBuffer()

      const base = sanitizeName(file.name.replace(/\.md$/i, ''))
      let entryName = `${base}.docx`
      let i = 2
      while (usedNames.has(entryName)) {
        entryName = `${base} (${i}).docx`
        i++
      }
      usedNames.add(entryName)

      zip.file(entryName, buffer)
      done++
      onProgress?.({ done, total, current: file.name, status: 'done' })
    } catch (err) {
      errored++
      onError?.({ file: file.name, error: err?.message || String(err) })
      onProgress?.({ done, total, current: file.name, status: 'error' })
    }
  }

  if (done === 0) {
    throw new Error('All files failed to convert.')
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const filename = `markdown-batch-${timestampForFilename()}.zip`
  saveAs(zipBlob, filename)
  return { done, errored, total, filename }
}
