import { nanoid } from 'nanoid'
import { getDB, STORE_DOCUMENTS, STORE_SNAPSHOTS, STORE_IMAGES, countWords } from './db.js'
import { DEFAULT_LAYOUT, listDocuments } from './documentRepo.js'
import { listSnapshots } from './snapshotRepo.js'
import { listAllImages } from '../images/imageRepo.js'

export const BACKUP_FORMAT = 'markdown-editor-backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 100 * 1024 * 1024
export const MAX_BACKUP_ENTRIES = 10000
export const MAX_BACKUP_IMAGE_BYTES = 25 * 1024 * 1024
export const MAX_BACKUP_UNCOMPRESSED_BYTES = 200 * 1024 * 1024

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeFilename(name, fallback = 'document') {
  const cleaned = String(name || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '')
    .slice(0, 80)
  return cleaned || fallback
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'unknown-time'
  return date.toISOString().replace(/[:.]/g, '-')
}

export function assertSafeBackupPath(path, label = 'path') {
  if (
    typeof path !== 'string' ||
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.includes('\u0000') ||
    path.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Invalid backup ${label}: ${String(path)}`)
  }
  return path
}

function assertString(value, label) {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Invalid backup ${label}`)
  }
}

function assertTimestamp(value, label) {
  if (!Number.isFinite(value)) throw new Error(`Invalid backup ${label}`)
}

function assertSafePathOnce(path, label, paths) {
  assertSafeBackupPath(path, label)
  if (paths.has(path)) throw new Error(`Duplicate backup path: ${path}`)
  paths.add(path)
}

function normalizeLayout(layout) {
  return {
    ...DEFAULT_LAYOUT,
    ...(layout || {}),
    coverPage: {
      ...DEFAULT_LAYOUT.coverPage,
      ...((layout && layout.coverPage) || {}),
    },
  }
}

export function validateBackupManifest(manifest) {
  if (!isRecord(manifest)) throw new Error('Backup manifest must be an object')
  if (manifest.format !== BACKUP_FORMAT) throw new Error('Unsupported backup format')
  if (manifest.version !== BACKUP_VERSION) throw new Error('Unsupported backup version')
  if (typeof manifest.exportedAt !== 'string' || Number.isNaN(Date.parse(manifest.exportedAt))) {
    throw new Error('Invalid backup exportedAt')
  }
  if (!Array.isArray(manifest.documents) || !Array.isArray(manifest.assets)) {
    throw new Error('Backup manifest must contain documents and assets arrays')
  }

  const documentIds = new Set()
  const snapshotIds = new Set()
  const assetIds = new Set()
  const paths = new Set(['manifest.json', 'INDEX.md'])

  for (const [index, document] of manifest.documents.entries()) {
    if (!isRecord(document)) throw new Error(`Invalid backup document at index ${index}`)
    assertString(document.id, `document ${index} id`)
    if (documentIds.has(document.id)) throw new Error(`Duplicate backup document ID: ${document.id}`)
    documentIds.add(document.id)
    assertString(document.title, `document ${index} title`)
    assertString(document.templateId, `document ${index} templateId`)
    if (!isRecord(document.layout)) throw new Error(`Invalid backup document ${index} layout`)
    assertTimestamp(document.createdAt, `document ${index} createdAt`)
    assertTimestamp(document.updatedAt, `document ${index} updatedAt`)
    if (document.pinned !== 0 && document.pinned !== 1) {
      throw new Error(`Invalid backup document ${index} pinned flag`)
    }
    assertString(document.contentPath, `document ${index} contentPath`)
    assertSafePathOnce(document.contentPath, `document ${index} contentPath`, paths)
    if (!Array.isArray(document.snapshots)) {
      throw new Error(`Invalid backup document ${index} snapshots`)
    }

    for (const [snapshotIndex, snapshot] of document.snapshots.entries()) {
      if (!isRecord(snapshot)) {
        throw new Error(`Invalid backup snapshot at ${index}:${snapshotIndex}`)
      }
      assertString(snapshot.id, `snapshot ${index}:${snapshotIndex} id`)
      if (snapshotIds.has(snapshot.id)) {
        throw new Error(`Duplicate backup snapshot ID: ${snapshot.id}`)
      }
      snapshotIds.add(snapshot.id)
      assertTimestamp(snapshot.createdAt, `snapshot ${index}:${snapshotIndex} createdAt`)
      assertString(snapshot.path, `snapshot ${index}:${snapshotIndex} path`)
      assertSafePathOnce(snapshot.path, `snapshot ${index}:${snapshotIndex} path`, paths)
    }
  }

  for (const [index, asset] of manifest.assets.entries()) {
    if (!isRecord(asset)) throw new Error(`Invalid backup asset at index ${index}`)
    assertString(asset.id, `asset ${index} id`)
    if (assetIds.has(asset.id)) throw new Error(`Duplicate backup asset ID: ${asset.id}`)
    assetIds.add(asset.id)
    if (asset.documentId !== null && typeof asset.documentId !== 'string') {
      throw new Error(`Invalid backup asset ${index} documentId`)
    }
    if (asset.documentId !== null && !documentIds.has(asset.documentId)) {
      throw new Error(`Backup asset references missing document: ${asset.documentId}`)
    }
    assertString(asset.filename, `asset ${index} filename`)
    assertString(asset.mimeType, `asset ${index} mimeType`)
    assertTimestamp(asset.createdAt, `asset ${index} createdAt`)
    if (!Number.isInteger(asset.width) || asset.width < 0) {
      throw new Error(`Invalid backup asset ${index} width`)
    }
    if (!Number.isInteger(asset.height) || asset.height < 0) {
      throw new Error(`Invalid backup asset ${index} height`)
    }
    if (!Number.isInteger(asset.sizeBytes) || asset.sizeBytes < 0) {
      throw new Error(`Invalid backup asset ${index} sizeBytes`)
    }
    assertString(asset.path, `asset ${index} path`)
    assertSafePathOnce(asset.path, `asset ${index} path`, paths)
  }

  return true
}

export function remapImageReferences(markdown, imageIdMap) {
  const source = markdown || ''
  return source.replace(/mdimg:\/\/([A-Za-z0-9_-]+)/g, (match, oldId) => {
    const newId = imageIdMap instanceof Map ? imageIdMap.get(oldId) : imageIdMap?.[oldId]
    if (!newId) throw new Error(`Backup references missing image asset: ${oldId}`)
    return `mdimg://${newId}`
  })
}

export function createUniqueBackupPath(directory, baseName, extension, usedPaths) {
  const base = sanitizeFilename(baseName)
  let suffix = ''
  let candidate = `${directory}/${base}${extension}`
  let index = 2
  while (usedPaths.has(candidate)) {
    suffix = ` (${index})`
    candidate = `${directory}/${base}${suffix}${extension}`
    index += 1
  }
  usedPaths.add(candidate)
  return candidate
}

function buildIndex(manifest) {
  const lines = [
    '# Markdown Editor Backup',
    '',
    `Format: ${manifest.format} v${manifest.version}`,
    `Exported: ${manifest.exportedAt}`,
    '',
    '## Documents',
    '',
  ]

  for (const document of manifest.documents) {
    lines.push(`- ${document.title.replace(/[`\r\n]/g, '')} — \`${document.contentPath}\``)
    for (const snapshot of document.snapshots) {
      lines.push(`  - Snapshot ${snapshot.createdAt} — \`${snapshot.path}\``)
    }
  }

  lines.push('', '## Assets', '')
  if (!manifest.assets.length) lines.push('No embedded image assets.')
  for (const asset of manifest.assets) {
    lines.push(`- ${asset.filename.replace(/[\r\n]/g, '')} — \`${asset.path}\``)
  }
  lines.push('')
  return lines.join('\n')
}

async function loadZipLibrary() {
  const module = await import('jszip')
  return module.default || module
}

async function saveZip(blob, filename) {
  const module = await import('file-saver')
  const saveAs = module.saveAs || module.default?.saveAs || module.default
  if (typeof saveAs !== 'function') throw new Error('File download support is unavailable')
  saveAs(blob, filename)
}

export async function exportAllAsZip({ includeSnapshots = true } = {}) {
  const documents = await listDocuments()
  if (!documents.length) throw new Error('No saved documents to export.')

  const snapshotsByDocument = new Map()
  if (includeSnapshots) {
    await Promise.all(documents.map(async (document) => {
      snapshotsByDocument.set(document.id, await listSnapshots(document.id))
    }))
  }

  const images = await listAllImages()
  const documentIds = new Set(documents.map((document) => document.id))
  const zip = new (await loadZipLibrary())()
  const usedPaths = new Set(['manifest.json', 'INDEX.md'])
  const manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    documents: [],
    assets: [],
  }
  let snapshotCount = 0

  for (const document of documents) {
    const contentPath = createUniqueBackupPath('documents', document.title, '.md', usedPaths)
    zip.file(contentPath, document.content || '')
    const snapshotMetadata = []
    for (const snapshot of snapshotsByDocument.get(document.id) || []) {
      const path = createUniqueBackupPath(
        `snapshots/${sanitizeFilename(document.id)}`,
        `${snapshot.createdAt}-${snapshot.id}`,
        '.md',
        usedPaths
      )
      zip.file(path, snapshot.content || '')
      snapshotMetadata.push({ id: snapshot.id, createdAt: snapshot.createdAt, path })
      snapshotCount += 1
    }
    manifest.documents.push({
      id: document.id,
      title: document.title,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      pinned: document.pinned ? 1 : 0,
      templateId: document.templateId || 'default',
      layout: normalizeLayout(document.layout),
      contentPath,
      snapshots: snapshotMetadata,
    })
  }

  for (const image of images) {
    if (!image.blob || typeof image.blob.arrayBuffer !== 'function') {
      throw new Error(`Image asset cannot be exported: ${image.id}`)
    }
    const path = createUniqueBackupPath(
      'images',
      `${image.filename || 'image'}-${image.id}`,
      '',
      usedPaths
    )
    zip.file(path, image.blob)
    manifest.assets.push({
      id: image.id,
      documentId: image.documentId && documentIds.has(image.documentId) ? image.documentId : null,
      filename: image.filename || `image-${image.id}`,
      mimeType: image.mimeType || image.blob.type || 'application/octet-stream',
      width: Number.isInteger(image.width) && image.width >= 0 ? image.width : 0,
      height: Number.isInteger(image.height) && image.height >= 0 ? image.height : 0,
      sizeBytes: image.blob.size,
      createdAt: Number.isFinite(image.createdAt) ? image.createdAt : Date.now(),
      path,
    })
  }

  validateBackupManifest(manifest)
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('INDEX.md', buildIndex(manifest))
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  const filename = `markdown-editor-backup-${formatTimestamp(Date.now())}.zip`
  await saveZip(blob, filename)
  return {
    docCount: manifest.documents.length,
    snapshotCount,
    imageCount: manifest.assets.length,
    filename,
  }
}

function getZipEntry(zip, path) {
  assertSafeBackupPath(path)
  const entry = zip.file(path)
  if (!entry || entry.dir) throw new Error(`Backup is missing file: ${path}`)
  return entry
}

async function readZipBytes(entry, label, budget, maxBytes = Infinity) {
  let bytes
  try {
    bytes = await entry.async('uint8array')
  } catch {
    throw new Error(`Could not read backup file: ${label}`)
  }
  if (bytes.byteLength > maxBytes) throw new Error(`Backup file is too large: ${label}`)
  budget.total += bytes.byteLength
  if (budget.total > MAX_BACKUP_UNCOMPRESSED_BYTES) {
    throw new Error('Backup expands beyond the supported size limit')
  }
  return bytes
}

async function readZipText(entry, label, budget) {
  const bytes = await readZipBytes(entry, label, budget)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error(`Backup file is not valid UTF-8 text: ${label}`)
  }
}

function createIdMap(records) {
  const ids = new Map()
  for (const record of records) ids.set(record.id, nanoid())
  return ids
}

export async function importHistoryZip(input, {
  maxBytes = MAX_BACKUP_BYTES,
  maxEntries = MAX_BACKUP_ENTRIES,
} = {}) {
  if (!input || typeof input.arrayBuffer !== 'function' || !Number.isFinite(input.size)) {
    throw new Error('Please choose a ZIP backup file.')
  }
  if (input.size > maxBytes) throw new Error('Backup ZIP exceeds the supported size limit.')

  const JSZip = await loadZipLibrary()
  let zip
  try {
    zip = await JSZip.loadAsync(input)
  } catch {
    throw new Error('The selected file is not a readable ZIP backup.')
  }
  const entries = Object.values(zip.files)
  if (entries.length > maxEntries) throw new Error('Backup contains too many files.')

  const budget = { total: 0 }
  const manifestEntry = getZipEntry(zip, 'manifest.json')
  const manifestText = await readZipText(manifestEntry, 'manifest.json', budget)
  let manifest
  try {
    manifest = JSON.parse(manifestText)
  } catch {
    throw new Error('Backup manifest is not valid JSON.')
  }
  validateBackupManifest(manifest)

  const documentIdMap = createIdMap(manifest.documents)
  const imageIdMap = createIdMap(manifest.assets)
  const importedDocuments = []
  const importedSnapshots = []
  const importedImages = []

  for (const document of manifest.documents) {
    const content = remapImageReferences(
      await readZipText(getZipEntry(zip, document.contentPath), document.contentPath, budget),
      imageIdMap
    )
    importedDocuments.push({
      id: documentIdMap.get(document.id),
      title: document.title,
      content,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      wordCount: countWords(content),
      sizeBytes: new Blob([content]).size,
      pinned: document.pinned,
      templateId: document.templateId,
      layout: normalizeLayout(document.layout),
    })

    for (const snapshot of document.snapshots) {
      const snapshotContent = remapImageReferences(
        await readZipText(getZipEntry(zip, snapshot.path), snapshot.path, budget),
        imageIdMap
      )
      importedSnapshots.push({
        id: nanoid(),
        documentId: documentIdMap.get(document.id),
        content: snapshotContent,
        createdAt: snapshot.createdAt,
      })
    }
  }

  for (const asset of manifest.assets) {
    const bytes = await readZipBytes(
      getZipEntry(zip, asset.path),
      asset.path,
      budget,
      MAX_BACKUP_IMAGE_BYTES
    )
    if (bytes.byteLength !== asset.sizeBytes) {
      throw new Error(`Backup asset size does not match its manifest: ${asset.path}`)
    }
    importedImages.push({
      id: imageIdMap.get(asset.id),
      documentId: asset.documentId === null ? null : documentIdMap.get(asset.documentId),
      filename: asset.filename,
      mimeType: asset.mimeType,
      blob: new Blob([bytes], { type: asset.mimeType }),
      width: asset.width,
      height: asset.height,
      sizeBytes: bytes.byteLength,
      createdAt: asset.createdAt,
    })
  }

  const db = await getDB()
  const tx = db.transaction(
    [STORE_DOCUMENTS, STORE_SNAPSHOTS, STORE_IMAGES],
    'readwrite'
  )
  try {
    for (const document of importedDocuments) {
      await tx.objectStore(STORE_DOCUMENTS).put(document)
    }
    for (const snapshot of importedSnapshots) {
      await tx.objectStore(STORE_SNAPSHOTS).put(snapshot)
    }
    for (const image of importedImages) {
      await tx.objectStore(STORE_IMAGES).put(image)
    }
    await tx.done
  } catch (error) {
    try { tx.abort() } catch {}
    throw new Error(`Backup import could not be saved: ${error.message || 'storage failure'}`)
  }

  return {
    docCount: importedDocuments.length,
    snapshotCount: importedSnapshots.length,
    imageCount: importedImages.length,
  }
}
