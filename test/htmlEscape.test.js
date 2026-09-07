import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml } from '../src/preview/htmlEscape.js'

test('escapeHtml neutralizes markup characters used in custom preview HTML', () => {
  const input = '<img src=x onerror="alert(1)"> & \'quoted\''
  const escaped = escapeHtml(input)

  assert.equal(
    escaped,
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;quoted&#39;'
  )
  assert.doesNotMatch(escaped, /<\/?[a-z]/i)
})
