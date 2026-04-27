// Privacy-aware URL shortener using TinyURL's free API.
// User must explicitly opt in — sending data to a third-party service.

const TINYURL_API = 'https://tinyurl.com/api-create.php?url='

export async function shortenUrl(longUrl) {
  if (!longUrl) throw new Error('No URL provided')
  if (longUrl.length > 6000) {
    throw new Error('URL is too long for TinyURL (max ~6000 chars)')
  }
  const res = await fetch(`${TINYURL_API}${encodeURIComponent(longUrl)}`)
  if (!res.ok) throw new Error(`TinyURL responded ${res.status}`)
  const text = await res.text()
  const trimmed = text.trim()
  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error('Unexpected response from TinyURL')
  }
  return trimmed
}
