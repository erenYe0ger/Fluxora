// Prepare pdf.js worker for canvas rendering in a worker thread
// (keeping pdfjs objects out of React state as per AGENTS.md)
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
export { pdfjsLib }
export { TextLayer } from 'pdfjs-dist'
