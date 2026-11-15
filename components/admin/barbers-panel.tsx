"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { ChevronDown, Loader2, Plus, Users } from "lucide-react"
import { apiRequest, asList, fetcher, type Barber, type Service } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Avatar, Btn, Field, Input, Skeleton } from "@/components/ds/primitives"
import { Checkbox, EmptyBlock, Panel, errorMessage } from "./admin-ui"
import { BarberSchedule } from "./barber-schedule"

export function BarbersPanel({ onChanged }: { onChanged?: () => void }) {
  const { data, isLoading, mutate } = useSWR("/api/barbers", fetcher)
  const { data: servicesData } = useSWR("/api/services", fetcher)
  const barbers = asList<Barber>(data, "barbers")
  const services = asList<Service>(servicesData, "services")

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [photo, setPhoto] = useState("")
  const [serviceIds, setServiceIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  function toggleService(id: number, checked: boolean) {
    setServiceIds((ids) => (checked ? [...ids, id] : ids.filter((x) => x !== id)))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest("/api/barbers", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), photo_url: photo.trim() || null, service_ids: serviceIds }),
      })
      toast.success("Barbero agregado")
      setCreating(false)
      setName("")
      setPhoto("")
      setServiceIds([])
      await mutate()
      onChanged?.()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="Barberos"
      description="Equipo, servicios que realizan y horarios"
      action={
        !creating ? (
          <Btn size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo
          </Btn>
        ) : null
      }
    >
      {creating ? (
        <form onSubmit={create} className="mb-4 flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
          <Field label="Nombre" htmlFor="barber-name" required>
            <Input id="barber-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="URL de foto" htmlFor="barber-photo">
            <Input id="barber-photo" type="url" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">Servicios que realiza</legend>
            {services.length === 0 ? (
              <p className="text-[13px] text-neutral-500">Primero cargá servicios.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <Checkbox key={s.id} label={s.name} checked={serviceIds.includes(s.id)} onChange={(c) => toggleService(s.id, c)} />
                ))}
              </div>
            )}
          </fieldset>
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Btn>
            <Btn type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Guardar
            </Btn>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : barbers.length === 0 && !creating ? (
        <EmptyBlock icon={<Users className="size-6" />} title="Todavía no hay barberos" text="Agregá a tu equipo para que los clientes puedan elegirlos." />
      ) : (
        <ul className="flex flex-col gap-2">
          {barbers.map((barber) => {
            const open = openId === barber.id
            const names = services.filter((s) => barber.service_ids?.includes(s.id)).map((s) => s.name)
            return (
              <li key={barber.id} className="rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : barber.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <Avatar name={barber.name} src={barber.photo_url} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{barber.name}</span>
                    <span className="block truncate text-[13px] text-neutral-500">
                      {names.length ? names.join(", ") : "Horarios y bloqueos"}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 text-neutral-500 transition-transform", open && "rotate-180")} aria-hidden="true" />
                </button>
                {open ? (
                  <div className="border-t border-border p-4">
                    <BarberSchedule barberId={barber.id} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
