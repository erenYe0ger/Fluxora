import { useCallback, useRef, useState } from 'react'
import { Button } from '@shared/ui/Button'
import { UploadIcon } from '@shared/ui/icons'

type Props = {
  onFiles: (files: FileList | null) => void
}

export function ImportDropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      onFiles(event.dataTransfer.files)
    },
    [onFiles]
  )

  return (
    <div
      onDrop={onDrop}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Import PDF files"
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition duration-200 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none ${
        dragging
          ? 'scale-[1.01] border-accent bg-accent-soft'
          : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
      }`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition duration-300 ${
          dragging
            ? 'border-accent/50 bg-accent text-accent-ink'
            : 'border-line bg-surface-2 text-accent group-hover:-translate-y-0.5'
        }`}
      >
        <UploadIcon className="h-6 w-6" />
      </span>

      <div>
        <p className="text-sm font-medium text-ink">
          {dragging ? 'Drop to import' : 'Drop PDFs here, or browse'}
        </p>
        <p className="mt-1 text-xs text-muted">
          Files stay in this browser. Nothing is uploaded, ever.
        </p>
      </div>

      <Button
        type="button"
        variant={dragging ? 'primary' : 'secondary'}
        size="sm"
        onClick={(event) => {
          event.stopPropagation()
          inputRef.current?.click()
        }}
      >
        Choose files
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(event) => onFiles(event.target.files)}
      />
    </div>
  )
}
