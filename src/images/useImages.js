import { useEffect, useState, useCallback } from 'react'
import { createImage, attachImageToDocument } from './imageRepo.js'
import {
  preloadFromMarkdown,
  setBlob,
  uriFromImageId,
  subscribe,
} from './imageCache.js'

export function useImages({ markdown, documentId }) {
  const [, forceRender] = useState(0)

  // Re-render when cache updates so newly inserted images appear in preview
  useEffect(() => subscribe(() => forceRender((n) => n + 1)), [])

  // Preload all mdimg:// references in the current markdown
  useEffect(() => {
    preloadFromMarkdown(markdown).catch(() => {})
  }, [markdown])

  const insertBlob = useCallback(async (blob, filename) => {
    const record = await createImage({ documentId, blob, filename })
    setBlob(record.id, record.blob)
    return uriFromImageId(record.id)
  }, [documentId])

  // When document id changes from null → real, attach orphan images
  const attach = useCallback(async (imageId) => {
    if (!documentId) return
    await attachImageToDocument(imageId, documentId)
  }, [documentId])

  return { insertBlob, attach }
}
