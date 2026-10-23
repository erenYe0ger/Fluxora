type Props = {
  message: string
}

export function EmptyState({ message }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
      <p>{message}</p>
    </div>
  )
}
