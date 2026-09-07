import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { markdownToDocx } from '../src/converter/markdownToDocx.js'
import {
  getPageDimensions,
  getWritablePageWidthPx,
} from '../src/converter/pageLayout.js'
import {
  downloadPdf,
  waitForPrintReady,
} from '../src/download/downloadPdf.js'

async function readDocx(markdown, options = {}) {
  const blob = await markdownToDocx(markdown, options)
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  return {
    documentXml: await zip.file('word/document.xml').async('string'),
    settingsXml: await zip.file('word/settings.xml').async('string'),
  }
}

test('page mapping keeps docx landscape dimensions authoritative', async () => {
  assert.deepEqual(getPageDimensions({ pageSize: 'a4', orientation: 'portrait' }), {
    width: 11906,
    height: 16838,
  })
  assert.deepEqual(getPageDimensions({ pageSize: 'a4', orientation: 'landscape' }), {
    width: 16838,
    height: 11906,
  })
  assert.equal(getWritablePageWidthPx({ pageSize: 'a4', orientation: 'portrait' }), 602)
  assert.equal(getWritablePageWidthPx({ pageSize: 'a4', orientation: 'landscape' }), 931)

  const portrait = await readDocx('# Heading', {
    layout: { pageSize: 'a4', orientation: 'portrait' },
  })
  assert.match(
    portrait.documentXml,
    /<w:pgSz w:w="11906" w:h="16838" w:orient="portrait"\/>/
  )
  assert.doesNotMatch(portrait.documentXml, /<w:titlePg/)

  const landscape = await readDocx('# Heading', {
    docTitle: 'Document title',
    layout: {
      pageSize: 'a4',
      orientation: 'landscape',
      header: '{title}',
      footer: '{page}/{total}',
      coverPage: { enabled: true, title: '', date: '' },
    },
  })
  assert.match(
    landscape.documentXml,
    /<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"\/>/
  )
  assert.match(landscape.documentXml, /<w:titlePg\/>/)
  assert.equal((landscape.documentXml.match(/w:type="first"/g) || []).length, 2)
  assert.match(landscape.settingsXml, /<w:updateFields\/>/)
  assert.match(landscape.documentXml, /Document title/)
  assert.match(landscape.documentXml, /Heading/)

  const toc = await readDocx(['# One', '', '[TOC]', '', '## Two'].join('\n'))
  assert.match(toc.documentXml, /Table of Contents/)
  assert.match(toc.documentXml, /TOC/)
  assert.match(toc.settingsXml, /<w:updateFields\/>/)
})

test('PDF readiness waits for render state before printing', async () => {
  let state = 'rendering'
  const documentRef = {
    querySelector: () => ({ getAttribute: () => state }),
    querySelectorAll: () => [],
    fonts: { ready: Promise.resolve() },
  }
  const windowRef = {
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
  }

  setTimeout(() => { state = 'ready' }, 25)
  assert.equal(
    await waitForPrintReady({ documentRef, windowRef, timeoutMs: 200 }),
    true
  )

  let printCount = 0
  const printed = await downloadPdf({
    documentRef: {
      ...documentRef,
      querySelector: () => ({ getAttribute: () => 'ready' }),
    },
    windowRef: {
      ...windowRef,
      print: () => { printCount += 1 },
    },
    timeoutMs: 200,
  })
  assert.equal(printed, true)
  assert.equal(printCount, 1)
})
