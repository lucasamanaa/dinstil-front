"use client"

import useSWR from "swr"
import { CalendarX2 } from "lucide-react"
import { fetcher } from "@/lib/api"
import { nextDays, normalizeTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ds/primitives"
import { StepTitle } from "./state-views"

type SlotValue = string | { time?: string; start_time?: string }

function extractSlots(data: unknown): string[] {
  const raw: SlotValue[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { slots?: SlotValue[] }).slots)
      ? (data as { slots: SlotValue[] }).slots
      : []
  const times = raw
    .map((s) => (typeof s === "string" ? s : (s.time ?? s.start_time ?? "")))
    .filter(Boolean)
    .map(normalizeTime)
  return Array.from(new Set(times)).sort()
}

const GROUPS = [
  { label: "Mañana", test: (t: string) => t < "14:30" },
  { label: "Tarde", test: (t: string) => t >= "14:30" && t < "19:30" },
  { label: "Noche", test: (t: string) => t >= "19:30" },
]

export function StepDateTime({
  serviceId,
  barberId,
  date,
  selectedTime,
  onDateChange,
  onSelectTime,
}: {
  serviceId: number
  barberId: number
  date: string
  selectedTime?: string
  onDateChange: (date: string) => void
  onSelectTime: (time: string) => void
}) {
  const days = nextDays(14)
  const { data, isLoading, error, mutate } = useSWR(
    `/api/availability?service_id=${serviceId}&barber_id=${barberId}&target_date=${date}`,
    fetcher,
  )
  const slots = extractSlots(data)

  return (
    <section>
      <StepTitle>Elegí el día y la hora</StepTitle>

      <div className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1" role="listbox" aria-label="Día">
        {days.map((day) => {
          const active = day.iso === date
          return (
            <button
              key={day.iso}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onDateChange(day.iso)}
              className={cn(
                "flex w-14 shrink-0 snap-start flex-col items-center gap-0.5 rounded-2xl border py-2.5 transition-colors",
                active ? "border-ink bg-ink text-white" : "border-border bg-white text-ink hover:border-ink",
              )}
            >
              <span className={cn("text-[11px] font-medium", active ? "text-white/70" : "text-neutral-500")}>{day.short}</span>
              <span className="text-lg font-semibold leading-none">{day.day}</span>
              <span className={cn("text-[10px] uppercase", active ? "text-white/60" : "text-neutral-400")}>{day.month}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6" aria-live="polite">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-2" aria-busy="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : error ? (
          <button type="button" onClick={() => mutate()} className="text-sm text-neutral-500 underline underline-offset-4">
            No se pudo cargar la disponibilidad. Reintentar
          </button>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center">
            <CalendarX2 className="mb-3 size-6 text-neutral-400" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">Sin horarios disponibles</p>
            <p className="mt-1 text-[13px] text-neutral-500">Probá con otro día del carrusel.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {GROUPS.map((group) => {
              const groupSlots = slots.filter(group.test)
              if (groupSlots.length === 0) return null
              return (
                <div key={group.label}>
                  <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wider text-neutral-500">{group.label}</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {groupSlots.map((time) => {
                      const active = time === selectedTime
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => onSelectTime(time)}
                          aria-pressed={active}
                          className={cn(
                            "h-11 rounded-full border text-sm font-medium tabular-nums transition-all active:scale-95",
                            active ? "border-brand bg-brand text-white" : "border-border bg-white text-ink hover:border-ink",
                          )}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
