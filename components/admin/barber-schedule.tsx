"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { ApiError, apiRequest, asList, fetcher, type BarberException, type ScheduleRow } from "@/lib/api"
import { formatDMY, maskDMYInput, normalizeTime, parseDMYToISO, formatTimeOptionLabel, TIME_OPTIONS_24H, todayISO, WEEKDAYS_MON_FIRST } from "@/lib/dates"
import { Btn, Field, Input, Select } from "@/components/ds/primitives"
import { Toggle, errorMessage } from "./admin-ui"

type DayRow = {
  active: boolean
  split: boolean
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

const DEFAULT_DAYS: DayRow[] = WEEKDAYS_MON_FIRST.map((_, i) => ({
  active: i < 6,
  split: true,
  morningStart: "09:00",
  morningEnd: "14:00",
  afternoonStart: "17:00",
  afternoonEnd: "22:00",
}))

async function scheduleFetcher(path: string) {
  try {
    return await fetcher<{ schedules?: ScheduleRow[] } | ScheduleRow[]>(path)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    return null
  }
}

export function BarberSchedule({ barberId }: { barberId: number }) {
  const [days, setDays] = useState<DayRow[]>(DEFAULT_DAYS)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const { data: scheduleData, mutate: mutateSchedule } = useSWR(`/api/barbers/${barberId}/schedule`, scheduleFetcher)

  useEffect(() => {
    const rows = asList<ScheduleRow>(scheduleData, "schedules")
    if (rows.length > 0) {
      setDays(
        WEEKDAYS_MON_FIRST.map((_, i) => {
          const found = rows.find((r) => r.day_of_week === i)
          if (!found) return DEFAULT_DAYS[i]
          const hasSplit = Boolean(found.split_shift ?? (found.break_start && found.break_end))
          return {
            active: Boolean(found.is_active),
            split: hasSplit,
            morningStart: (found.morning_start ?? found.start_time ?? "09:00").slice(0, 5),
            morningEnd: (found.morning_end ?? found.break_start ?? "14:00").slice(0, 5),
            afternoonStart: (found.afternoon_start ?? found.break_end ?? "17:00").slice(0, 5),
            afternoonEnd: (found.afternoon_end ?? found.end_time ?? "22:00").slice(0, 5),
          }
        }),
      )
    }
  }, [scheduleData])

  const exKey = `/api/barbers/${barberId}/exceptions`
  const { data, mutate } = useSWR(exKey, fetcher)
  const exceptions = asList<BarberException>(data, "exceptions")

  const [exDateDMY, setExDateDMY] = useState(() => formatDMY(todayISO()))
  const [fullDay, setFullDay] = useState(true)
  const [blockedStart, setBlockedStart] = useState("14:00")
  const [blockedEnd, setBlockedEnd] = useState("17:00")
  const [reason, setReason] = useState("")
  const [savingEx, setSavingEx] = useState(false)

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function saveSchedule() {
    setSavingSchedule(true)
    const payload = days.map((d, i) => ({
      day_of_week: i,
      is_active: d.active,
      start_time: d.morningStart,
      end_time: d.split ? d.afternoonEnd : d.morningEnd,
      break_start: d.split ? d.morningEnd : null,
      break_end: d.split ? d.afternoonStart : null,
      split_shift: d.split,
      morning_start: d.morningStart,
      morning_end: d.morningEnd,
      afternoon_start: d.afternoonStart,
      afternoon_end: d.afternoonEnd,
    }))
    try {
      await apiRequest(`/api/barbers/${barberId}/schedule`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      toast.success("Horarios del barbero guardados")
      await mutateSchedule()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingSchedule(false)
    }
  }

  async function addException(e: React.FormEvent) {
    e.preventDefault()
    const isoDate = parseDMYToISO(exDateDMY)
    if (!isoDate) {
      toast.error("Ingresá la fecha en formato DD/MM/AAAA (ej: 20/11/2026)")
      return
    }
    setSavingEx(true)
    try {
      await apiRequest(exKey, {
        method: "POST",
        body: JSON.stringify({
          date: isoDate,
          target_date: isoDate,
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
        <ul className="flex flex-col gap-2.5">
          {WEEKDAYS_MON_FIRST.map((label, i) => (
            <li key={label} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={days[i].active}
                    onChange={(e) => updateDay(i, { active: e.target.checked })}
                    className="size-4 accent-[var(--color-brand)]"
                  />
                  {label}
                </label>
                {days[i].active ? (
                  <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={days[i].split}
                      onChange={(e) => updateDay(i, { split: e.target.checked })}
                      className="size-3.5 accent-[var(--color-copper)]"
                    />
                    Horario cortado (2 turnos)
                  </label>
                ) : (
                  <span className="text-xs text-neutral-400">Cerrado / Franco</span>
                )}
              </div>

              {days[i].active ? (
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-14 text-xs text-neutral-500">{days[i].split ? "Mañana" : "Corrido"}</span>
                    <Select
                      value={days[i].morningStart}
                      onChange={(e) => updateDay(i, { morningStart: e.target.value })}
                      className="h-9 w-26 px-2.5 text-xs"
                      aria-label={`${label} mañana desde`}
                    >
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                      ))}
                    </Select>
                    <span className="text-neutral-400">a</span>
                    <Select
                      value={days[i].morningEnd}
                      onChange={(e) => updateDay(i, { morningEnd: e.target.value })}
                      className="h-9 w-26 px-2.5 text-xs"
                      aria-label={`${label} mañana hasta`}
                    >
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                      ))}
                    </Select>
                  </div>
                  {days[i].split ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-14 text-xs text-neutral-500 sm:w-auto sm:pl-2">Tarde</span>
                      <Select
                        value={days[i].afternoonStart}
                        onChange={(e) => updateDay(i, { afternoonStart: e.target.value })}
                        className="h-9 w-26 px-2.5 text-xs"
                        aria-label={`${label} tarde desde`}
                      >
                        {TIME_OPTIONS_24H.map((t) => (
                          <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                        ))}
                      </Select>
                      <span className="text-neutral-400">a</span>
                      <Select
                        value={days[i].afternoonEnd}
                        onChange={(e) => updateDay(i, { afternoonEnd: e.target.value })}
                        className="h-9 w-26 px-2.5 text-xs"
                        aria-label={`${label} tarde hasta`}
                      >
                        {TIME_OPTIONS_24H.map((t) => (
                          <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                        ))}
                      </Select>
                    </div>
                  ) : null}
                </div>
              ) : null}
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
        <form onSubmit={addException} noValidate className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
          <Field label="Fecha (DD/MM/AAAA)" htmlFor={`ex-date-${barberId}`} required>
            <Input
              id={`ex-date-${barberId}`}
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={exDateDMY}
              onChange={(e) => setExDateDMY(maskDMYInput(e.target.value))}
              className="h-10"
            />
          </Field>
          <Toggle checked={fullDay} onChange={setFullDay} label="Día completo libre" />
          {!fullDay ? (
            <div className="flex items-center gap-2">
              <Select value={blockedStart} onChange={(e) => setBlockedStart(e.target.value)} className="h-10 w-32 px-3 text-sm" aria-label="Bloqueo desde">
                {TIME_OPTIONS_24H.map((t) => (
                  <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                ))}
              </Select>
              <span className="text-neutral-400">a</span>
              <Select value={blockedEnd} onChange={(e) => setBlockedEnd(e.target.value)} className="h-10 w-32 px-3 text-sm" aria-label="Bloqueo hasta">
                {TIME_OPTIONS_24H.map((t) => (
                  <option key={t} value={t}>{formatTimeOptionLabel(t)}</option>
                ))}
              </Select>
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
                    <span className="font-medium text-ink">{d ? formatDMY(d) : "—"}</span>
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
