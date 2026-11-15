"use client"

import useSWR from "swr"
import { Sparkles } from "lucide-react"
import { asList, fetcher, type Barber } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ds/primitives"
import { ListSkeleton, StepTitle } from "./state-views"

export function StepBarber({
  serviceId,
  selectedId,
  onSelect,
}: {
  serviceId: number
  selectedId?: number
  onSelect: (barber: { id: number; name: string }) => void
}) {
  const { data, isLoading, error, mutate } = useSWR(`/api/barbers?service_id=${serviceId}`, fetcher)
  const barbers = asList<Barber>(data, "barbers")

  return (
    <section>
      <StepTitle>Elegí tu barbero</StepTitle>

      <button
        type="button"
        onClick={() => onSelect({ id: 0, name: "Primer disponible" })}
        aria-pressed={selectedId === 0}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
          selectedId === 0 ? "border-brand bg-brand text-white" : "border-ink bg-white hover:bg-neutral-50",
        )}
      >
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            selectedId === 0 ? "bg-white/15" : "bg-ink text-white",
          )}
        >
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">Primer profesional disponible</span>
          <span className={cn("block text-[13px]", selectedId === 0 ? "text-white/75" : "text-neutral-500")}>
            Asignación automática según el horario que elijas
          </span>
        </span>
      </button>

      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">O elegí a alguien</p>
        {isLoading ? (
          <ListSkeleton rows={2} className="h-28" />
        ) : error ? (
          <button type="button" onClick={() => mutate()} className="text-sm text-neutral-500 underline underline-offset-4">
            No se pudieron cargar los barberos. Reintentar
          </button>
        ) : barbers.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay barberos asignados a este servicio.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5">
            {barbers.map((barber) => {
              const active = barber.id === selectedId
              return (
                <li key={barber.id}>
                  <button
                    type="button"
                    onClick={() => onSelect({ id: barber.id, name: barber.name })}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full flex-col items-center gap-2 rounded-2xl border bg-white px-2 py-4 transition-all active:scale-[0.98]",
                      active ? "border-brand ring-1 ring-brand" : "border-border hover:border-ink",
                    )}
                  >
                    <Avatar name={barber.name} src={barber.photo_url} className="size-14" />
                    <span className="w-full truncate text-center text-[13px] font-medium text-ink">{barber.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
