import React, { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const AUTO_RELOAD_SECONDS = 30

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
    },
    onRegisterError(err) {
      console.warn('SW register error', err)
    },
  })

  const [countdown, setCountdown] = useState(AUTO_RELOAD_SECONDS)

  useEffect(() => {
    if (!needRefresh) return
    setCountdown(AUTO_RELOAD_SECONDS)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          updateServiceWorker(true)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [needRefresh, updateServiceWorker])

  if (offlineReady && !needRefresh) {
    return (
      <div className="pwa-toast pwa-toast-info" role="status">
        <span>✓ App ready to work offline</span>
        <button onClick={() => setOfflineReady(false)}>Dismiss</button>
      </div>
    )
  }

  if (needRefresh) {
    return (
      <div className="pwa-toast pwa-toast-update" role="alert">
        <div className="pwa-toast-text">
          <strong>New version available</strong>
          <span>Auto-reload in {countdown}s</span>
        </div>
        <div className="pwa-toast-actions">
          <button
            className="pwa-btn-primary"
            onClick={() => updateServiceWorker(true)}
          >
            Reload Now
          </button>
          <button onClick={() => setNeedRefresh(false)}>Later</button>
        </div>
      </div>
    )
  }

  return null
}
