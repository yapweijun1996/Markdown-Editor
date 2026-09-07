import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_SOURCE,
  resolveDocumentTitle,
} from '../src/history/documentRepo.js'

test('manual document titles survive content updates', () => {
  assert.equal(
    resolveDocumentTitle({ title: 'Release notes', titleSource: TITLE_SOURCE.MANUAL }, '# Different heading'),
    'Release notes'
  )
})

test('derived document titles follow updated content', () => {
  assert.equal(
    resolveDocumentTitle({ title: 'Old heading', titleSource: TITLE_SOURCE.DERIVED }, '# New heading'),
    'New heading'
  )
  assert.equal(resolveDocumentTitle({ title: 'Legacy title' }, 'Plain text'), 'Plain text')
})
