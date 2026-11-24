import { cn } from "@/lib/utils"

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-white", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function EmptyBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center">
      <span className="mb-3 text-neutral-400" aria-hidden="true">
        {icon}
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {text ? <p className="mt-1 max-w-xs text-[13px] text-neutral-500">{text}</p> : null}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        checked ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:border-ink",
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? <span className="block text-[13px] text-neutral-500">{description}</span> : null}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
          checked ? "bg-brand" : "bg-neutral-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </label>
  )
}

export const DAY_OPTIONS = [
  { value: 0, label: "Lun" },
  { value: 1, label: "Mar" },
  { value: 2, label: "Mié" },
  { value: 3, label: "Jue" },
  { value: 4, label: "Vie" },
  { value: 5, label: "Sáb" },
  { value: 6, label: "Dom" },
]

export function errorMessage(e: unknown, fallback = "Ocurrió un error") {
  return e instanceof Error ? e.message : fallback
}
