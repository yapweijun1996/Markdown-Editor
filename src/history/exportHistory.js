import { listDocuments } from './documentRepo.js'
import { listSnapshots } from './snapshotRepo.js'

function sanitizeFilename(name) {
  return (name || 'untitled')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'untitled'
}

function pad(n) { return String(n).padStart(2, '0') }

function formatTimestamp(epoch) {
  const d = new Date(epoch)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

function buildIndex(docs) {
  const lines = ['# Markdown Editor — History Export', '']
  lines.push(`Exported: ${new Date().toISOString()}`)
  lines.push(`Documents: ${docs.length}`)
  lines.push('')
  lines.push('| Title | Words | Updated | File |')
  lines.push('|---|---|---|---|')
  for (const d of docs) {
    const file = `documents/${sanitizeFilename(d.title)}.md`
    const updated = new Date(d.updatedAt).toISOString()
    lines.push(`| ${d.title} | ${d.wordCount} | ${updated} | ${file} |`)
  }
  return lines.join('\n')
}

export async function exportAllAsZip({ includeSnapshots = true } = {}) {
  const docs = await listDocuments()
  if (docs.length === 0) {
    throw new Error('No documents to export.')
  }

  const [{ default: JSZip }, { saveAs }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
  ])

  const zip = new JSZip()

  zip.file('INDEX.md', buildIndex(docs))

  const docFolder = zip.folder('documents')
  const usedNames = new Set()

  for (const doc of docs) {
    let base = sanitizeFilename(doc.title)
    let name = `${base}.md`
    let i = 2
    while (usedNames.has(name)) {
      name = `${base} (${i}).md`
      i++
    }
    usedNames.add(name)
    docFolder.file(name, doc.content)

    if (includeSnapshots) {
      const snaps = await listSnapshots(doc.id)
      if (snaps.length > 0) {
        const snapFolder = zip.folder(`snapshots/${base}`)
        for (const snap of snaps) {
          const ts = formatTimestamp(snap.createdAt)
          snapFolder.file(`${ts}.md`, snap.content)
        }
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const filename = `markdown-history-${formatTimestamp(Date.now())}.zip`
  saveAs(blob, filename)
  return { docCount: docs.length, filename }
}
