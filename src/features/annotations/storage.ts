import type { Annotation } from './types'
import { getAllByIndex, put, remove } from '@shared/lib/idb'

export async function listAnnotations(docId: string): Promise<Annotation[]> {
  const rows = await getAllByIndex<Annotation>('annotations', 'byDoc', docId)
  return rows.sort((a, b) => a.page - b.page || a.createdAt - b.createdAt)
}

export async function saveAnnotation(annotation: Annotation): Promise<void> {
  await put('annotations', annotation)
}

export async function deleteAnnotation(id: string): Promise<void> {
  await remove('annotations', id)
}
