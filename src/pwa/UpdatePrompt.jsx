import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import packageJson from '../../package.json'

const AUTO_RELOAD_SECONDS = 30
const UPDATE_POLL_INTERVAL_MS = 60 * 60 * 1000
const APP_VERSION = packageJson.version || 'dev'
const VERSION_LABEL = `v${APP_VERSION}`

export default function UpdatePrompt({ onBeforeReload }) {
  const [registration, setRegistration] = useState(null)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, nextRegistration) {
      setRegistration(nextRegistration || null)
    },
    onRegisterError(err) {
      console.warn('SW register error', err)
    },
  })

  const [countdown, setCountdown] = useState(AUTO_RELOAD_SECONDS)
  const [reloadError, setReloadError] = useState('')
  const [autoReloadPaused, setAutoReloadPaused] = useState(false)
  const [updating, setUpdating] = useState(false)
  const updatingRef = useRef(false)

  useEffect(() => {
    if (!registration) return undefined
    const timer = window.setInterval(
      () => registration.update().catch(() => {}),
      UPDATE_POLL_INTERVAL_MS
    )
    return () => window.clearInterval(timer)
  }, [registration])

  const reloadWithFlush = useCallback(async () => {
    if (updatingRef.current) return
    updatingRef.current = true
    setUpdating(true)
    setReloadError('')
    try {
      await onBeforeReload?.()
      await updateServiceWorker(true)
      updatingRef.current = false
      setUpdating(false)
    } catch (err) {
      updatingRef.current = false
      setUpdating(false)
      setAutoReloadPaused(true)
      setReloadError('Changes could not be saved, so reload was paused.')
    }
  }, [onBeforeReload, updateServiceWorker])

  useEffect(() => {
    if (!needRefresh) {
      setReloadError('')
      setAutoReloadPaused(false)
      return undefined
    }
    setCountdown(AUTO_RELOAD_SECONDS)
    setAutoReloadPaused(false)
    setReloadError('')
  }, [needRefresh])

  useEffect(() => {
    if (!needRefresh || autoReloadPaused || updating) return undefined
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
  }, [autoReloadPaused, needRefresh, reloadWithFlush, updating])

  if (offlineReady && !needRefresh) {
    return (
      <div className="pwa-toast pwa-toast-info" role="status">
        <span>✓ App {VERSION_LABEL} ready to work offline</span>
        <button onClick={() => setOfflineReady(false)}>Dismiss</button>
      </div>
    )
  }

  if (needRefresh) {
    return (
      <div className="pwa-toast pwa-toast-update" role="alert">
        <div className="pwa-toast-text">
          <strong>New version available · {VERSION_LABEL}</strong>
          <span>
            {reloadError || (updating ? 'Updating…' : `Auto-update in ${countdown}s`)}
          </span>
        </div>
        <div className="pwa-toast-actions">
          <button
            className="pwa-btn-primary"
            disabled={updating}
            aria-busy={updating}
            onClick={() => { void reloadWithFlush() }}
          >
            {updating ? 'Updating…' : 'Update now'}
          </button>
          <button onClick={() => setNeedRefresh(false)}>Later</button>
        </div>
      </div>
    )
  }

  return null
}
