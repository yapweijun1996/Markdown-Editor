import test from 'node:test'
import assert from 'node:assert/strict'
import { countWords, deriveTitle } from '../src/history/db.js'

test('deriveTitle prefers the first Markdown heading', () => {
  assert.equal(deriveTitle('Intro\n\n## **Release** notes'), 'Release notes')
})

test('deriveTitle falls back to the first non-empty line', () => {
  assert.equal(deriveTitle('\n  Plain *document* text\nnext'), 'Plain document text')
  assert.equal(deriveTitle(''), 'Untitled')
})

test('countWords counts whitespace-separated tokens', () => {
  assert.equal(countWords('  one\n two  three '), 3)
  assert.equal(countWords(''), 0)
})
