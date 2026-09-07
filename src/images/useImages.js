import { useEffect, useCallback } from 'react'
import { createImage, attachImageToDocument } from './imageRepo.js'
import {
  extractImageIds,
  preloadFromMarkdown,
  setBlob,
  uriFromImageId,
} from './imageCache.js'

export function useImages({ markdown, documentId, allowAttachment = true }) {
  // Preload all mdimg:// references in the current markdown
  useEffect(() => {
    preloadFromMarkdown(markdown).catch(() => {})
  }, [markdown])

  // Bind orphan images after a new document identity is available. Existing
  // ownership is preserved by attachImageToDocument.
  useEffect(() => {
    if (!documentId || !allowAttachment) return
    const ids = extractImageIds(markdown)
    Promise.all(ids.map((id) => attachImageToDocument(id, documentId))).catch(() => {})
  }, [allowAttachment, documentId, markdown])

  const insertBlob = useCallback(async (blob, filename) => {
    const record = await createImage({ documentId, blob, filename })
    setBlob(record.id, record.blob)
    return uriFromImageId(record.id)
  }, [documentId])

  // When document id changes from null → real, attach orphan images
  const attach = useCallback(async (imageId) => {
    if (!documentId || !allowAttachment) return
    await attachImageToDocument(imageId, documentId)
  }, [allowAttachment, documentId])

  return { insertBlob, attach }
}
