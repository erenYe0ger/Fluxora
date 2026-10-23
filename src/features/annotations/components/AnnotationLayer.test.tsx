import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnnotationLayer } from './AnnotationLayer'
import type { NoteAnnotation } from '../types'

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

function renderLayer() {
  const onDelete = vi.fn()
  const onMove = vi.fn()
  render(
    <div style={{ position: 'relative', width: 400, height: 600 }}>
      <AnnotationLayer annotations={[NOTE]} tool="select" onDelete={onDelete} onMove={onMove} />
      <button type="button">somewhere else</button>
    </div>
  )
  return { onDelete, onMove }
}

const popover = () => screen.queryByText('Delete note')

describe('AnnotationLayer note popover', () => {
  it('opens on the pin and toggles closed on a second click', () => {
    renderLayer()
    const pin = screen.getByLabelText('Toggle note')

    fireEvent.click(pin)
    expect(popover()).toBeTruthy()

    fireEvent.click(pin)
    expect(popover()).toBeNull()
  })

  it('stays open when the pointer goes down inside the popover', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.pointerDown(screen.getByText('Delete note'))
    expect(popover()).toBeTruthy()
  })

  it('closes when the pointer goes down anywhere else', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))
    expect(popover()).toBeTruthy()

    fireEvent.pointerDown(screen.getByText('somewhere else'))
    expect(popover()).toBeNull()
  })

  it('closes on Escape', () => {
    renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(popover()).toBeNull()
  })

  it('deletes the note when the popover action is used', () => {
    const { onDelete } = renderLayer()
    fireEvent.click(screen.getByLabelText('Toggle note'))

    fireEvent.click(screen.getByText('Delete note'))
    expect(onDelete).toHaveBeenCalledWith('note-1')
    expect(popover()).toBeNull()
  })
})
