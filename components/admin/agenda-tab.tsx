"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  MessageCircle,
  Phone,
  X,
} from "lucide-react"
import {
  apiRequest,
  fetcher,
  formatPrice,
  type AppointmentStatus,
  type CalendarAppointment,
  type CalendarResponse,
} from "@/lib/api"
import {
  addDaysISO,
  formatDMY,
  formatLongDate,
  minutesToHourLabel,
  normalizeTime,
  timeToBusinessMinutes,
  todayISO,
} from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Avatar, Btn, Select, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, errorMessage } from "./admin-ui"

const PX_PER_MINUTE = 1.8 // 108px por hora -> 30min=54px, 45min=81px, 60min=108px

const STATUS: {
  value: AppointmentStatus
  label: string
  badgeClass: string
  blockClass: string
}[] = [
  {
    value: "CONFIRMED",
    label: "Confirmado",
    badgeClass: "bg-brand text-white",
    blockClass: "border-brand bg-brand text-white shadow-xs",
  },
  {
    value: "COMPLETED",
    label: "Realizado",
    badgeClass: "bg-ink text-white",
    blockClass: "border-ink/40 bg-ink/90 text-white",
  },
  {
    value: "PENDING_PAYMENT",
    label: "Seña pendiente",
    badgeClass: "bg-copper text-white",
    blockClass: "border-copper bg-copper text-white shadow-xs",
  },
  {
    value: "NO_SHOW",
    label: "Ausente",
    badgeClass: "bg-copper/15 text-copper",
    blockClass: "border-copper/40 bg-copper/15 text-copper",
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
    badgeClass: "bg-neutral-100 text-neutral-500 line-through",
    blockClass: "border-border bg-neutral-100 text-neutral-500 line-through",
  },
]

type ReminderResponse = { meta_whatsapp?: { sent?: boolean }; wame_url?: string }

export function AgendaTab() {
  const [date, setDate] = useState(todayISO)
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns")
  const [selectedAppt, setSelectedAppt] = useState<CalendarAppointment | null>(null)
  const [quickSavingId, setQuickSavingId] = useState<number | null>(null)

  const key = `/api/calendar?target_date=${date}`
  const { data, isLoading, error, mutate } = useSWR<CalendarResponse>(key, fetcher, {
    refreshInterval: 30000,
  })

  const appointments = [...(data?.appointments ?? [])].sort(
    (a, b) => timeToBusinessMinutes(a.start_time) - timeToBusinessMinutes(b.start_time),
  )
  const barbers = data?.barbers ?? []

  // Calcular rango horario del tablero (desde apertura hasta cierre, acoplando cualquier turno hasta las 03:00)
  const candidateStarts = [
    data?.shop_schedule?.start_time,
    ...barbers.filter((b) => b.is_working).map((b) => b.start_time),
    ...appointments.map((a) => a.start_time),
  ].filter(Boolean) as string[]

  const candidateEnds = [
    data?.shop_schedule?.end_time,
    ...barbers.filter((b) => b.is_working).map((b) => b.end_time),
    ...appointments.map((a) => a.end_time || a.start_time),
  ].filter(Boolean) as string[]

  const rawMin = candidateStarts.length ? Math.min(...candidateStarts.map(timeToBusinessMinutes)) : 8 * 60
  const rawMax = candidateEnds.length ? Math.max(...candidateEnds.map(timeToBusinessMinutes)) : 23 * 60

  const startMinute = Math.max(7 * 60, Math.floor(rawMin / 60) * 60)
  const endMinute = Math.min(27 * 60, Math.max(startMinute + 60, Math.ceil(rawMax / 60) * 60))
  const totalHeight = (endMinute - startMinute) * PX_PER_MINUTE

  const hourMarks: number[] = []
  for (let m = startMinute; m <= endMinute; m += 60) {
    hourMarks.push(m)
  }

  async function quickMarkCompleted(e: React.MouseEvent, a: CalendarAppointment) {
    e.stopPropagation()
    setQuickSavingId(a.id)
    try {
      await apiRequest(`/api/appointments/${a.id}/status?status=COMPLETED`, { method: "PATCH" })
      const price = a.total_price ?? a.price ?? a.total ?? 0
      toast.success(`Turno de ${a.client_name ?? "cliente"} marcado como Realizado (${formatPrice(price)})`)
      await mutate()
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo actualizar el estado"))
    } finally {
      setQuickSavingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera compacta de fecha y modo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Día anterior">
            <ChevronLeft className="size-4" />
          </Btn>
          <div className="flex h-10 items-center rounded-xl border border-input bg-white px-3.5 text-sm font-semibold text-ink">
            <span className="first-letter:uppercase">{formatLongDate(date)}</span>
            <span className="ml-2 text-xs font-normal text-neutral-400">({formatDMY(date)})</span>
          </div>
          <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Día siguiente">
            <ChevronRight className="size-4" />
          </Btn>
          {date !== todayISO() ? (
            <Btn variant="ghost" size="sm" onClick={() => setDate(todayISO())}>
              Hoy
            </Btn>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {/* Leyenda rápida de colores */}
          <div className="hidden items-center gap-3 text-xs text-neutral-600 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand" />
              Confirmado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-copper" />
              Seña pend.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-ink" />
              Realizado
            </span>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("columns")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "columns" ? "bg-brand text-white" : "text-neutral-600 hover:text-ink",
              )}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Grilla
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-brand text-white" : "text-neutral-600 hover:text-ink",
              )}
            >
              <List className="size-3.5" aria-hidden="true" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Tablero principal: SOLO barberos lado a lado con grilla horaria */}
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[540px] min-w-[240px] flex-1" />
          ))}
        </div>
      ) : error ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="No se pudo cargar el tablero" text={errorMessage(error)} />
      ) : viewMode === "columns" && barbers.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <div className="flex min-w-max">
            {/* Eje vertical de horas */}
            <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-border bg-white">
              <div className="flex h-[68px] items-center justify-center border-b border-border text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Hora
              </div>
              <div className="relative" style={{ height: totalHeight }}>
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute inset-x-0 flex -translate-y-2.5 justify-center text-[11px] font-semibold tabular-nums text-neutral-500"
                    style={{ top: (m - startMinute) * PX_PER_MINUTE }}
                  >
                    <span className="bg-white px-1">{minutesToHourLabel(m)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columnas de todos los barberos lado a lado (nunca una debajo de otra) */}
            {barbers.map((barber) => {
              const barberAppts = appointments.filter((a) => a.barber_id === barber.id)
              const breakTop =
                barber.break_start && barber.break_end
                  ? (timeToBusinessMinutes(barber.break_start) - startMinute) * PX_PER_MINUTE
                  : null
              const breakHeight =
                barber.break_start && barber.break_end
                  ? (timeToBusinessMinutes(barber.break_end) - timeToBusinessMinutes(barber.break_start)) * PX_PER_MINUTE
                  : null

              const scheduleText = !barber.is_working
                ? barber.is_day_off
                  ? "Franco / Bloqueado"
                  : "No trabaja hoy"
                : barber.break_start && barber.break_end
                  ? `${barber.start_time}–${barber.break_start} · ${barber.break_end}–${barber.end_time}`
                  : `${barber.start_time}–${barber.end_time}`

              return (
                <div
                  key={barber.id}
                  className="flex min-w-[230px] flex-1 flex-col border-r border-border last:border-r-0"
                >
                  {/* Header fijo de columna */}
                  <div className="sticky top-0 z-10 flex h-[68px] items-center gap-2.5 border-b border-border bg-neutral-50/95 px-3.5 backdrop-blur">
                    <Avatar name={barber.name} src={barber.photo_url} className="size-9 border border-border" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="truncate text-sm font-semibold text-ink">{barber.name}</h3>
                        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                          {barberAppts.length}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-neutral-500">{scheduleText}</p>
                    </div>
                  </div>

                  {/* Cuerpo horario proporcional */}
                  <div className="relative bg-white" style={{ height: totalHeight }}>
                    {/* Líneas horizontales cada 1 hora + guía media hora */}
                    {hourMarks.map((m) => (
                      <div
                        key={m}
                        className="pointer-events-none absolute inset-x-0 border-t border-neutral-200/80"
                        style={{ top: (m - startMinute) * PX_PER_MINUTE }}
                      >
                        {m < endMinute ? (
                          <div
                            className="border-t border-dashed border-neutral-100"
                            style={{ marginTop: 30 * PX_PER_MINUTE }}
                          />
                        ) : null}
                      </div>
                    ))}

                    {/* Franja de descanso / cierre intermedio */}
                    {barber.is_working && breakTop !== null && breakHeight !== null && breakHeight > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-x-0 flex items-center justify-center border-y border-dashed border-neutral-200 bg-neutral-100/75 text-[11px] font-medium text-neutral-400"
                        style={{ top: Math.max(0, breakTop), height: breakHeight }}
                      >
                        Descanso ({barber.break_start} – {barber.break_end})
                      </div>
                    ) : null}

                    {/* Si el barbero no trabaja hoy */}
                    {!barber.is_working ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-50/80 text-xs font-medium text-neutral-400">
                        {barber.is_day_off ? "Franco / Bloqueado" : "Sin actividad hoy"}
                      </div>
                    ) : null}

                    {/* Bloques de turnos acoplados exactamente a su duración (30m, 45m, 60m, etc.) */}
                    {barberAppts.map((a) => {
                      const sMin = timeToBusinessMinutes(a.start_time)
                      const eMin = a.end_time
                        ? timeToBusinessMinutes(a.end_time)
                        : sMin + (a.duration_minutes ?? 30)
                      const dur = Math.max(20, eMin - sMin)
                      const top = (sMin - startMinute) * PX_PER_MINUTE
                      const height = Math.max(46, dur * PX_PER_MINUTE - 3)
                      const meta = STATUS.find((s) => s.value === a.status) ?? STATUS[0]
                      const client = a.client_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Cliente"
                      const price = a.total_price ?? a.price ?? a.total ?? 0
                      const canQuickDone = a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT"
                      const isCompact = dur <= 35

                      return (
                        <div
                          key={a.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedAppt(a)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedAppt(a)
                          }}
                          className={cn(
                            "absolute inset-x-1.5 z-10 flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border px-2.5 py-1.5 text-left transition-all hover:brightness-105",
                            meta.blockClass,
                          )}
                          style={{ top: top + 1, height }}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold tabular-nums opacity-90">
                                <span>
                                  {normalizeTime(a.start_time)}–{normalizeTime(a.end_time ?? "")}
                                </span>
                                <span className="opacity-75">· {formatPrice(price)}</span>
                              </div>
                              <p className="truncate text-xs font-bold leading-tight">{client}</p>
                              {!isCompact ? (
                                <p className="truncate text-[11px] opacity-85">{a.service_name}</p>
                              ) : null}
                            </div>

                            {canQuickDone ? (
                              <button
                                type="button"
                                onClick={(e) => quickMarkCompleted(e, a)}
                                disabled={quickSavingId === a.id}
                                title="Marcar como Realizado (suma a Caja)"
                                className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white hover:text-brand"
                              >
                                {quickSavingId === a.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Check className="size-3.5" strokeWidth={2.5} />
                                )}
                              </button>
                            ) : null}
                          </div>

                          {!isCompact && a.notes ? (
                            <p className="truncate text-[10px] italic opacity-80">{`"${a.notes}"`}</p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="Sin turnos para este día" text="Los turnos reservados aparecerán acá." />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {appointments.map((a) => {
            const meta = STATUS.find((s) => s.value === a.status) ?? STATUS[0]
            const client = a.client_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Cliente"
            const price = a.total_price ?? a.price ?? a.total ?? 0
            return (
              <li
                key={a.id}
                onClick={() => setSelectedAppt(a)}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-ink"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16">
                    <p className="text-base font-bold tabular-nums text-ink">{normalizeTime(a.start_time)}</p>
                    <p className="text-xs tabular-nums text-neutral-400">{normalizeTime(a.end_time ?? "")}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{client}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.badgeClass)}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {a.service_name} · {a.barber_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-copper">{formatPrice(price)}</span>
                  {(a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT") ? (
                    <Btn type="button" size="sm" onClick={(e) => quickMarkCompleted(e, a)} disabled={quickSavingId === a.id}>
                      <CheckCircle2 className="size-3.5" />
                      Realizado
                    </Btn>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal de detalle y acciones rápidas del turno */}
      {selectedAppt ? (
        <AppointmentDetailModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onChanged={async () => {
            await mutate()
            setSelectedAppt(null)
          }}
        />
      ) : null}
    </div>
  )
}

function AppointmentDetailModal({
  appointment: a,
  onClose,
  onChanged,
}: {
  appointment: CalendarAppointment
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const [status, setStatus] = useState<AppointmentStatus>(a.status)
  const [saving, setSaving] = useState(false)
  const [reminding, setReminding] = useState(false)

  const client = a.client_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Cliente"
  const phone = a.client_phone || a.phone
  const price = a.total_price ?? a.price ?? a.total ?? 0

  async function updateStatus(next: AppointmentStatus) {
    setStatus(next)
    setSaving(true)
    try {
      await apiRequest(`/api/appointments/${a.id}/status?status=${next}`, { method: "PATCH" })
      if (next === "COMPLETED") {
        toast.success(`Turno sumado a la caja (${formatPrice(price)})`)
      } else {
        toast.success("Estado actualizado")
      }
      await onChanged()
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar"))
    } finally {
      setSaving(false)
    }
  }

  async function remind() {
    setReminding(true)
    try {
      const res = await apiRequest<ReminderResponse>(`/api/appointments/${a.id}/send-reminder`, { method: "POST" })
      if (res?.meta_whatsapp?.sent) {
        toast.success(`Recordatorio enviado a ${client}`)
      } else if (res?.wame_url) {
        window.open(res.wame_url, "_blank", "noopener,noreferrer")
      } else {
        toast.error("No se pudo generar el recordatorio")
      }
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo enviar el recordatorio"))
    } finally {
      setReminding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {normalizeTime(a.start_time)} – {normalizeTime(a.end_time ?? "")} hs · {a.barber_name}
            </p>
            <h3 className="mt-1 text-lg font-bold text-ink">{client}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Servicio</span>
            <span className="font-medium text-ink">{a.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Total</span>
            <span className="font-bold text-copper">{formatPrice(price)}</span>
          </div>
          {a.deposit_amount && a.deposit_amount > 0 ? (
            <div className="flex justify-between">
              <span className="text-neutral-500">Seña</span>
              <span className="font-medium text-copper">{formatPrice(a.deposit_amount)}</span>
            </div>
          ) : null}
          {phone ? (
            <div className="flex justify-between">
              <span className="text-neutral-500">Teléfono</span>
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1 font-medium text-ink hover:underline">
                <Phone className="size-3.5" />
                {phone}
              </a>
            </div>
          ) : null}
          {a.notes ? (
            <div className="mt-1 rounded-xl bg-neutral-50 p-3 text-xs italic text-neutral-600">
              {`"${a.notes}"`}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          {status !== "COMPLETED" ? (
            <Btn type="button" size="md" className="w-full" onClick={() => updateStatus("COMPLETED")} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Marcar como Realizado (sumar a Caja)
            </Btn>
          ) : null}

          <div className="flex gap-2">
            <Select
              value={status}
              onChange={(e) => updateStatus(e.target.value as AppointmentStatus)}
              disabled={saving}
              className="h-10 flex-1 text-sm"
            >
              {STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Btn type="button" variant="dark" size="sm" className="h-10 px-4" onClick={remind} disabled={reminding}>
              {reminding ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              Recordar
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
