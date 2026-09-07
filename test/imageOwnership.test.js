import test from 'node:test'
import assert from 'node:assert/strict'
import { canAttachImage } from '../src/images/imageRepo.js'

test('image ownership only moves orphan records or keeps the same owner', () => {
  assert.equal(canAttachImage({ id: 'orphan', documentId: null }, 'doc-a'), true)
  assert.equal(canAttachImage({ id: 'owned', documentId: 'doc-a' }, 'doc-a'), true)
  assert.equal(canAttachImage({ id: 'owned', documentId: 'doc-a' }, 'doc-b'), false)
  assert.equal(canAttachImage(null, 'doc-a'), false)
})
