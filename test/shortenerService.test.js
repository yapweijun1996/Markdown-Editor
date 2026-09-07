import test from 'node:test'
import assert from 'node:assert/strict'
import { shortenUrl } from '../src/share/shortenerService.js'

test('shortener aborts a request when the caller cancels it', async () => {
  const originalFetch = globalThis.fetch
  const controller = new AbortController()
  globalThis.fetch = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })

  try {
    const request = shortenUrl('https://example.test/#content=abc', {
      signal: controller.signal,
      timeoutMs: 1000,
    })
    controller.abort()
    await assert.rejects(request, /timed out or was cancelled/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
