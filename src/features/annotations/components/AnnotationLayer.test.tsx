import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { fireEvent, screen } from '@testing-library/dom'
import { AnnotationLayer } from './AnnotationLayer'
import type { NoteAnnotation, TextAnnotation } from '../types'

const NOTE: NoteAnnotation = {
  id: 'note-1',
  docId: 'doc',
  page: 1,
  kind: 'note',
  color: '#f59e0b',
  x: 0.2,
  y: 0.3,
  text: 'draggable note',
  createdAt: 1
}

const TEXT: TextAnnotation = {
  id: 'text-1',
  docId: 'doc',
  page: 1,
  kind: 'text',
  color: '#1f2937',
  fontFamily: 'Arial, sans-serif',
  fontSize: 0.02,
  bold: false,
  italic: false,
  underline: false,
  x: 0.3,
  y: 0.4,
  text: 'Hello world',
  createdAt: 2
}

function renderLayer(tool: 'select' | 'text' = 'select') {
  const onDelete = vi.fn()
  const onMove = vi.fn()
  const onUpdateText = vi.fn()
  render(
    <div style={{ position: 'relative', width: 400, height: 600 }}>
      <AnnotationLayer
        annotations={[NOTE, TEXT]}
        tool={tool}
        onDelete={onDelete}
        onMove={onMove}
        onUpdateText={onUpdateText}
      />
      <button type="button">somewhere else</button>
    </div>
  )
  return { onDelete, onMove, onUpdateText }
}

const notePopover = () => screen.queryByText('Delete note')
const textEditBtn = () => screen.queryByRole('button', { name: 'Edit' })

describe('AnnotationLayer note popover', () => {
  it('opens on the pin and toggles closed on a second click', () => {
    renderLayer()
    const pin = screen.getByLabelText('Toggle note')

    fireEvent.click(pin)
    expect(notePopover()).toBeTruthy()

    fireEvent.click(pin)
    expect(notePopover()).toBeNull()
  })

  it('stays open when the pointer goes down inside the popover', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.pointerDown(screen.getByText('Delete note'))
    expect(notePopover()).toBeTruthy()
  })

  it('closes when the pointer goes down anywhere else', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))
    expect(notePopover()).toBeTruthy()

    fireEvent.pointerDown(screen.getByText('somewhere else'))
    expect(notePopover()).toBeNull()
  })

  it('closes on Escape', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(notePopover()).toBeNull()
  })

  it('deletes the note when the popover action is used', () => {
    const { onDelete } = renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.click(screen.getByText('Delete note'))
    expect(onDelete).toHaveBeenCalledWith('note-1')
    expect(notePopover()).toBeNull()
  })
})

describe('AnnotationLayer text editing', () => {
  it('opens editing window only in select mode, not in text mode', () => {
    renderLayer('text')
    const textEl = screen.getByText('Hello world')

    fireEvent.click(textEl)
    expect(textEditBtn()).toBeNull()
  })

  it('opens editing window in select mode with Edit and Cancel buttons', () => {
    renderLayer('select')
    const textEl = screen.getByText('Hello world')

    fireEvent.click(textEl)
    expect(textEditBtn()).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('nullifies edits when Cancel is clicked', () => {
    const { onUpdateText } = renderLayer('select')
    const textEl = screen.getByText('Hello world')

    fireEvent.click(textEl)
    const textarea = screen.getByPlaceholderText('Type here…')
    fireEvent.change(textarea, { target: { value: 'Changed text' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onUpdateText).not.toHaveBeenCalled()
    expect(textEditBtn()).toBeNull()
  })

  it('commits edits when Edit button is clicked', () => {
    const { onUpdateText } = renderLayer('select')
    const textEl = screen.getByText('Hello world')

    fireEvent.click(textEl)
    const textarea = screen.getByPlaceholderText('Type here…')
    fireEvent.change(textarea, { target: { value: 'Updated line 1\nline 2' } })

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onUpdateText).toHaveBeenCalledWith('text-1', expect.objectContaining({
      text: 'Updated line 1\nline 2'
    }))
    expect(textEditBtn()).toBeNull()
  })
})
