import type { Annotation } from '../types'

type Props = {
  annotations: Annotation[]
  onJump: (page: number) => void
  onDelete: (id: string) => void
}

export function AnnotationsPanel({ annotations, onJump, onDelete }: Props) {
  if (annotations.length === 0) {
    return <p className="p-3 text-xs text-slate-500">No annotations yet. Select text with the highlight tool or drop a note.</p>
  }

  return (
    <ul className="divide-y divide-slate-200 text-xs dark:divide-slate-800">
      {annotations.map((annotation) => (
        <li key={annotation.id} className="flex gap-2 p-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: annotation.color }}
          />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="block w-full text-left font-medium hover:underline"
              onClick={() => onJump(annotation.page)}
            >
              Page {annotation.page} · {annotation.kind === 'note' ? 'Note' : 'Highlight'}
            </button>
            <p className="mt-1 line-clamp-3 text-slate-600 dark:text-slate-400">
              {annotation.text}
            </p>
          </div>
          <button
            type="button"
            aria-label="Delete annotation"
            className="self-start text-slate-400 hover:text-red-600"
            onClick={() => onDelete(annotation.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
