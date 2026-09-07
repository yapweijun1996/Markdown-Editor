import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  createUniqueBackupPath,
  remapImageReferences,
  validateBackupManifest,
} from '../src/history/exportHistory.js'

function createManifest(overrides = {}) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: '2026-09-07T00:00:00.000Z',
    documents: [
      {
        id: 'doc-1',
        title: 'Notes',
        createdAt: 1,
        updatedAt: 2,
        pinned: 0,
        templateId: 'default',
        layout: {},
        contentPath: 'documents/Notes.md',
        snapshots: [
          { id: 'snap-1', createdAt: 1, path: 'snapshots/doc-1/1-snap-1.md' },
        ],
      },
    ],
    assets: [
      {
        id: 'image-1',
        documentId: 'doc-1',
        filename: 'diagram.png',
        mimeType: 'image/png',
        width: 10,
        height: 20,
        sizeBytes: 4,
        createdAt: 1,
        path: 'images/diagram.png-image-1',
      },
    ],
    ...overrides,
  }
}

test('backup manifest validation accepts the versioned schema', () => {
  assert.equal(validateBackupManifest(createManifest()), true)
})

test('backup manifest validation rejects unsafe or duplicate paths', () => {
  assert.throws(
    () => validateBackupManifest(createManifest({
      documents: [{ ...createManifest().documents[0], contentPath: '../outside.md' }],
    })),
    /Invalid backup document 0 contentPath/
  )

  const manifest = createManifest({
    assets: [{
      ...createManifest().assets[0],
      id: 'image-1',
      path: 'documents/Notes.md',
    }],
  })
  assert.throws(() => validateBackupManifest(manifest), /Duplicate backup path/)
})

test('backup manifest validation rejects duplicate identities', () => {
  const first = createManifest().documents[0]
  assert.throws(
    () => validateBackupManifest(createManifest({
      documents: [first, { ...first, contentPath: 'documents/Notes-2.md' }],
    })),
    /Duplicate backup document ID/
  )
})

test('backup manifest validates optional title source metadata', () => {
  assert.equal(validateBackupManifest(createManifest({
    documents: [{ ...createManifest().documents[0], titleSource: 'manual' }],
  })), true)
  assert.throws(
    () => validateBackupManifest(createManifest({
      documents: [{ ...createManifest().documents[0], titleSource: 'unknown' }],
    })),
    /Invalid backup document 0 titleSource/
  )
})

test('backup paths remain unique for duplicate document titles', () => {
  const usedPaths = new Set()
  assert.equal(
    createUniqueBackupPath('documents', 'Notes', '.md', usedPaths),
    'documents/Notes.md'
  )
  assert.equal(
    createUniqueBackupPath('documents', 'Notes', '.md', usedPaths),
    'documents/Notes (2).md'
  )
})

test('image references are remapped and missing assets fail closed', () => {
  const mapped = remapImageReferences(
    '![diagram](mdimg://image-1) and ![other](mdimg://image-2)',
    new Map([
      ['image-1', 'new-image-1'],
      ['image-2', 'new-image-2'],
    ])
  )
  assert.equal(
    mapped,
    '![diagram](mdimg://new-image-1) and ![other](mdimg://new-image-2)'
  )
  assert.throws(
    () => remapImageReferences('![missing](mdimg://missing)', new Map()),
    /missing image asset: missing/
  )
})
