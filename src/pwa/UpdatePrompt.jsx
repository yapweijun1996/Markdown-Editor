import React, { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const AUTO_RELOAD_SECONDS = 30

export default function UpdatePrompt({ onBeforeReload }) {
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
  const [reloadError, setReloadError] = useState('')

  const reloadWithFlush = useCallback(async () => {
    setReloadError('')
    try {
      await onBeforeReload?.()
      await updateServiceWorker(true)
    } catch (err) {
      setReloadError('Changes could not be saved, so reload was paused.')
    }
  }, [onBeforeReload, updateServiceWorker])

  useEffect(() => {
    if (!needRefresh) return
    setCountdown(AUTO_RELOAD_SECONDS)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          void reloadWithFlush()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [needRefresh, reloadWithFlush])

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
          <span>{reloadError || `Auto-reload in ${countdown}s`}</span>
        </div>
        <div className="pwa-toast-actions">
          <button
            className="pwa-btn-primary"
            onClick={() => { void reloadWithFlush() }}
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
