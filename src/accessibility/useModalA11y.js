import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalA11y(onClose, { active = true } = {}) {
  const rootRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!active || !rootRef.current || typeof document === 'undefined') return undefined
    const root = rootRef.current
    const previousFocus = document.activeElement
    let focusFrame = 0
    const focusInitial = () => root.querySelector(FOCUSABLE_SELECTOR)?.focus()
    if (typeof requestAnimationFrame === 'function') {
      focusFrame = requestAnimationFrame(focusInitial)
    } else {
      focusInitial()
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...root.querySelectorAll(FOCUSABLE_SELECTOR)]
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      if (focusFrame && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(focusFrame)
      }
      document.removeEventListener('keydown', onKeyDown)
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') {
        previousFocus.focus()
      }
    }
  }, [active])

  return rootRef
}
