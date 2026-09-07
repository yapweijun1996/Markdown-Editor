import test from 'node:test'
import assert from 'node:assert/strict'
import { batchConvertToZip, createBatchEntry } from '../src/batch/batchProcess.js'

test('batch entries receive stable per-queue identities independent of filenames', () => {
  const file = { name: 'notes.md', size: 12, lastModified: 1 }
  const first = createBatchEntry(file)
  const second = createBatchEntry(file)

  assert.notEqual(first.id, second.id)
  assert.equal(first.file, file)
  assert.equal(second.file, file)
})

test('pre-cancelled batches stop before loading conversion dependencies', async () => {
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(
    batchConvertToZip({
      files: [{ name: 'notes.md', size: 12 }],
      signal: controller.signal,
    }),
    /cancelled/i,
  )
})
