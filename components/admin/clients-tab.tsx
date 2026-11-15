"use client"

import { useState } from "react"
import useSWR from "swr"
import { Cake, Search, UserRound } from "lucide-react"
import { asList, fetcher, type Client } from "@/lib/api"
import { formatShortDate } from "@/lib/dates"
import { Initials, Input, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, Panel } from "./admin-ui"

export function ClientsTab() {
  const { data, isLoading, error } = useSWR("/api/clients", fetcher)
  const clients = asList<Client>(data, "clients")
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()
  const filtered = q
    ? clients.filter((c) => [c.first_name, c.last_name, c.phone, c.email].filter(Boolean).join(" ").toLowerCase().includes(q))
    : clients

  return (
    <Panel
      title="Clientes"
      description={clients.length ? `${clients.length} registrados` : undefined}
      action={
        <div className="relative w-48 sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar" className="h-9 pl-9 text-sm" aria-label="Buscar clientes" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : error || filtered.length === 0 ? (
        <EmptyBlock
          icon={<UserRound className="size-6" />}
          title={error ? "No se pudieron cargar los clientes" : q ? "Sin resultados" : "Todavía no hay clientes"}
          text={!error && !q ? "Se agregan automáticamente cuando reservan." : undefined}
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre"
            const visits = c.visits ?? c.appointments_count
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <Initials name={name} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{name}</p>
                  <p className="truncate text-[13px] text-neutral-500">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:text-ink">
                        {c.phone}
                      </a>
                    ) : null}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </div>
                {c.birth_date ? (
                  <span className="hidden items-center gap-1 text-xs text-neutral-500 sm:inline-flex">
                    <Cake className="size-3.5 text-copper" aria-hidden="true" />
                    {formatShortDate(c.birth_date.slice(0, 10)).split(" ").slice(1).join(" ")}
                  </span>
                ) : null}
                {visits != null ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-ink">{visits} visitas</span> : null}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
