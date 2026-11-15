"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, MessageCircle, Phone } from "lucide-react"
import { apiRequest, fetcher, formatPrice, type AppointmentStatus, type CalendarAppointment, type CalendarResponse } from "@/lib/api"
import { addDaysISO, formatLongDate, normalizeTime, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Btn, Input, Select, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, errorMessage } from "./admin-ui"

const STATUS: { value: AppointmentStatus; label: string; className: string }[] = [
  { value: "CONFIRMED", label: "Confirmado", className: "bg-brand/10 text-brand" },
  { value: "COMPLETED", label: "Completado", className: "bg-ink text-white" },
  { value: "NO_SHOW", label: "No asistió", className: "bg-copper/10 text-copper" },
  { value: "CANCELLED", label: "Cancelado", className: "bg-neutral-100 text-neutral-500 line-through" },
]

type ReminderResponse = { meta_whatsapp?: { sent?: boolean }; wame_url?: string }

function slotCounts(data?: CalendarResponse): { time: string; count: number }[] {
  const raw = data?.people_per_slot
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([time, count]) => ({ time, count: Number(count) }))
  return list
    .filter((s) => s.count > 0)
    .map((s) => ({ time: normalizeTime(s.time), count: s.count }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function AgendaTab() {
  const [date, setDate] = useState(todayISO)
  const key = `/api/calendar?target_date=${date}`
  const { data, isLoading, error, mutate } = useSWR<CalendarResponse>(key, fetcher)
  const appointments = [...(data?.appointments ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const slots = slotCounts(data)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Día anterior">
          <ChevronLeft className="size-4" />
        </Btn>
        <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 w-auto" aria-label="Fecha" />
        <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Día siguiente">
          <ChevronRight className="size-4" />
        </Btn>
        {date !== todayISO() ? (
          <Btn variant="ghost" size="sm" onClick={() => setDate(todayISO())}>
            Hoy
          </Btn>
        ) : null}
        <p className="ml-auto text-sm font-medium text-ink first-letter:uppercase">{formatLongDate(date)}</p>
      </div>

      {slots.length > 0 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {slots.map((slot) => (
            <span key={slot.time} className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink">
              {slot.time} hs · <span className="text-copper">{slot.count} {slot.count === 1 ? "turno" : "turnos"}</span>
            </span>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="No se pudo cargar la agenda" text={errorMessage(error)} />
      ) : appointments.length === 0 ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="Sin turnos para este día" text="Los turnos reservados aparecerán acá." />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {appointments.map((a) => (
            <AppointmentRow key={a.id} appointment={a} onChange={() => mutate()} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AppointmentRow({ appointment: a, onChange }: { appointment: CalendarAppointment; onChange: () => void }) {
  const [status, setStatus] = useState<AppointmentStatus>(a.status)
  const [saving, setSaving] = useState(false)
  const [reminding, setReminding] = useState(false)
  const client = a.client_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Cliente"
  const phone = a.client_phone || a.phone
  const meta = STATUS.find((s) => s.value === status)

  async function updateStatus(next: AppointmentStatus) {
    const prev = status
    setStatus(next)
    setSaving(true)
    try {
      await apiRequest(`/api/appointments/${a.id}/status?status=${next}`, { method: "PATCH" })
      onChange()
    } catch (e) {
      setStatus(prev)
      toast.error(errorMessage(e, "No se pudo actualizar el estado"))
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
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4 sm:flex-1">
        <div className="w-14 shrink-0">
          <p className="text-lg font-semibold tabular-nums leading-none text-ink">{normalizeTime(a.start_time)}</p>
          {a.end_time ? <p className="mt-1 text-xs tabular-nums text-neutral-400">{normalizeTime(a.end_time)}</p> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">{client}</p>
            {meta ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>{meta.label}</span> : null}
          </div>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {[a.service_name, a.barber_name].filter(Boolean).join(" · ")}
            {a.price ?? a.total ? <span className="font-medium text-copper"> · {formatPrice(a.price ?? a.total)}</span> : null}
          </p>
          {phone ? (
            <a href={`tel:${phone}`} className="mt-1 inline-flex items-center gap-1 text-[13px] text-neutral-500 hover:text-ink">
              <Phone className="size-3" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          {a.notes ? <p className="mt-1 text-[13px] italic text-neutral-500">{`"${a.notes}"`}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-40 sm:flex-none">
          <Select
            value={status}
            onChange={(e) => updateStatus(e.target.value as AppointmentStatus)}
            disabled={saving}
            className="h-10 text-sm"
            aria-label={`Estado del turno de ${client}`}
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <Btn variant="dark" size="sm" className="h-10" onClick={remind} disabled={reminding}>
          {reminding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MessageCircle className="size-4" aria-hidden="true" />}
          Recordar turno
        </Btn>
      </div>
    </li>
  )
}
