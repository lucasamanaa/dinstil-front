"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Loader2, Pencil, Plus, Scissors, Trash2 } from "lucide-react"
import { apiRequest, asList, fetcher, formatPrice, type Service } from "@/lib/api"
import { Btn, Field, Input, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, Panel, errorMessage } from "./admin-ui"

type Draft = { name: string; category: string; price: string; duration_minutes: string }
const EMPTY: Draft = { name: "", category: "", price: "", duration_minutes: "30" }

export function ServicesPanel({ onChanged }: { onChanged?: () => void }) {
  const { data, isLoading, mutate } = useSWR("/api/services", fetcher)
  const services = asList<Service>(data, "services")
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  function startEdit(service?: Service) {
    setEditingId(service ? service.id : "new")
    setDraft(
      service
        ? {
            name: service.name,
            category: service.category ?? "",
            price: String(service.price),
            duration_minutes: String(service.duration_minutes),
          }
        : EMPTY,
    )
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) {
      toast.error("Ingresá el nombre del servicio")
      return
    }
    if (draft.price === "" || isNaN(Number(draft.price))) {
      toast.error("Ingresá un precio válido")
      return
    }
    setSaving(true)
    const body = JSON.stringify({
      name: draft.name.trim(),
      category: draft.category.trim(),
      price: Number(draft.price),
      duration_minutes: Number(draft.duration_minutes) || 30,
    })
    try {
      if (editingId === "new") await apiRequest("/api/services", { method: "POST", body })
      else await apiRequest(`/api/services/${editingId}`, { method: "PUT", body })
      toast.success(editingId === "new" ? "Servicio creado" : "Servicio actualizado")
      setEditingId(null)
      await mutate()
      onChanged?.()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(service: Service) {
    if (!window.confirm(`¿Eliminar "${service.name}"?`)) return
    try {
      await apiRequest(`/api/services/${service.id}`, { method: "DELETE" })
      toast.success("Servicio eliminado")
      await mutate()
      onChanged?.()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const form = (
    <form onSubmit={save} noValidate className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-4">
      <Field label="Nombre" htmlFor="svc-name" required className="col-span-2">
        <Input id="svc-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </Field>
      <Field label="Categoría" htmlFor="svc-cat" className="col-span-2">
        <Input id="svc-cat" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Corte, Barba, Color…" />
      </Field>
      <Field label="Precio" htmlFor="svc-price" required>
        <Input id="svc-price" type="number" min={0} inputMode="numeric" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
      </Field>
      <Field label="Duración (min)" htmlFor="svc-dur" required>
        <Input id="svc-dur" type="number" min={5} step={5} inputMode="numeric" value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} />
      </Field>
      <div className="col-span-2 flex justify-end gap-2">
        <Btn type="button" variant="ghost" onClick={() => setEditingId(null)}>
          Cancelar
        </Btn>
        <Btn type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar
        </Btn>
      </div>
    </form>
  )

  return (
    <Panel
      title="Servicios"
      description="Lo que tus clientes pueden reservar"
      action={
        editingId === null ? (
          <Btn size="sm" onClick={() => startEdit()}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo
          </Btn>
        ) : null
      }
    >
      {editingId === "new" ? <div className="mb-4">{form}</div> : null}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : services.length === 0 && editingId !== "new" ? (
        <EmptyBlock icon={<Scissors className="size-6" />} title="Todavía no hay servicios" text="Agregá tu primer servicio para habilitar las reservas." />
      ) : (
        <ul className="divide-y divide-border">
          {services.map((service) =>
            editingId === service.id ? (
              <li key={service.id} className="py-3">
                {form}
              </li>
            ) : (
              <li key={service.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{service.name}</p>
                  <p className="text-[13px] text-neutral-500">
                    {service.duration_minutes} min{service.category ? ` · ${service.category}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-copper">{formatPrice(service.price)}</span>
                <Btn variant="ghost" size="sm" className="size-9 p-0" onClick={() => startEdit(service)} aria-label={`Editar ${service.name}`}>
                  <Pencil className="size-4" />
                </Btn>
                <Btn variant="ghost" size="sm" className="size-9 p-0 text-destructive" onClick={() => remove(service)} aria-label={`Eliminar ${service.name}`}>
                  <Trash2 className="size-4" />
                </Btn>
              </li>
            ),
          )}
        </ul>
      )}
    </Panel>
  )
}
