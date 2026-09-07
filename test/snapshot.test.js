import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldCreateSnapshot } from '../src/history/snapshotRepo.js'

test('snapshot policy records equal-length rewrites and small edits', () => {
  const latest = { content: 'same length' }

  assert.equal(shouldCreateSnapshot(latest, 'same length'), false)
  assert.equal(shouldCreateSnapshot(latest, 'same lengTH'), true)
  assert.equal(shouldCreateSnapshot({ content: 'longer content' }, 'short'), true)
})

test('forced snapshot policy can preserve empty recovery content', () => {
  const latest = { content: 'previous' }

  assert.equal(shouldCreateSnapshot(latest, '', { force: false }), false)
  assert.equal(shouldCreateSnapshot(latest, '', { force: true }), true)
  assert.equal(shouldCreateSnapshot({ content: '' }, '', { force: true }), false)
})
