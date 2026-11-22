"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  MessageCircle,
  Percent,
  Phone,
  Wallet,
} from "lucide-react"
import {
  apiRequest,
  fetcher,
  formatPrice,
  type AppointmentStatus,
  type CalendarAppointment,
  type CalendarBarberColumn,
  type CalendarResponse,
} from "@/lib/api"
import { addDaysISO, formatDMY, formatLongDate, normalizeTime, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Avatar, Btn, Select, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, errorMessage } from "./admin-ui"

const STATUS: { value: AppointmentStatus; label: string; badgeClass: string; cardClass: string }[] = [
  {
    value: "CONFIRMED",
    label: "Confirmado",
    badgeClass: "bg-brand text-white",
    cardClass: "border-brand/40 bg-brand/[0.06]",
  },
  {
    value: "COMPLETED",
    label: "Realizado",
    badgeClass: "bg-ink text-white",
    cardClass: "border-ink/25 bg-neutral-100/80",
  },
  {
    value: "PENDING_PAYMENT",
    label: "Seña pendiente",
    badgeClass: "bg-copper text-white",
    cardClass: "border-copper/45 bg-copper/[0.07]",
  },
  {
    value: "NO_SHOW",
    label: "Ausente",
    badgeClass: "bg-copper/15 text-copper",
    cardClass: "border-copper/30 bg-white opacity-75",
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
    badgeClass: "bg-neutral-100 text-neutral-500 line-through",
    cardClass: "border-border bg-white opacity-60",
  },
]

type ReminderResponse = { meta_whatsapp?: { sent?: boolean }; wame_url?: string }

export function AgendaTab() {
  const [date, setDate] = useState(todayISO)
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns")
  const key = `/api/calendar?target_date=${date}`
  const { data, isLoading, error, mutate } = useSWR<CalendarResponse>(key, fetcher, {
    refreshInterval: 30000,
  })

  const appointments = [...(data?.appointments ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const barbers = data?.barbers ?? []
  const summary = data?.day_summary

  return (
    <div className="flex flex-col gap-5">
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
            Columnas
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

      {summary ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-4">
            <div className="flex items-center justify-between text-xs font-medium text-brand">
              <span>Caja del día (Realizados)</span>
              <Wallet className="size-4" aria-hidden="true" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{formatPrice(summary.cash_collected)}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {summary.completed_count} {summary.completed_count === 1 ? "corte realizado" : "cortes realizados"}
            </p>
          </div>

          <div className="rounded-2xl border border-copper/25 bg-copper/[0.04] p-4">
            <div className="flex items-center justify-between text-xs font-medium text-copper">
              <span>Por cobrar (Confirmados)</span>
              <Clock className="size-4" aria-hidden="true" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{formatPrice(summary.pending_revenue)}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {summary.confirmed_count} {summary.confirmed_count === 1 ? "turno pendiente" : "turnos pendientes"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
              <span>Ocupación del día</span>
              <Percent className="size-4 text-brand" aria-hidden="true" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{summary.occupancy_rate}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, summary.occupancy_rate)}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
              <span>Turnos activos</span>
              <CalendarDays className="size-4 text-copper" aria-hidden="true" />
            </div>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{summary.total_active}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {summary.no_show_count} ausentes · {summary.cancelled_count} cancelados
            </p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : error ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="No se pudo cargar la agenda" text={errorMessage(error)} />
      ) : viewMode === "columns" && barbers.length > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            barbers.length === 1
              ? "max-w-2xl grid-cols-1"
              : barbers.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {barbers.map((barber) => {
            const barberAppts = appointments.filter((a) => a.barber_id === barber.id)
            return (
              <BarberBoardColumn
                key={barber.id}
                barber={barber}
                appointments={barberAppts}
                onChange={() => mutate()}
              />
            )
          })}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyBlock icon={<CalendarDays className="size-6" />} title="Sin turnos para este día" text="Los turnos reservados aparecerán acá." />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {appointments.map((a) => (
            <AppointmentCard key={a.id} appointment={a} showBarber onChange={() => mutate()} />
          ))}
        </ul>
      )}
    </div>
  )
}

function BarberBoardColumn({
  barber,
  appointments,
  onChange,
}: {
  barber: CalendarBarberColumn
  appointments: CalendarAppointment[]
  onChange: () => void
}) {
  const scheduleLabel = !barber.is_working
    ? barber.is_day_off
      ? "Franco / Bloqueado"
      : "No trabaja hoy"
    : barber.break_start && barber.break_end
      ? `${barber.start_time}–${barber.break_start} y ${barber.break_end}–${barber.end_time}`
      : `${barber.start_time}–${barber.end_time}`

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white">
      <header className="flex items-center gap-3 border-b border-border bg-neutral-50/70 px-4 py-3.5">
        <Avatar name={barber.name} src={barber.photo_url} className="size-10 border border-border" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{barber.name}</h3>
            <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              {appointments.length} {appointments.length === 1 ? "turno" : "turnos"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500">{scheduleLabel}</p>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs">
        <span className="text-neutral-500">
          Realizados: <strong className="text-ink">{barber.completed_count}</strong>
        </span>
        <span className="font-semibold text-brand">
          Caja: {formatPrice(barber.cash_collected)}
          {barber.pending_revenue > 0 ? (
            <span className="ml-1.5 font-normal text-copper">(+{formatPrice(barber.pending_revenue)} pend.)</span>
          ) : null}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {appointments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-10 text-center">
            <p className="text-xs font-medium text-neutral-500">
              {barber.is_working ? "Sin turnos reservados" : "Sin actividad hoy"}
            </p>
          </div>
        ) : (
          appointments.map((a) => <AppointmentCard key={a.id} appointment={a} onChange={onChange} />)
        )}
      </div>
    </section>
  )
}

function AppointmentCard({
  appointment: a,
  showBarber = false,
  onChange,
}: {
  appointment: CalendarAppointment
  showBarber?: boolean
  onChange: () => void
}) {
  const [status, setStatus] = useState<AppointmentStatus>(a.status)
  const [saving, setSaving] = useState(false)
  const [reminding, setReminding] = useState(false)

  useEffect(() => {
    setStatus(a.status)
  }, [a.status])

  const client = a.client_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Cliente"
  const phone = a.client_phone || a.phone
  const meta = STATUS.find((s) => s.value === status) ?? STATUS[0]
  const price = a.total_price ?? a.price ?? a.total ?? 0
  const canQuickComplete = status === "CONFIRMED" || status === "PENDING_PAYMENT"

  async function updateStatus(next: AppointmentStatus) {
    const prev = status
    setStatus(next)
    setSaving(true)
    try {
      await apiRequest(`/api/appointments/${a.id}/status?status=${next}`, { method: "PATCH" })
      if (next === "COMPLETED") {
        toast.success(`Turno de ${client} sumado a la caja (${formatPrice(price)})`)
      }
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
    <div className={cn("flex flex-col gap-2.5 rounded-xl border p-3.5 transition-colors", meta.cardClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white px-2 py-1 text-sm font-bold tabular-nums text-ink shadow-2xs">
            {normalizeTime(a.start_time)}
            {a.end_time ? <span className="font-normal text-neutral-400"> – {normalizeTime(a.end_time)}</span> : null}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.badgeClass)}>
            {meta.label}
          </span>
        </div>
        <span className="text-sm font-bold tabular-nums text-copper">{formatPrice(price)}</span>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">{client}</p>
        <p className="text-xs text-neutral-600">
          {a.service_name}
          {showBarber && a.barber_name ? ` · ${a.barber_name}` : ""}
          {a.deposit_amount && a.deposit_amount > 0 ? (
            <span className="ml-1.5 font-medium text-copper">· Seña {formatPrice(a.deposit_amount)}</span>
          ) : null}
        </p>
        {phone ? (
          <a href={`tel:${phone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-ink">
            <Phone className="size-3" aria-hidden="true" />
            {phone}
          </a>
        ) : null}
        {a.notes ? <p className="mt-1 text-xs italic text-neutral-500">{`"${a.notes}"`}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {canQuickComplete ? (
          <Btn
            type="button"
            size="sm"
            variant="primary"
            className="h-8 flex-1 px-2.5 text-xs"
            onClick={() => updateStatus("COMPLETED")}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-3.5" aria-hidden="true" />}
            Realizado
          </Btn>
        ) : null}

        <Select
          value={status}
          onChange={(e) => updateStatus(e.target.value as AppointmentStatus)}
          disabled={saving}
          className="h-8 w-auto flex-1 px-2.5 pr-6 text-xs"
          aria-label={`Estado del turno de ${client}`}
        >
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        <Btn
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={remind}
          disabled={reminding}
          title="Enviar recordatorio por WhatsApp"
        >
          {reminding ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <MessageCircle className="size-3.5 text-brand" aria-hidden="true" />}
          <span className="sr-only sm:not-sr-only">Recordar</span>
        </Btn>
      </div>
    </div>
  )
}
