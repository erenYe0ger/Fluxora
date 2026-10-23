import { useCallback, useRef } from 'react'
import { Button } from '@shared/ui/Button'

type Props = {
  onFiles: (files: FileList | null) => void
}

export function ImportDropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      onFiles(e.dataTransfer.files)
    },
    [onFiles]
  )

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700"
      role="button"
      tabIndex={0}
      aria-label="Import PDF files"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          inputRef.current?.click()
        }
      }}
    >
      <p className="text-sm text-slate-500">
        Drop PDFs here or click to browse
      </p>
      <Button type="button" onClick={() => inputRef.current?.click()}>
        Choose files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
}
