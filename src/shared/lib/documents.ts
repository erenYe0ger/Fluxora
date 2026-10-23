import { getAll, get, put, remove, removeByIndex } from './idb'

/** A PDF the user imported. Bytes stay in IndexedDB; nothing is uploaded. */
export type DocumentMeta = {
  id: string
  name: string
  size: number
  addedAt: number
  data: ArrayBuffer
}

// The document record is shared by the library and the reader, so it lives in
// shared/ rather than inside either feature.
export async function listDocuments(): Promise<DocumentMeta[]> {
  const rows = await getAll<DocumentMeta>('documents')
  return rows.sort((a, b) => b.addedAt - a.addedAt)
}

export async function getDocument(id: string): Promise<DocumentMeta | undefined> {
  return get<DocumentMeta>('documents', id)
}

export async function saveDocument(meta: DocumentMeta): Promise<void> {
  await put('documents', meta)
}

export async function deleteDocument(id: string): Promise<void> {
  await remove('documents', id)
  // Annotations are useless without their document, so drop them in the same step.
  await removeByIndex('annotations', 'byDoc', id)
}
