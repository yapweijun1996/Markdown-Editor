import { useCallback, useEffect, useRef, useState } from 'react'

const ZOOM_KEY = 'md.previewZoom'
const LOCK_WIDTH_KEY = 'md.previewLockWidth'
const ZOOM_MIN = 0.7
const ZOOM_MAX = 3.0
const ZOOM_STEP = 0.1
const HIDE_THRESHOLD = 80
const SCROLL_DELTA_MIN = 6

const clampZoom = (v) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v * 100) / 100))

function readStoredZoom() {
  try {
    const raw = localStorage.getItem(ZOOM_KEY)
    const v = parseFloat(raw)
    if (Number.isFinite(v)) return clampZoom(v)
  } catch {}
  return 1
}

function readStoredLockWidth() {
  try {
    const raw = localStorage.getItem(LOCK_WIDTH_KEY)
    if (raw === 'false') return false
    if (raw === 'true') return true
  } catch {}
  return true // default: paper width locked
}

export function usePreviewControls(enabled) {
  const [zoom, setZoom] = useState(readStoredZoom)
  const [lockWidth, setLockWidth] = useState(readStoredLockWidth)
  const [toolbarHidden, setToolbarHidden] = useState(false)
  const scrollRef = useRef(null)
  const lastYRef = useRef(0)

  useEffect(() => {
    try { localStorage.setItem(ZOOM_KEY, String(zoom)) } catch {}
  }, [zoom])

  useEffect(() => {
    try { localStorage.setItem(LOCK_WIDTH_KEY, String(lockWidth)) } catch {}
  }, [lockWidth])

  useEffect(() => {
    if (!enabled) {
      setToolbarHidden(false)
      return
    }
    const el = scrollRef.current
    if (!el) return
    lastYRef.current = el.scrollTop || 0

    function onScroll() {
      const y = el.scrollTop
      const diff = y - lastYRef.current
      if (Math.abs(diff) < SCROLL_DELTA_MIN) return
      if (y < HIDE_THRESHOLD) {
        setToolbarHidden(false)
      } else if (diff > 0) {
        setToolbarHidden(true)
      } else {
        setToolbarHidden(false)
      }
      lastYRef.current = y
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [enabled])

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), [])
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), [])
  const zoomReset = useCallback(() => setZoom(1), [])
  const showToolbar = useCallback(() => setToolbarHidden(false), [])

  const toggleLockWidth = useCallback(() => setLockWidth((v) => !v), [])

  return {
    zoom,
    setZoom: (v) => setZoom(clampZoom(v)),
    zoomIn,
    zoomOut,
    zoomReset,
    lockWidth,
    setLockWidth,
    toggleLockWidth,
    toolbarHidden,
    showToolbar,
    scrollRef,
  }
}
