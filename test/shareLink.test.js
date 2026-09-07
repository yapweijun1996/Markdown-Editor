import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeShareUrl, encodeShareUrl, hasLocalImageReferences } from '../src/share/shareLink.js'

function setLocation({ hash = '', search = '' } = {}) {
  globalThis.window = {
    location: {
      origin: 'https://example.test',
      pathname: '/Markdown-Editor/',
      hash,
      search,
    },
  }
}

test('share links round-trip Unicode Markdown and preview mode', () => {
  setLocation()
  const markdown = '# 标题\n\nこんにちは **world**'
  const url = encodeShareUrl(markdown, true)

  assert.match(url, /^https:\/\/example\.test\/Markdown-Editor\/#content=/)
  setLocation({ hash: url.slice(url.indexOf('#')) })
  assert.deepEqual(decodeShareUrl(), { markdown, previewOnly: true })
})

test('share decoder accepts the legacy query form', () => {
  setLocation({ search: '?content=invalid' })
  assert.equal(decodeShareUrl(), null)
})

test('share links identify local image references without uploading them', () => {
  assert.equal(hasLocalImageReferences('![local](mdimg://image-1)'), true)
  assert.equal(hasLocalImageReferences('![remote](https://example.test/image.png)'), false)
})

test('share encoding rejects oversized markdown before compression', () => {
  setLocation()
  assert.throws(
    () => encodeShareUrl('x'.repeat(1_000_001)),
    /too large to encode/
  )
})
