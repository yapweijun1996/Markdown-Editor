// Triggers the browser's print dialog. User chooses "Save as PDF".
// Print stylesheet (src/styles/print.css) hides app chrome and
// formats the preview content for paper.
export function downloadPdf() {
  if (typeof window === 'undefined' || !window.print) return
  // Slight delay lets layout settle when called right after a state change
  setTimeout(() => window.print(), 30)
}
