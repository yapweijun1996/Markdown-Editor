import test from 'node:test'
import assert from 'node:assert/strict'
import { markdownHasMath, renderMathInHtml } from '../src/preview/mathRenderer.js'

test('math detection ignores code, escaped dollars and currency', () => {
  assert.equal(markdownHasMath('```js\n$x$\n```'), false)
  assert.equal(markdownHasMath('Inline code: `$x$`'), false)
  assert.equal(markdownHasMath('Cost $5 and $6'), false)
  assert.equal(markdownHasMath('Escaped \\$x$'), false)
  assert.equal(markdownHasMath('Formula $x^2$'), true)
  assert.equal(markdownHasMath('Block\n\n$$x^2$$'), true)
})

test('HTML math rendering skips code content and attributes', async () => {
  const html = '<p>Code <code>$x$</code> and <span data-value="$y$">$z$</span></p>'
    + '<pre><code>$$q$$</code></pre>'
  const rendered = await renderMathInHtml(html)

  assert.match(rendered, /class="katex"/)
  assert.match(rendered, /<code>\$x\$<\/code>/)
  assert.match(rendered, /data-value="\$y\$"/)
  assert.match(rendered, /<pre><code>\$\$q\$\$<\/code><\/pre>/)
})
