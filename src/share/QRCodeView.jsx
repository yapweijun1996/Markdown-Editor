import React, { useEffect, useRef, useState } from 'react'

export default function QRCodeView({ url }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)

    if (!url) return
    ;(async () => {
      try {
        const QRCode = (await import('qrcode')).default
        if (cancelled || !canvasRef.current) return
        await QRCode.toCanvas(canvasRef.current, url, {
          margin: 2,
          width: 240,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        })
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'QR generation failed')
      }
    })()

    return () => { cancelled = true }
  }, [url])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const link = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      link.download = 'share-qr.png'
      link.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    }, 'image/png')
  }

  return (
    <div className="qr-view">
      {error ? (
        <div className="qr-error">{error}</div>
      ) : (
        <>
          <canvas ref={canvasRef} className="qr-canvas" aria-label="QR code for share URL" />
          <button
            className="qr-download-btn"
            onClick={handleDownload}
            disabled={!ready}
          >
            Download as PNG
          </button>
          <div className="qr-hint">
            Scan with phone camera to open the shared document.
          </div>
        </>
      )}
    </div>
  )
}
