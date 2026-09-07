import test from 'node:test'
import assert from 'node:assert/strict'
import { isImageFile } from '../src/images/insertImage.js'
import {
  normalizeImageMimeType,
  RESOURCE_LIMITS,
} from '../src/limits/resourceLimits.js'

test('image inputs are limited to formats the DOCX converter can represent', () => {
  assert.equal(normalizeImageMimeType('image/jpg'), 'image/jpeg')
  assert.equal(isImageFile({ type: 'image/png' }), true)
  assert.equal(isImageFile({ type: 'image/webp' }), false)
  assert.equal(RESOURCE_LIMITS.imageBytes, 25 * 1024 * 1024)
})
