"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Percent,
  Users,
  Wallet,
} from "lucide-react"
import { fetcher, formatPrice, type AppointmentStatus, type ReportResponse } from "@/lib/api"
import { addDaysISO, formatDMY, formatLongDate, fromISODate, toISODate, todayISO } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Btn, Skeleton } from "@/components/ds/primitives"
import { EmptyBlock, Panel, errorMessage } from "./admin-ui"

type Period = "day" | "month" | "year"

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const STATUS_ES: Record<AppointmentStatus, string> = {
  COMPLETED: "Realizado",
  CONFIRMED: "Confirmado",
  PENDING_PAYMENT: "Seña pendiente",
  NO_SHOW: "Ausente",
  CANCELLED: "Cancelado",
}

function shiftDate(iso: string, period: Period, delta: number): string {
  if (period === "day") return addDaysISO(iso, delta)
  const d = fromISODate(iso)
  if (period === "month") {
    return toISODate(new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }
  return toISODate(new Date(d.getFullYear() + delta, 0, 1))
}

function formatPeriodLabel(iso: string, period: Period): string {
  const d = fromISODate(iso)
  if (period === "day") return `${formatLongDate(iso)} (${formatDMY(iso)})`
  if (period === "month") return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
  return `Año ${d.getFullYear()}`
}

export function ReportsTab() {
  const [period, setPeriod] = useState<Period>("month")
  const [refDate, setRefDate] = useState(todayISO)

  const { data, isLoading, error } = useSWR<ReportResponse>(
    `/api/reports?period=${period}&target_date=${refDate}`,
    fetcher,
  )

  const maxCash = Math.max(...(data?.timeline.map((t) => t.cash) ?? [0]), 1)

  function exportCSV() {
    if (!data) return
    const rows = data.movements ?? []
    const sep = ";"
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`

    const lines = [
      ["DIN STIL - Reporte Contable", formatPeriodLabel(refDate, period)].map(esc).join(sep),
      ["Caja Recaudada (Solo Realizados)", data.cash_collected, "Turnos Realizados", data.completed_count].map(esc).join(sep),
      ["Pendiente / Proyectado", data.pending_revenue, "Ausentes", data.no_show_count].map(esc).join(sep),
      "",
      ["Fecha", "Hora", "Cliente", "Teléfono", "DNI", "Barbero", "Servicio", "Estado", "Descuento", "Cupón", "Seña", "Importe Facturado"].map(esc).join(sep),
      ...rows.map((m) =>
        [
          formatDMY(m.date),
          `${m.start_time} - ${m.end_time}`,
          m.client_name,
          m.client_phone,
          m.client_dni,
          m.barber_name,
          m.service_name,
          STATUS_ES[m.status] ?? m.status,
          m.discount_applied,
          m.coupon_code,
          m.deposit_amount,
          m.status === "COMPLETED" ? m.total_price : 0,
        ]
          .map(esc)
          .join(sep),
      ),
    ]

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `DIN_STIL_Reporte_${period}_${data.start_date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Reporte CSV descargado para Excel / Contador")
  }

  function exportPDF() {
    if (!data) return
    const rows = data.movements ?? []
    const periodTitle = formatPeriodLabel(refDate, period)
    const win = window.open("", "_blank")
    if (!win) {
      toast.error("Habilitá las ventanas emergentes para generar el PDF")
      return
    }

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>DIN STIL - Reporte Contable - ${periodTitle}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 28px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 0.08em; }
  .sub { color: #555; margin-bottom: 20px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
  .kpi { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
  .kpi.main { background: #2d4428; color: #fff; border-color: #2d4428; }
  .kpi .lbl { font-size: 11px; opacity: 0.8; }
  .kpi .val { font-size: 18px; font-weight: 700; margin-top: 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #2d4428; margin: 18px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border-bottom: 1px solid #e5e5e5; padding: 7px 6px; text-align: left; }
  th { background: #f6f6f6; font-size: 11px; color: #444; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <h1>DIN STIL · REPORTE DE CAJA Y MOVIMIENTOS</h1>
  <p class="sub">Período: <strong>${periodTitle}</strong> (${formatDMY(data.start_date)} al ${formatDMY(data.end_date)})</p>
  <div class="kpis">
    <div class="kpi main"><div class="lbl">Caja Recaudada (Realizados)</div><div class="val">${formatPrice(data.cash_collected)}</div></div>
    <div class="kpi"><div class="lbl">Pendiente / Confirmados</div><div class="val">${formatPrice(data.pending_revenue)}</div></div>
    <div class="kpi"><div class="lbl">Turnos Realizados</div><div class="val">${data.completed_count}</div></div>
    <div class="kpi"><div class="lbl">Ticket Promedio</div><div class="val">${formatPrice(data.average_ticket)}</div></div>
  </div>

  <h2>Resumen por Barbero</h2>
  <table>
    <thead><tr><th>Barbero</th><th class="num">Realizados</th><th class="num">Pendientes</th><th class="num">Ausentes</th><th class="num">Caja Recaudada</th></tr></thead>
    <tbody>
      ${data.by_barber
        .map(
          (b) =>
            `<tr><td>${b.barber_name}</td><td class="num">${b.completed_count}</td><td class="num">${b.confirmed_count}</td><td class="num">${b.no_show_count}</td><td class="num"><strong>${formatPrice(b.cash_collected)}</strong></td></tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <h2>Detalle de Movimientos (${rows.length})</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>DNI</th><th>Barbero</th><th>Servicio</th><th>Estado</th><th class="num">Facturado</th></tr></thead>
    <tbody>
      ${rows
        .map(
          (m) =>
            `<tr><td>${formatDMY(m.date)}</td><td>${m.start_time}</td><td>${m.client_name}</td><td>${m.client_dni || "—"}</td><td>${m.barber_name}</td><td>${m.service_name}</td><td>${STATUS_ES[m.status] ?? m.status}</td><td class="num">${m.status === "COMPLETED" ? formatPrice(m.total_price) : "$0"}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-white p-1">
          {(
            [
              { id: "day", label: "Diario" },
              { id: "month", label: "Mensual" },
              { id: "year", label: "Anual" },
            ] as { id: Period; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                period === item.id ? "bg-brand text-white" : "text-neutral-600 hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setRefDate(shiftDate(refDate, period, -1))} aria-label="Período anterior">
            <ChevronLeft className="size-4" />
          </Btn>
          <span className="flex h-10 items-center rounded-xl border border-input bg-white px-4 text-sm font-semibold text-ink first-letter:uppercase">
            {formatPeriodLabel(refDate, period)}
          </span>
          <Btn variant="outline" size="sm" className="size-10 p-0" onClick={() => setRefDate(shiftDate(refDate, period, 1))} aria-label="Período siguiente">
            <ChevronRight className="size-4" />
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => setRefDate(todayISO())}>
            Actual
          </Btn>
        </div>
      </div>

      {/* Barra de exportación para contador */}
      {data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Download className="size-4 text-copper" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">Exportación para contador</p>
              <p className="text-xs text-neutral-500">
                Descargá el detalle completo de movimientos y facturación del período seleccionado ({data.movements?.length ?? 0} registros)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Btn type="button" variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="size-4 text-brand" aria-hidden="true" />
              Descargar CSV
            </Btn>
            <Btn type="button" variant="dark" size="sm" onClick={exportPDF}>
              <FileText className="size-4" aria-hidden="true" />
              Descargar PDF
            </Btn>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : error || !data ? (
        <EmptyBlock icon={<BarChart3 className="size-6" />} title="No se pudieron cargar los reportes" text={errorMessage(error)} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-brand/30 bg-brand p-5 text-white">
              <div className="flex items-center justify-between text-xs font-medium text-white/80">
                <span>Caja recaudada</span>
                <Wallet className="size-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{formatPrice(data.cash_collected)}</p>
              <p className="mt-1 text-xs text-white/75">
                Suma solo turnos marcados como Realizados ({data.completed_count})
              </p>
            </div>

            <div className="rounded-2xl border border-copper/30 bg-copper/[0.05] p-5">
              <div className="flex items-center justify-between text-xs font-medium text-copper">
                <span>Pendiente / Proyectado</span>
                <Clock className="size-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{formatPrice(data.pending_revenue)}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {data.confirmed_count} confirmados sin cerrar · Ticket prom. {formatPrice(data.average_ticket)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                <span>{period === "day" ? "Ocupación del día" : "Tasa de realizados"}</span>
                <Percent className="size-4 text-brand" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">
                {period === "day" ? `${data.occupancy_rate ?? 0}%` : `${data.completion_rate}%`}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Completados: {data.completion_rate}% · Ausencias: {data.no_show_rate}%
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                <span>Personas atendidas</span>
                <Users className="size-4 text-copper" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{data.unique_clients}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {data.active_bookings} turnos activos · {data.no_show_count} ausentes · {data.cancelled_count} cancel.
              </p>
            </div>
          </div>

          <Panel
            title={
              period === "day"
                ? "Actividad por hora"
                : period === "month"
                  ? "Recaudación por día del mes"
                  : "Recaudación mensual del año"
            }
            description="Barras verdes representan dinero efectivamente recaudado (Realizados)"
          >
            {data.timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">No hay movimientos registrados en este período.</p>
            ) : (
              <div className="no-scrollbar flex h-48 items-end gap-2 overflow-x-auto pt-6 pb-2">
                {data.timeline.map((item) => {
                  const pct = Math.max(4, Math.round((item.cash / maxCash) * 100))
                  return (
                    <div key={item.label} className="flex min-w-[44px] flex-1 flex-col items-center gap-1.5">
                      <span className="text-[11px] font-semibold tabular-nums text-copper">
                        {item.cash > 0 ? formatPrice(item.cash) : "—"}
                      </span>
                      <div className="flex h-28 w-full items-end justify-center rounded-lg bg-neutral-100/80 p-1">
                        <div
                          className={cn(
                            "w-full max-w-[36px] rounded-md transition-all",
                            item.cash > 0 ? "bg-brand" : "bg-neutral-300",
                          )}
                          style={{ height: `${item.cash > 0 ? pct : 6}%` }}
                          title={`${item.label}: ${formatPrice(item.cash)} (${item.count} turnos)`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-600">{item.label}</span>
                      <span className="text-[10px] text-neutral-400">{item.count} t.</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Recaudación por barbero" description="Ordenado por caja efectivamente cobrada">
              {data.by_barber.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin datos de barberos.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.by_barber.map((b) => (
                    <li key={b.barber_id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{b.barber_name}</p>
                        <p className="text-xs text-neutral-500">
                          {b.completed_count} realizados · {b.confirmed_count} pendientes · {b.no_show_count} ausentes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-brand">{formatPrice(b.cash_collected)}</p>
                        {b.pending_revenue > 0 ? (
                          <p className="text-[11px] tabular-nums text-copper">+{formatPrice(b.pending_revenue)} pend.</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Servicios realizados" description="Detalle de servicios cerrados en el período">
              {data.by_service.length === 0 ? (
                <p className="text-sm text-neutral-500">Todavía no hay servicios marcados como realizados en este período.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.by_service.map((s) => (
                    <li key={s.service_id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CheckCircle2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{s.service_name}</p>
                          <p className="text-xs text-neutral-500">
                            {s.count} {s.count === 1 ? "realizado" : "realizados"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-copper">{formatPrice(s.cash_collected)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
