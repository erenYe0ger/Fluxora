import {
  PDFDocument,
  rgb,
  StandardFonts,
  LineCapStyle
} from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'
import { parseHex } from '@shared/lib/color'
import type {
  Annotation,
  HighlightAnnotation,
  DrawAnnotation,
  TextAnnotation
} from '../types'

/** Scales normalized (0..1) SVG path commands to actual PDF page dimensions. */
export function scaleSvgPath(
  path: string,
  pageWidth: number,
  pageHeight: number
): string {
  const tokens = path.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi)
  if (!tokens) return path

  const result: string[] = []
  let currentCmd = ''
  let coordIndex = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (/^[a-df-z]$/i.test(token)) {
      currentCmd = token
      coordIndex = 0
      result.push(token)
    } else {
      const val = parseFloat(token)
      if (isNaN(val)) {
        result.push(token)
        continue
      }
      const cmdUpper = currentCmd.toUpperCase()
      if (cmdUpper === 'H') {
        result.push(String(val * pageWidth))
      } else if (cmdUpper === 'V') {
        result.push(String(val * pageHeight))
      } else {
        if (coordIndex % 2 === 0) {
          result.push(String(val * pageWidth))
        } else {
          result.push(String(val * pageHeight))
        }
        coordIndex++
      }
    }
  }

  return result.join(' ')
}

function resolveFont(
  fontFamily: string,
  bold: boolean,
  italic: boolean
): StandardFonts {
  const isTimes =
    /times|georgia|serif/i.test(fontFamily) && !/sans-serif/i.test(fontFamily)
  const isCourier = /courier|mono/i.test(fontFamily)

  if (isCourier) {
    if (bold && italic) return StandardFonts.CourierBoldOblique
    if (bold) return StandardFonts.CourierBold
    if (italic) return StandardFonts.CourierOblique
    return StandardFonts.Courier
  }

  if (isTimes) {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic
    if (bold) return StandardFonts.TimesRomanBold
    if (italic) return StandardFonts.TimesRomanItalic
    return StandardFonts.TimesRoman
  }

  // Default to Helvetica for sans-serif (Arial, Verdana, system sans)
  if (bold && italic) return StandardFonts.HelveticaBoldOblique
  if (bold) return StandardFonts.HelveticaBold
  if (italic) return StandardFonts.HelveticaOblique
  return StandardFonts.Helvetica
}

function toPdfRgb(hex: string, fallback = { r: 0.12, g: 0.16, b: 0.22 }) {
  const parsed = parseHex(hex)
  if (!parsed) return rgb(fallback.r, fallback.g, fallback.b)
  return rgb(parsed.r / 255, parsed.g / 255, parsed.b / 255)
}

function drawHighlight(page: PDFPage, highlight: HighlightAnnotation) {
  const { width: pageWidth, height: pageHeight } = page.getSize()
  const color = toPdfRgb(highlight.color, { r: 1, g: 0.9, b: 0.2 })

  for (const rect of highlight.rects) {
    const x = rect.x * pageWidth
    const y = (1 - rect.y - rect.height) * pageHeight
    const width = rect.width * pageWidth
    const height = rect.height * pageHeight

    page.drawRectangle({
      x,
      y,
      width,
      height,
      color,
      opacity: 0.42
    })
  }
}

function drawFreehand(page: PDFPage, draw: DrawAnnotation) {
  const { width: pageWidth, height: pageHeight } = page.getSize()
  const borderColor = toPdfRgb(draw.color, { r: 0.12, g: 0.16, b: 0.22 })
  // Normalised thickness is fraction of page width (matching live DOM canvas)
  const borderWidth = Math.max(0.5, (draw.thickness ?? 0.004) * pageWidth)

  for (const path of draw.paths) {
    const scaledPath = scaleSvgPath(path, pageWidth, pageHeight)
    page.drawSvgPath(scaledPath, {
      x: 0,
      y: pageHeight,
      borderColor,
      borderWidth,
      borderLineCap: LineCapStyle.Round
    })
  }
}

async function drawTextAnnotation(
  page: PDFPage,
  textAnno: TextAnnotation,
  fontCache: Map<StandardFonts, PDFFont>,
  pdfDoc: PDFDocument
) {
  const { width: pageWidth, height: pageHeight } = page.getSize()
  const fontKey = resolveFont(textAnno.fontFamily, textAnno.bold, textAnno.italic)

  let font = fontCache.get(fontKey)
  if (!font) {
    font = await pdfDoc.embedFont(fontKey)
    fontCache.set(fontKey, font)
  }

  const fontSize = Math.max(6, textAnno.fontSize * pageHeight)
  const lineHeight = fontSize * 1.25
  const color = toPdfRgb(textAnno.color, { r: 0.12, g: 0.16, b: 0.22 })

  const startX = textAnno.x * pageWidth
  const topY = (1 - textAnno.y) * pageHeight
  const firstBaseline = topY - font.heightAtSize(fontSize, { descender: false })

  const lines = textAnno.text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineY = firstBaseline - i * lineHeight

    if (line.length > 0) {
      page.drawText(line, {
        x: startX,
        y: lineY,
        size: fontSize,
        font,
        color
      })

      if (textAnno.underline) {
        const textWidth = font.widthOfTextAtSize(line, fontSize)
        const underlineY = lineY - fontSize * 0.1
        page.drawLine({
          start: { x: startX, y: underlineY },
          end: { x: startX + textWidth, y: underlineY },
          thickness: Math.max(0.75, fontSize * 0.06),
          color
        })
      }
    }
  }
}

/**
 * Bakes annotations into a copy of the original PDF document.
 * Notes are deliberately omitted. Highlights and drawings become fixed vector
 * page contents, and user texts are embedded as real selectable text streams.
 */
export async function exportAnnotatedPdf(
  originalBytes: ArrayBuffer,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const pages = pdfDoc.getPages()
  const fontCache = new Map<StandardFonts, PDFFont>()

  for (const annotation of annotations) {
    // Deliberately ignore notes as per user specification
    if (annotation.kind === 'note') continue

    const pageIndex = annotation.page - 1
    if (pageIndex < 0 || pageIndex >= pages.length) continue
    const page = pages[pageIndex]

    if (annotation.kind === 'highlight') {
      drawHighlight(page, annotation)
    } else if (annotation.kind === 'draw') {
      drawFreehand(page, annotation)
    } else if (annotation.kind === 'text') {
      await drawTextAnnotation(page, annotation, fontCache, pdfDoc)
    }
  }

  return pdfDoc.save({ useObjectStreams: false })
}
