// Triggers the browser's print dialog. User chooses "Save as PDF".
// Print stylesheet (src/styles/print.css) hides app chrome and
// formats the preview content for paper.
export const PRINT_READY_TIMEOUT_MS = 5000

function getWindow(documentRef, windowRef) {
  return windowRef || documentRef?.defaultView || (
    typeof window !== 'undefined' ? window : null
  )
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForRenderState(documentRef, deadline) {
  if (!documentRef?.querySelector) return
  const preview = documentRef.querySelector('.preview-content')
  if (!preview) return

  while (Date.now() < deadline) {
    const state = preview.getAttribute?.('data-render-state')
    if (!state || state === 'ready') return
    await wait(20)
  }
}

async function waitForFonts(documentRef, deadline) {
  const ready = documentRef?.fonts?.ready
  if (!ready || typeof ready.then !== 'function') return
  const remaining = Math.max(0, deadline - Date.now())
  await Promise.race([Promise.resolve(ready).catch(() => {}), wait(remaining)])
}

async function waitForImage(image, deadline) {
  if (image.complete) {
    if (typeof image.decode === 'function') await image.decode().catch(() => {})
    return
  }

  const remaining = Math.max(0, deadline - Date.now())
  await new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      image.removeEventListener?.('load', finish)
      image.removeEventListener?.('error', finish)
      resolve()
    }
    image.addEventListener?.('load', finish, { once: true })
    image.addEventListener?.('error', finish, { once: true })
    setTimeout(finish, remaining)
  })
}

async function waitForFrame(windowRef) {
  if (typeof windowRef?.requestAnimationFrame === 'function') {
    await new Promise((resolve) => windowRef.requestAnimationFrame(resolve))
    return
  }
  await wait(0)
}

export async function waitForPrintReady({
  documentRef = typeof document !== 'undefined' ? document : null,
  windowRef,
  timeoutMs = PRINT_READY_TIMEOUT_MS,
} = {}) {
  if (!documentRef) return false
  const deadline = Date.now() + Math.max(0, timeoutMs)
  const activeWindow = getWindow(documentRef, windowRef)

  await waitForRenderState(documentRef, deadline)
  await waitForFonts(documentRef, deadline)

  const images = documentRef.querySelectorAll?.('.preview-content img') || []
  await Promise.all(Array.from(images, (image) => waitForImage(image, deadline)))

  // Let layout and late SVG/canvas/image mutations reach the print snapshot.
  await waitForFrame(activeWindow)
  await waitForFrame(activeWindow)
  return Date.now() <= deadline
}

export function downloadPdf(options = {}) {
  const documentRef = options.documentRef || (
    typeof document !== 'undefined' ? document : null
  )
  const windowRef = getWindow(documentRef, options.windowRef)
  if (!windowRef?.print) return Promise.resolve(false)

  return waitForPrintReady({ ...options, documentRef, windowRef })
    .catch(() => false)
    .then(() => {
      windowRef.print()
      return true
    })
}
