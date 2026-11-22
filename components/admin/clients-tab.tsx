"use client"

import { useState } from "react"
import useSWR from "swr"
import { Cake, MessageCircle, Repeat, Search, UserRound } from "lucide-react"
import { asList, fetcher, formatPrice, type Client } from "@/lib/api"
import { formatDMY } from "@/lib/dates"
import { Initials, Input, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, Panel } from "./admin-ui"

export function ClientsTab() {
  const { data, isLoading, error } = useSWR("/api/clients", fetcher)
  const clients = asList<Client>(data, "clients")
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()
  const filtered = q
    ? clients.filter((c) =>
        [c.first_name, c.last_name, c.phone, c.dni, c.email, c.favorite_barber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : clients

  const recurrentCount = clients.filter((c) => (c.total_cuts ?? c.visits ?? 0) >= 2).length
  const birthdayMonthCount = clients.filter((c) => c.is_birthday_month).length
  const totalRevenueAll = clients.reduce((acc, c) => acc + Number(c.total_spent ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen rápido del padrón de clientes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Clientes registrados</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{clients.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Clientes recurrentes (2+)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand">{recurrentCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Recaudado histórico</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-copper">{formatPrice(totalRevenueAll)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Cumpleaños este mes</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{birthdayMonthCount}</p>
        </div>
      </div>

      <Panel
        title="Base de clientes"
        description="Identificados automáticamente por teléfono (y DNI opcional) para medir frecuencia de corte"
        action={
          <div className="relative w-48 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, tel o DNI"
              className="h-9 pl-9 text-sm"
              aria-label="Buscar clientes"
            />
          </div>
        }
      >
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : error || filtered.length === 0 ? (
          <EmptyBlock
            icon={<UserRound className="size-6" />}
            title={error ? "No se pudieron cargar los clientes" : q ? "Sin resultados" : "Todavía no hay clientes"}
            text={!error && !q ? "Se registran automáticamente con su teléfono cuando reservan." : undefined}
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c) => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre"
              const totalVisits = c.total_cuts ?? c.visits ?? 0
              const completed = c.completed_cuts ?? 0
              const waPhone = (c.phone ?? "").replace(/\D/g, "")

              return (
                <li key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3 sm:flex-1 min-w-0">
                    <Initials name={name} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        {c.is_birthday_today ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-copper px-2 py-0.5 text-[11px] font-semibold text-white">
                            <Cake className="size-3" aria-hidden="true" />
                            Cumple hoy
                          </span>
                        ) : c.is_birthday_month ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper">
                            <Cake className="size-3" aria-hidden="true" />
                            Cumple este mes
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="font-medium text-neutral-700 hover:text-ink">
                            {c.phone}
                          </a>
                        ) : null}
                        {c.dni ? ` · DNI ${c.dni}` : ""}
                        {c.email ? ` · ${c.email}` : ""}
                        {c.birth_date ? ` · Nac. ${formatDMY(c.birth_date)}` : ""}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                        {c.last_visit ? (
                          <span>
                            Última visita: <strong className="text-ink">{formatDMY(c.last_visit)}</strong>
                            {c.days_since_last_visit != null
                              ? c.days_since_last_visit === 0
                                ? " (hoy)"
                                : ` (hace ${c.days_since_last_visit} días)`
                              : ""}
                          </span>
                        ) : null}
                        {c.favorite_barber ? <span>Barbero: {c.favorite_barber}</span> : null}
                        {c.favorite_service ? <span>Servicio: {c.favorite_service}</span> : null}
                      </div>
                    </div>
                  </div>

                  {/* Métricas de frecuencia y recaudación del cliente */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                      {totalVisits} {totalVisits === 1 ? "corte" : "cortes"}
                      {completed > 0 && completed !== totalVisits ? ` (${completed} real.)` : ""}
                    </span>

                    {c.avg_days_between_visits != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-ink">
                        <Repeat className="size-3 text-brand" aria-hidden="true" />
                        Cada {Math.round(c.avg_days_between_visits)} días
                      </span>
                    ) : null}

                    {Number(c.total_spent ?? 0) > 0 ? (
                      <span className="rounded-full bg-copper/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-copper">
                        {formatPrice(c.total_spent)}
                      </span>
                    ) : null}

                    {waPhone ? (
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-brand transition-colors hover:border-brand hover:bg-brand/5"
                        title={`Escribir por WhatsApp a ${name}`}
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
