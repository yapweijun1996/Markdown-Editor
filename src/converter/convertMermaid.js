import { Paragraph, ImageRun, TextRun } from 'docx'
import { renderMermaidToSvg } from '../preview/mermaidRenderer.js'

const FALLBACK_WIDTH = 600
const FALLBACK_HEIGHT = 300

function parseSvgViewBox(svg) {
  const m = /viewBox=["']([^"']+)["']/.exec(svg)
  if (m) {
    const [, , w, h] = m[1].split(/\s+/).map(Number)
    if (w && h) return { width: w, height: h }
  }
  const wm = /width=["']([0-9.]+)/.exec(svg)
  const hm = /height=["']([0-9.]+)/.exec(svg)
  if (wm && hm) return { width: Number(wm[1]), height: Number(hm[1]) }
  return { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT }
}

async function svgStringToPng(svgString) {
  const { width, height } = parseSvgViewBox(svgString)
  const scale = 2 // crisp rendering
  const renderWidth = Math.round(width * scale)
  const renderHeight = Math.round(height * scale)

  return await new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = renderWidth
        canvas.height = renderHeight
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, renderWidth, renderHeight)
        ctx.drawImage(img, 0, 0, renderWidth, renderHeight)
        canvas.toBlob(async (pngBlob) => {
          URL.revokeObjectURL(url)
          if (!pngBlob) {
            reject(new Error('toBlob failed'))
            return
          }
          const buffer = await pngBlob.arrayBuffer()
          resolve({ buffer, width, height })
        }, 'image/png')
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG decode failed'))
    }
    img.src = url
  })
}

const MAX_DOCX_IMAGE_WIDTH = 600

export async function convertMermaid(node) {
  const code = node.value || ''
  try {
    const { svg, error } = await renderMermaidToSvg(code, 'docx')
    if (error || !svg) throw new Error(error || 'no svg')

    const { buffer, width, height } = await svgStringToPng(svg)

    let outW = width
    let outH = height
    if (outW > MAX_DOCX_IMAGE_WIDTH) {
      const scale = MAX_DOCX_IMAGE_WIDTH / outW
      outW = MAX_DOCX_IMAGE_WIDTH
      outH = Math.round(height * scale)
    }

    return new Paragraph({
      children: [
        new ImageRun({
          data: buffer,
          transformation: { width: outW, height: outH },
          type: 'png',
        }),
      ],
      spacing: { after: 200 },
    })
  } catch (err) {
    return new Paragraph({
      children: [
        new TextRun({
          text: `[Mermaid diagram could not be rendered]`,
          italics: true,
          color: '888888',
        }),
      ],
      spacing: { after: 160 },
    })
  }
}
