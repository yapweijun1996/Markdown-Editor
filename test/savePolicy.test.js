import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DOC_AUTOSAVE_MAX_MS,
  DOC_AUTOSAVE_MS,
  getSaveDelay,
} from '../src/history/savePolicy.js'

test('save policy keeps an inactivity delay for new edits', () => {
  assert.equal(getSaveDelay(1000, 0), DOC_AUTOSAVE_MS)
  assert.equal(getSaveDelay(9000, 1000), DOC_AUTOSAVE_MS)
})

test('save policy forces a checkpoint at the maximum wait', () => {
  assert.equal(getSaveDelay(26000, 1000), 5000)
  assert.equal(getSaveDelay(31000, 1000), 0)
  assert.equal(DOC_AUTOSAVE_MAX_MS, 30000)
})
