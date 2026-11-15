"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Ticket, Trash2 } from "lucide-react"
import { apiRequest, asList, fetcher, type Coupon } from "@/lib/api"
import { normalizeTime } from "@/lib/dates"
import { Btn, Field, Input, Skeleton } from "@/components/ds/primitives"
import { Checkbox, DAY_OPTIONS, EmptyBlock, Panel, errorMessage } from "./admin-ui"

function daysLabel(value?: string | null) {
  if (!value) return "Todos los días"
  const ids = value.split(",").map((v) => Number(v.trim()))
  if (ids.length === 7) return "Todos los días"
  return DAY_OPTIONS.filter((d) => ids.includes(d.value))
    .map((d) => d.label)
    .join(", ")
}

export function CouponsTab() {
  const { data, isLoading, mutate } = useSWR("/api/coupons", fetcher)
  const coupons = asList<Coupon>(data, "coupons")

  const [code, setCode] = useState("")
  const [percent, setPercent] = useState("10")
  const [days, setDays] = useState<number[]>([])
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [saving, setSaving] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest("/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount_percent: Number(percent),
          valid_days: days.length ? [...days].sort().join(",") : null,
          valid_start_time: start || null,
          valid_end_time: end || null,
        }),
      })
      toast.success("Cupón creado")
      setCode("")
      setDays([])
      setStart("")
      setEnd("")
      await mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(coupon: Coupon) {
    if (!window.confirm(`¿Eliminar el cupón ${coupon.code}?`)) return
    try {
      await apiRequest(`/api/coupons/${coupon.id}`, { method: "DELETE" })
      await mutate()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Panel title="Nuevo cupón" description="Descuentos por día y franja horaria">
        <form onSubmit={create} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Código" htmlFor="cp-code" required>
              <Input id="cp-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="uppercase tracking-wider" placeholder="DOMINGO20" required />
            </Field>
            <Field label="% desc." htmlFor="cp-pct" required>
              <Input id="cp-pct" type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} required />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">
              Días válidos <span className="font-normal text-neutral-400">· vacío = todos</span>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((d) => (
                <Checkbox
                  key={d.value}
                  label={d.label}
                  checked={days.includes(d.value)}
                  onChange={(c) => setDays((prev) => (c ? [...prev, d.value] : prev.filter((x) => x !== d.value)))}
                />
              ))}
            </div>
          </fieldset>
          <Field label="Franja horaria" hint="Ej: 13:00 a 16:00">
            <div className="flex items-center gap-2">
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Desde" />
              <span className="text-neutral-400">–</span>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Hasta" />
            </div>
          </Field>
          <Btn type="submit" disabled={saving || !code.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Crear cupón
          </Btn>
        </form>
      </Panel>

      <Panel title="Cupones activos">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : coupons.length === 0 ? (
          <EmptyBlock icon={<Ticket className="size-6" />} title="Sin cupones" text="Creá promos para llenar horarios flojos." />
        ) : (
          <ul className="divide-y divide-border">
            {coupons.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="rounded-lg border border-dashed border-copper px-2.5 py-1 font-mono text-sm font-semibold tracking-wider text-copper">{c.code}</span>
                <div className="min-w-0 flex-1 text-[13px] text-neutral-500">
                  <span className="font-semibold text-ink">-{c.discount_percent}%</span> · {daysLabel(c.valid_days)}
                  {c.valid_start_time && c.valid_end_time ? ` · ${normalizeTime(c.valid_start_time)}–${normalizeTime(c.valid_end_time)}` : ""}
                </div>
                <Btn variant="ghost" size="sm" className="size-9 p-0 text-destructive" onClick={() => remove(c)} aria-label={`Eliminar ${c.code}`}>
                  <Trash2 className="size-4" />
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
