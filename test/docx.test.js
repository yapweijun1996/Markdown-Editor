import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { markdownToDocx } from '../src/converter/markdownToDocx.js'

async function readDocx(markdown, options = {}) {
  const blob = await markdownToDocx(markdown, options)
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  return {
    documentXml: await zip.file('word/document.xml').async('string'),
    numberingXml: await zip.file('word/numbering.xml').async('string'),
    files: Object.keys(zip.files),
  }
}

test('DOCX conversion preserves recursive blocks, task state, strike and list starts', async () => {
  const markdown = [
    '# Heading',
    '',
    '- [x] done',
    '- [ ] todo',
    '  - nested',
    '',
    '3. third',
    '4. fourth',
    '',
    '> # quoted heading',
    '> quoted text',
    '',
    '- item',
    '',
    '    ```js',
    '    NESTED_CODE',
    '    ```',
    '',
    '~~deleted~~',
  ].join('\n')

  const { documentXml, numberingXml } = await readDocx(markdown)
  assert.match(documentXml, /Heading/)
  assert.match(documentXml, /done/)
  assert.match(documentXml, /todo/)
  assert.match(documentXml, /nested/)
  assert.match(documentXml, /quoted heading/)
  assert.match(documentXml, /quoted text/)
  assert.match(documentXml, /NESTED_CODE/)
  assert.match(documentXml, /w:strike/)
  assert.match(documentXml, /☑|&#9745;|â˜‘/)
  assert.match(numberingXml, /w:start[^>]*w:val="3"/)
})

test('DOCX conversion preserves inline images and table header emphasis', async () => {
  const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  const markdown = [
    'Before ![inline](data:image/png;base64,' + pixel + ') after.',
    '',
    '| Header | Value |',
    '| --- | --- |',
    '| Cell | 1 |',
  ].join('\n')

  const { documentXml, files } = await readDocx(markdown, { templateId: 'businessReport' })
  assert.match(documentXml, /Before/)
  assert.match(documentXml, /after\./)
  assert.match(documentXml, /Header/)
  assert.match(documentXml, /w:b/)
  assert.ok(files.some((file) => file.startsWith('word/media/')))
})

test('unsupported block nodes remain visible as explicit DOCX fallbacks', async () => {
  const { documentXml } = await readDocx('[^1]: footnote text\n\nBody[^1]')
  assert.match(documentXml, /Unsupported Markdown node: footnoteDefinition/)
  assert.match(documentXml, /footnote text/)
})
