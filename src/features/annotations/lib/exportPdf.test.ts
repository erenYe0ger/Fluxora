import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { exportAnnotatedPdf, scaleSvgPath } from './exportPdf'
import type { Annotation, HighlightAnnotation, NoteAnnotation, DrawAnnotation, TextAnnotation } from '../types'

describe('scaleSvgPath', () => {
  it('scales M and L commands from normalized 0..1 coordinates to page pixels', () => {
    const raw = 'M 0.1 0.2 L 0.5 0.8'
    const scaled = scaleSvgPath(raw, 600, 800)
    expect(scaled).toBe('M 60 160 L 300 640')
  })

  it('handles horizontal and vertical lines properly', () => {
    const raw = 'M 0.1 0.2 H 0.8 V 0.9'
    const scaled = scaleSvgPath(raw, 500, 1000)
    expect(scaled).toBe('M 50 200 H 400 V 900')
  })
})

describe('exportAnnotatedPdf', () => {
  async function createBlankPdf(): Promise<ArrayBuffer> {
    const doc = await PDFDocument.create()
    doc.addPage([600, 800])
    const bytes = await doc.save()
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  }

  it('ignores notes and exports highlights, drawings, and selectable text', async () => {
    const pdfData = await createBlankPdf()

    const annotations: Annotation[] = [
      {
        id: 'note-1',
        docId: 'doc',
        page: 1,
        kind: 'note',
        color: '#f59e0b',
        x: 0.2,
        y: 0.3,
        text: 'This private note should be ignored',
        createdAt: 1
      } as NoteAnnotation,
      {
        id: 'hl-1',
        docId: 'doc',
        page: 1,
        kind: 'highlight',
        color: '#fde047',
        rects: [{ x: 0.1, y: 0.1, width: 0.4, height: 0.05 }],
        text: 'Highlighted sample',
        createdAt: 2
      } as HighlightAnnotation,
      {
        id: 'draw-1',
        docId: 'doc',
        page: 1,
        kind: 'draw',
        color: '#ef4444',
        thickness: 0.005,
        paths: ['M 0.1 0.2 L 0.3 0.4'],
        createdAt: 3
      } as DrawAnnotation,
      {
        id: 'text-1',
        docId: 'doc',
        page: 1,
        kind: 'text',
        color: '#1f2937',
        fontFamily: 'Arial, sans-serif',
        fontSize: 0.02,
        bold: true,
        italic: false,
        underline: true,
        x: 0.15,
        y: 0.25,
        text: 'Selectable User Text',
        createdAt: 4
      } as TextAnnotation
    ]

    const exportedBytes = await exportAnnotatedPdf(pdfData, annotations)
    expect(exportedBytes).toBeInstanceOf(Uint8Array)
    expect(exportedBytes.length).toBeGreaterThan(0)

    // Re-load the PDF with pdf-lib to verify it's valid
    const reloaded = await PDFDocument.load(exportedBytes)
    expect(reloaded.getPageCount()).toBe(1)

    const page = reloaded.getPage(0)
    // Contents stream exists and contains our operators
    expect(page.node.Contents()).toBeDefined()

    // Annots array must not contain note annotations
    expect(page.node.Annots()?.size() ?? 0).toBe(0)

    const rawString = new TextDecoder('latin1').decode(exportedBytes)

    // Note text must NOT be anywhere in the PDF file
    expect(rawString).not.toContain('This private note should be ignored')

    // Embedded font resource is included for selectable text
    expect(rawString).toContain('Helvetica-Bold')
  })

  it('handles multi-line text and invalid page references gracefully', async () => {
    const pdfData = await createBlankPdf()

    const annotations: Annotation[] = [
      {
        id: 'text-multiline',
        docId: 'doc',
        page: 1,
        kind: 'text',
        color: '#1f2937',
        fontFamily: 'Times New Roman, serif',
        fontSize: 0.025,
        bold: false,
        italic: true,
        underline: false,
        x: 0.1,
        y: 0.1,
        text: 'Line One\nLine Two',
        createdAt: 1
      } as TextAnnotation,
      {
        id: 'out-of-bounds',
        docId: 'doc',
        page: 999, // Does not exist
        kind: 'text',
        color: '#1f2937',
        fontFamily: 'Courier New, monospace',
        fontSize: 0.02,
        bold: false,
        italic: false,
        underline: false,
        x: 0.1,
        y: 0.1,
        text: 'Ghost',
        createdAt: 2
      } as TextAnnotation
    ]

    const exportedBytes = await exportAnnotatedPdf(pdfData, annotations)
    const reloaded = await PDFDocument.load(exportedBytes)
    expect(reloaded.getPageCount()).toBe(1)

    const rawString = new TextDecoder('latin1').decode(exportedBytes)
    expect(rawString).toContain('Times-Italic')
    expect(rawString).not.toContain('Ghost')
  })
})
