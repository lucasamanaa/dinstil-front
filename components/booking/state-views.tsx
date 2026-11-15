import { CalendarClock, WifiOff } from "lucide-react"
import { Btn, Skeleton } from "@/components/ds/primitives"

export function ListSkeleton({ rows = 4, className = "h-[72px]" }: { rows?: number; className?: string }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function SetupEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-white">
        <CalendarClock className="size-6 text-copper" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-ink text-balance">Agenda en configuración</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500 text-pretty">
        Próximamente podrás reservar tu turno aquí.
      </p>
    </div>
  )
}

export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-white">
        <WifiOff className="size-6 text-neutral-500" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-ink">No pudimos cargar la agenda</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">Revisá tu conexión e intentá de nuevo.</p>
      <Btn variant="outline" className="mt-6" onClick={onRetry}>
        Reintentar
      </Btn>
    </div>
  )
}

export function StepTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink text-balance">{children}</h1>
      {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
    </div>
  )
}
