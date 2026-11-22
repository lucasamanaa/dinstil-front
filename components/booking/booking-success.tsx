"use client"

import { toast } from "sonner"
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react"
import { formatPrice } from "@/lib/api"
import { formatLongDate } from "@/lib/dates"
import { BrandLogo } from "@/components/brand-logo"
import { Btn } from "@/components/ds/primitives"

export function BookingSuccess({
  shopName,
  address,
  date,
  time,
  barber,
  serviceName,
  total,
  requiresDeposit,
  depositAmount,
  mpAlias,
  mpAccountHolder,
  mercadopagoUrl,
  proofWameUrl,
  onRestart,
}: {
  shopName?: string | null
  address?: string | null
  date: string
  time: string
  barber: string
  serviceName: string
  total: number
  requiresDeposit?: boolean
  depositAmount?: number
  mpAlias?: string | null
  mpAccountHolder?: string | null
  mercadopagoUrl?: string | null
  proofWameUrl?: string | null
  onRestart: () => void
}) {
  const rows = [
    { label: "Fecha", value: formatLongDate(date) },
    { label: "Hora", value: `${time} hs` },
    { label: "Servicio", value: serviceName },
    { label: "Barbero", value: barber },
    ...(address ? [{ label: "Dirección", value: address }] : []),
  ]

  function copyAlias() {
    if (!mpAlias) return
    navigator.clipboard.writeText(mpAlias)
    toast.success(`Alias "${mpAlias}" copiado`)
  }

  return (
    <section className="flex flex-1 flex-col items-center px-5 pb-10 pt-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand text-white animate-in zoom-in-50 duration-300">
        <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">
        {requiresDeposit ? "Turno pre-reservado" : "Reserva Confirmada"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {requiresDeposit
          ? "Completá la seña por Mercado Pago para asegurar tu lugar."
          : "Te esperamos. Guardá estos datos."}
      </p>

      {requiresDeposit ? (
        <div className="mt-6 w-full rounded-2xl border border-copper/40 bg-copper/[0.06] p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-copper">Seña requerida</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatPrice(depositAmount ?? 0)}</p>
          {mpAlias ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-500">Alias Mercado Pago</p>
                <p className="truncate font-mono text-sm font-bold text-ink">{mpAlias}</p>
                {mpAccountHolder ? <p className="truncate text-xs text-neutral-500">Titular: {mpAccountHolder}</p> : null}
              </div>
              <Btn type="button" size="sm" variant="dark" onClick={copyAlias}>
                <Copy className="size-3.5" aria-hidden="true" />
                Copiar
              </Btn>
            </div>
          ) : null}
          {proofWameUrl ? (
            <Btn
              type="button"
              size="md"
              variant="primary"
              className="mt-3 w-full"
              onClick={() => window.open(proofWameUrl, "_blank", "noopener,noreferrer")}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Enviar comprobante por WhatsApp
            </Btn>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 w-full overflow-hidden rounded-2xl border border-border bg-white text-left">
        <div className="flex items-center justify-center border-b border-dashed border-neutral-300 py-4">
          <BrandLogo name={shopName} />
        </div>
        <dl className="divide-y divide-border px-5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[13px] text-neutral-500">{row.label}</dt>
              <dd className="text-right text-[14px] font-medium first-letter:uppercase text-ink">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-4">
            <dt className="text-[13px] font-medium text-ink">Total</dt>
            <dd className="text-lg font-semibold text-copper">{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex w-full flex-col gap-2.5">
        {requiresDeposit && mercadopagoUrl ? (
          <Btn size="lg" className="w-full" onClick={() => window.open(mercadopagoUrl, "_blank", "noopener,noreferrer")}>
            Abonar seña con Mercado Pago
            <ExternalLink className="size-4" aria-hidden="true" />
          </Btn>
        ) : null}
        <Btn size="lg" variant="outline" className="w-full" onClick={onRestart}>
          Hacer otra reserva
        </Btn>
      </div>
    </section>
  )
}
