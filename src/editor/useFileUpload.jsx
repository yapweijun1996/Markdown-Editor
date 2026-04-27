import React, { useRef } from 'react'

const MAX_BYTES = 2 * 1024 * 1024

export function useFileUpload({ onLoad, onError, accept = '.md' }) {
  const inputRef = useRef(null)

  function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.md')) {
      onError && onError('Only .md files are supported.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_BYTES) {
      onError && onError('File is too large. Maximum size is 2 MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      onLoad && onLoad(ev.target.result)
      onError && onError('')
    }
    reader.onerror = () => onError && onError('Failed to read file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      style={{ display: 'none' }}
      onChange={handleChange}
      aria-hidden="true"
    />
  )

  return {
    input,
    trigger: () => inputRef.current?.click(),
  }
}
