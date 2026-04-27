import React, { useRef } from 'react'

export default function FileUploader({ onLoad, onError }) {
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.md')) {
      onError('Only .md files are supported.')
      e.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      onError('File is too large. Maximum size is 2 MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      onLoad(ev.target.result)
      onError('')
    }
    reader.onerror = () => onError('Failed to read file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Upload Markdown file"
      />
      <button onClick={() => inputRef.current.click()}>Upload .md</button>
    </>
  )
}
