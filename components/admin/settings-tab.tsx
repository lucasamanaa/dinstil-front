"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { apiRequest, type Shop } from "@/lib/api"
import { Btn, Field, Input } from "@/components/ds/primitives"
import { Checkbox, DAY_OPTIONS, Panel, Toggle, errorMessage } from "./admin-ui"

export function SettingsTab({ shop, onSaved }: { shop?: Shop | null; onSaved: () => void }) {
  const [name, setName] = useState(shop?.name ?? "")
  const [address, setAddress] = useState(shop?.address ?? "")
  const [phone, setPhone] = useState(shop?.phone ?? "")
  const [opening, setOpening] = useState(shop?.opening_time?.slice(0, 5) ?? "10:00")
  const [closing, setClosing] = useState(shop?.closing_time?.slice(0, 5) ?? "20:00")
  const [days, setDays] = useState<number[]>(
    shop?.open_days ? shop.open_days.split(",").map((d) => Number(d.trim())) : [0, 1, 2, 3, 4, 5],
  )
  const [requireDeposit, setRequireDeposit] = useState(Boolean(shop?.require_deposit))
  const [depositPercent, setDepositPercent] = useState(String(shop?.deposit_percent ?? 20))
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest("/api/setup/shop", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          opening_time: opening,
          closing_time: closing,
          open_days: [...days].sort().join(","),
          require_deposit: requireDeposit,
          deposit_percent: Number(depositPercent) || 20,
        }),
      })
      toast.success("Datos de la barbería guardados")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
      <Panel title="Datos de la barbería">
        <div className="flex flex-col gap-4">
          <Field label="Nombre" htmlFor="shop-name" required>
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Din Stil Barbería" required />
          </Field>
          <Field label="Dirección" htmlFor="shop-address">
            <Input id="shop-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Teléfono / WhatsApp" htmlFor="shop-phone">
            <Input id="shop-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 2345 6789" />
          </Field>
        </div>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel title="Horario general">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input type="time" value={opening} onChange={(e) => setOpening(e.target.value)} aria-label="Apertura" />
              <span className="text-neutral-400">–</span>
              <Input type="time" value={closing} onChange={(e) => setClosing(e.target.value)} aria-label="Cierre" />
            </div>
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
              description="El cliente abona un porcentaje al reservar"
            />
            {requireDeposit ? (
              <Field label="Porcentaje de seña" htmlFor="shop-deposit" required>
                <Input id="shop-deposit" type="number" min={1} max={100} value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="w-32" />
              </Field>
            ) : null}
          </div>
        </Panel>

        <Btn type="submit" size="lg" disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar cambios
        </Btn>
      </div>
    </form>
  )
}
