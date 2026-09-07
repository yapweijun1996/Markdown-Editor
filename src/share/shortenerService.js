// Privacy-aware URL shortener using TinyURL's free API.
// User must explicitly opt in — sending data to a third-party service.

const TINYURL_API = 'https://tinyurl.com/api-create.php?url='
const SHORTENER_TIMEOUT_MS = 10_000

export async function shortenUrl(longUrl, { signal, timeoutMs = SHORTENER_TIMEOUT_MS } = {}) {
  if (!longUrl) throw new Error('No URL provided')
  if (longUrl.length > 6000) {
    throw new Error('URL is too long for TinyURL (max ~6000 chars)')
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  if (signal?.aborted) controller.abort()
  try {
    const res = await fetch(`${TINYURL_API}${encodeURIComponent(longUrl)}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`TinyURL responded ${res.status}`)
    const text = await res.text()
    const trimmed = text.trim()
    if (!/^https?:\/\//.test(trimmed)) {
      throw new Error('Unexpected response from TinyURL')
    }
    return trimmed
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('TinyURL request timed out or was cancelled.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}
