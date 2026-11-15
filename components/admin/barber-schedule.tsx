"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { apiRequest, asList, fetcher, type BarberException } from "@/lib/api"
import { formatShortDate, normalizeTime, todayISO, WEEKDAYS_MON_FIRST } from "@/lib/dates"
import { Btn, Field, Input } from "@/components/ds/primitives"
import { Toggle, errorMessage } from "./admin-ui"

type DayRow = { active: boolean; start: string; end: string }

const DEFAULT_DAYS: DayRow[] = WEEKDAYS_MON_FIRST.map((_, i) => ({ active: i < 6, start: "10:00", end: "20:00" }))

export function BarberSchedule({ barberId }: { barberId: number }) {
  const [days, setDays] = useState<DayRow[]>(DEFAULT_DAYS)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const exKey = `/api/barbers/${barberId}/exceptions`
  const { data, mutate } = useSWR(exKey, fetcher)
  const exceptions = asList<BarberException>(data, "exceptions")

  const [exDate, setExDate] = useState(todayISO)
  const [fullDay, setFullDay] = useState(true)
  const [blockedStart, setBlockedStart] = useState("13:00")
  const [blockedEnd, setBlockedEnd] = useState("15:00")
  const [reason, setReason] = useState("")
  const [savingEx, setSavingEx] = useState(false)

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function saveSchedule() {
    setSavingSchedule(true)
    try {
      await apiRequest(`/api/barbers/${barberId}/schedule`, {
        method: "POST",
        body: JSON.stringify({
          schedules: days
            .map((d, i) => ({ day_of_week: i, start_time: d.start, end_time: d.end, is_active: d.active }))
            .filter((d) => d.is_active),
        }),
      })
      toast.success("Horarios guardados")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingSchedule(false)
    }
  }

  async function addException(e: React.FormEvent) {
    e.preventDefault()
    setSavingEx(true)
    try {
      await apiRequest(exKey, {
        method: "POST",
        body: JSON.stringify({
          target_date: exDate,
          is_full_day_off: fullDay,
          blocked_start: fullDay ? null : blockedStart,
          blocked_end: fullDay ? null : blockedEnd,
          reason: reason.trim() || null,
        }),
      })
      toast.success("Bloqueo agregado")
      setReason("")
      await mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingEx(false)
    }
  }

  async function removeException(id: number) {
    try {
      await apiRequest(`${exKey}/${id}`, { method: "DELETE" })
      await mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-neutral-500">Horario semanal</h3>
        <ul className="flex flex-col gap-2">
          {WEEKDAYS_MON_FIRST.map((label, i) => (
            <li key={label} className="flex flex-wrap items-center gap-2">
              <label className="flex w-28 items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={days[i].active}
                  onChange={(e) => updateDay(i, { active: e.target.checked })}
                  className="size-4 accent-[var(--color-brand)]"
                />
                {label}
              </label>
              <Input type="time" value={days[i].start} onChange={(e) => updateDay(i, { start: e.target.value })} disabled={!days[i].active} className="h-9 w-28 px-2 text-sm" aria-label={`${label} desde`} />
              <span className="text-neutral-400">–</span>
              <Input type="time" value={days[i].end} onChange={(e) => updateDay(i, { end: e.target.value })} disabled={!days[i].active} className="h-9 w-28 px-2 text-sm" aria-label={`${label} hasta`} />
            </li>
          ))}
        </ul>
        <Btn size="sm" variant="dark" className="mt-3" onClick={saveSchedule} disabled={savingSchedule}>
          {savingSchedule ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar horarios
        </Btn>
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-neutral-500">Bloqueos</h3>
        <form onSubmit={addException} className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
          <Field label="Fecha" htmlFor={`ex-date-${barberId}`} required>
            <Input id={`ex-date-${barberId}`} type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} className="h-10" required />
          </Field>
          <Toggle checked={fullDay} onChange={setFullDay} label="Día completo libre" />
          {!fullDay ? (
            <div className="flex items-center gap-2">
              <Input type="time" value={blockedStart} onChange={(e) => setBlockedStart(e.target.value)} className="h-10" aria-label="Bloqueo desde" />
              <span className="text-neutral-400">–</span>
              <Input type="time" value={blockedEnd} onChange={(e) => setBlockedEnd(e.target.value)} className="h-10" aria-label="Bloqueo hasta" />
            </div>
          ) : null}
          <Field label="Motivo" htmlFor={`ex-reason-${barberId}`}>
            <Input id={`ex-reason-${barberId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" />
          </Field>
          <Btn type="submit" size="sm" className="self-start" disabled={savingEx}>
            {savingEx ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Agregar bloqueo
          </Btn>
        </form>

        {exceptions.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {exceptions.map((ex) => {
              const d = ex.target_date ?? ex.date
              return (
                <li key={ex.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-ink">{d ? formatShortDate(d) : "—"}</span>
                    <span className="text-neutral-500">
                      {" · "}
                      {ex.is_full_day_off
                        ? "Día completo"
                        : `${normalizeTime(ex.blocked_start ?? "")} – ${normalizeTime(ex.blocked_end ?? "")}`}
                      {ex.reason ? ` · ${ex.reason}` : ""}
                    </span>
                  </div>
                  <Btn variant="ghost" size="sm" className="size-8 p-0 text-destructive" onClick={() => removeException(ex.id)} aria-label="Eliminar bloqueo">
                    <Trash2 className="size-4" />
                  </Btn>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
