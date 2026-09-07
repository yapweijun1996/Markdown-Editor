import { RESOURCE_LIMITS } from '../limits/resourceLimits.js'

function pad(n) { return String(n).padStart(2, '0') }

function timestampForFilename() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

function sanitizeName(name) {
  return (name || 'untitled').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'untitled'
}

let batchEntrySequence = 0

export function createBatchEntry(file) {
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${++batchEntrySequence}`
  return {
    id: `batch-${randomPart}`,
    file,
  }
}

function normalizeBatchEntry(entry, index) {
  if (entry?.file && entry.id) return entry
  return {
    id: entry?.id || `batch-legacy-${index}`,
    file: entry?.file || entry,
  }
}

export async function batchConvertToZip({ files, options = {}, signal, onProgress, onError }) {
  if (!files || files.length === 0) {
    throw new Error('No files to convert.')
  }

  const batch = files.map(normalizeBatchEntry)
  if (batch.length > RESOURCE_LIMITS.batchFiles) {
    throw new Error(`Batch exceeds the ${RESOURCE_LIMITS.batchFiles}-file limit.`)
  }
  const totalBytes = batch.reduce((sum, entry) => sum + (Number(entry.file?.size) || 0), 0)
  if (totalBytes > RESOURCE_LIMITS.batchTotalBytes) {
    throw new Error('Batch exceeds the supported total input size.')
  }
  const oversized = batch.find((entry) => entry.file?.size > RESOURCE_LIMITS.markdownBytes)
  if (oversized) {
    throw new Error(`File is too large: ${oversized.file.name}. Maximum size is 2 MB.`)
  }
  if (signal?.aborted) {
    throw new Error('Batch conversion cancelled.')
  }

  const [{ default: JSZip }, { saveAs }, { markdownToDocx }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
    import('../converter/markdownToDocx.js'),
  ])

  const zip = new JSZip()
  const usedNames = new Set()
  const total = batch.length
  let done = 0
  let errored = 0
  let cancelled = false

  function reportCancelled(fromIndex) {
    cancelled = true
    for (let index = fromIndex; index < batch.length; index++) {
      const entry = batch[index]
      onProgress?.({ done, total, fileId: entry.id, fileName: entry.file.name, status: 'cancelled' })
    }
  }

  for (let index = 0; index < batch.length; index++) {
    if (signal?.aborted) {
      reportCancelled(index)
      break
    }

    const entry = batch[index]
    const file = entry.file
    onProgress?.({ done, total, fileId: entry.id, fileName: file.name, status: 'processing' })
    try {
      const text = await file.text()
      const blob = await markdownToDocx(text, options)
      const buffer = await blob.arrayBuffer()

      if (signal?.aborted) {
        reportCancelled(index)
        break
      }

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
      onProgress?.({ done, total, fileId: entry.id, fileName: file.name, status: 'done' })
    } catch (err) {
      if (signal?.aborted) {
        reportCancelled(index)
        break
      }
      errored++
      onError?.({ fileId: entry.id, file: file.name, error: err?.message || String(err) })
      onProgress?.({ done, total, fileId: entry.id, fileName: file.name, status: 'error' })
    }
  }

  if (done === 0) {
    throw new Error(cancelled ? 'Batch conversion cancelled.' : 'All files failed to convert.')
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const filename = `markdown-batch-${timestampForFilename()}.zip`
  saveAs(zipBlob, filename)
  return { cancelled, done, errored, total, filename }
}
