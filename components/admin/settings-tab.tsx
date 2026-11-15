"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { apiRequest, type Shop } from "@/lib/api"
import { TIME_OPTIONS_24H } from "@/lib/dates"
import { Btn, Field, Input, Select } from "@/components/ds/primitives"
import { Checkbox, DAY_OPTIONS, Panel, Toggle, errorMessage } from "./admin-ui"

export function SettingsTab({ shop, onSaved }: { shop?: Shop | null; onSaved: () => void }) {
  const initialSplit = shop?.split_shift ?? (shop?.break_start || shop?.break_end ? true : true)

  const [name, setName] = useState(shop?.name ?? "DIN STIL")
  const [address, setAddress] = useState(shop?.address ?? "")
  const [phone, setPhone] = useState(shop?.phone ?? "")
  const [splitShift, setSplitShift] = useState<boolean>(initialSplit)
  const [morningStart, setMorningStart] = useState(shop?.morning_start?.slice(0, 5) ?? shop?.opening_time?.slice(0, 5) ?? "09:00")
  const [morningEnd, setMorningEnd] = useState(shop?.morning_end?.slice(0, 5) ?? shop?.break_start?.slice(0, 5) ?? "14:00")
  const [afternoonStart, setAfternoonStart] = useState(shop?.afternoon_start?.slice(0, 5) ?? shop?.break_end?.slice(0, 5) ?? "17:00")
  const [afternoonEnd, setAfternoonEnd] = useState(shop?.afternoon_end?.slice(0, 5) ?? shop?.closing_time?.slice(0, 5) ?? "22:00")
  const [opening, setOpening] = useState(shop?.opening_time?.slice(0, 5) ?? "09:00")
  const [closing, setClosing] = useState(shop?.closing_time?.slice(0, 5) ?? "22:00")

  const [days, setDays] = useState<number[]>(
    shop?.open_days ? shop.open_days.split(",").map((d) => Number(d.trim())) : [0, 1, 2, 3, 4, 5],
  )
  const [requireDeposit, setRequireDeposit] = useState(Boolean(shop?.require_deposit))
  const [depositPercent, setDepositPercent] = useState(String(shop?.deposit_percent ?? shop?.deposit_percentage ?? 30))
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre de la barbería es obligatorio")
      return
    }
    if (days.length === 0) {
      toast.error("Seleccioná al menos un día de apertura")
      return
    }

    const startTime = splitShift ? morningStart : opening
    const endTime = splitShift ? afternoonEnd : closing
    const breakStart = splitShift ? morningEnd : null
    const breakEnd = splitShift ? afternoonStart : null

    const schedules = Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      is_active: days.includes(i),
      start_time: startTime,
      end_time: endTime,
      break_start: breakStart,
      break_end: breakEnd,
      split_shift: splitShift,
      morning_start: morningStart,
      morning_end: morningEnd,
      afternoon_start: afternoonStart,
      afternoon_end: afternoonEnd,
    }))

    setSaving(true)
    try {
      await apiRequest("/api/setup/shop", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          split_shift: splitShift,
          morning_start: morningStart,
          morning_end: morningEnd,
          afternoon_start: afternoonStart,
          afternoon_end: afternoonEnd,
          opening_time: startTime,
          closing_time: endTime,
          break_start: breakStart,
          break_end: breakEnd,
          open_days: [...days].sort().join(","),
          require_deposit: requireDeposit,
          deposit_percent: Number(depositPercent) || 30,
          deposit_percentage: Number(depositPercent) || 30,
          schedules,
        }),
      })
      toast.success("Datos y horarios de la barbería guardados")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-5 lg:grid-cols-2">
      <Panel title="Datos de la barbería">
        <div className="flex flex-col gap-4">
          <Field label="Nombre" htmlFor="shop-name" required>
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="DIN STIL" />
          </Field>
          <Field label="Dirección" htmlFor="shop-address">
            <Input id="shop-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Villegas 456" />
          </Field>
          <Field label="Teléfono / WhatsApp" htmlFor="shop-phone">
            <Input id="shop-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5492804875252" />
          </Field>
        </div>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel title="Horario general de apertura">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={splitShift}
              onChange={setSplitShift}
              label="Horario cortado (Mañana y Tarde)"
              description="Cierre intermedio al mediodía (ej: abre 09:00 a 14:00 y 17:00 a 22:00)"
            />

            {splitShift ? (
              <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Turno Mañana</span>
                  <div className="flex items-center gap-2">
                    <Select value={morningStart} onChange={(e) => setMorningStart(e.target.value)} className="h-10 w-28 px-3 text-sm" aria-label="Mañana desde">
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </Select>
                    <span className="text-neutral-400">a</span>
                    <Select value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} className="h-10 w-28 px-3 text-sm" aria-label="Mañana hasta">
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Turno Tarde</span>
                  <div className="flex items-center gap-2">
                    <Select value={afternoonStart} onChange={(e) => setAfternoonStart(e.target.value)} className="h-10 w-28 px-3 text-sm" aria-label="Tarde desde">
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </Select>
                    <span className="text-neutral-400">a</span>
                    <Select value={afternoonEnd} onChange={(e) => setAfternoonEnd(e.target.value)} className="h-10 w-28 px-3 text-sm" aria-label="Tarde hasta">
                      {TIME_OPTIONS_24H.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={opening} onChange={(e) => setOpening(e.target.value)} className="h-10 w-32 px-3 text-sm" aria-label="Apertura">
                  {TIME_OPTIONS_24H.map((t) => (
                    <option key={t} value={t}>{t} hs</option>
                  ))}
                </Select>
                <span className="text-neutral-400">a</span>
                <Select value={closing} onChange={(e) => setClosing(e.target.value)} className="h-10 w-32 px-3 text-sm" aria-label="Cierre">
                  {TIME_OPTIONS_24H.map((t) => (
                    <option key={t} value={t}>{t} hs</option>
                  ))}
                </Select>
              </div>
            )}

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Días de apertura</legend>
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
          </div>
        </Panel>

        <Panel title="Seña">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={requireDeposit}
              onChange={setRequireDeposit}
              label="Pedir seña con Mercado Pago"
              description="El cliente es redirigido a Mercado Pago al confirmar la reserva"
            />
            {requireDeposit ? (
              <Field label="Porcentaje de seña" htmlFor="shop-deposit" required>
                <Input id="shop-deposit" type="number" min={1} max={100} value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="w-32" />
              </Field>
            ) : null}
          </div>
        </Panel>

        <Btn type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar cambios
        </Btn>
      </div>
    </form>
  )
}
