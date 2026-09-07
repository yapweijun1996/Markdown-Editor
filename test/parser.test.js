import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMarkdown } from '../src/parser/parseMarkdown.js'

test('parseMarkdown returns GFM table and strikethrough nodes', () => {
  const tree = parseMarkdown('| A | B |\n|---|---|\n| 1 | ~~2~~ |')

  assert.equal(tree.type, 'root')
  assert.equal(tree.children[0].type, 'table')
  assert.equal(tree.children[0].children[1].children[1].children[0].type, 'delete')
})
