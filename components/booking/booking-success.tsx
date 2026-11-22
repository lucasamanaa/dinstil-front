"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react"
import { formatPrice } from "@/lib/api"
import { formatDMY, formatLongDate } from "@/lib/dates"
import { BrandLogo } from "@/components/brand-logo"
import { Btn } from "@/components/ds/primitives"

function normalizeArPhone(raw?: string | null): string {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (!digits) return ""
  const clean = digits.startsWith("0") ? digits.slice(1) : digits
  if (clean.startsWith("549")) return clean
  if (clean.startsWith("54")) return `549${clean.slice(2)}`
  return `549${clean}`
}

export function BookingSuccess({
  shopName,
  address,
  shopPhone,
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
  shopPhone?: string | null
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
  const [copied, setCopied] = useState(false)

  const rows = [
    { label: "Fecha", value: formatLongDate(date) },
    { label: "Hora", value: `${time} hs` },
    { label: "Servicio", value: serviceName },
    { label: "Barbero", value: barber },
    ...(address ? [{ label: "Dirección", value: address }] : []),
  ]

  const fallbackProofMsg = `Hola ${shopName?.trim() || "DIN STIL"}, te envío el comprobante de seña (${formatPrice(depositAmount ?? 0)}) para mi turno de ${serviceName} con ${barber} el ${formatDMY(date)} a las ${time} hs.`
  const targetShopPhone = normalizeArPhone(shopPhone)
  const whatsappProofUrl =
    proofWameUrl ||
    (targetShopPhone
      ? `https://wa.me/${targetShopPhone}?text=${encodeURIComponent(fallbackProofMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(fallbackProofMsg)}`)

  async function copyOnlyAlias() {
    const cleanAlias = mpAlias?.trim()
    if (!cleanAlias) return

    let ok = false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanAlias)
        ok = true
      }
    } catch {}

    if (!ok) {
      const el = document.createElement("textarea")
      el.value = cleanAlias
      el.setAttribute("readonly", "")
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      el.setSelectionRange(0, cleanAlias.length)
      try {
        document.execCommand("copy")
        ok = true
      } catch {}
      document.body.removeChild(el)
    }

    if (ok) {
      setCopied(true)
      toast.success(`Alias "${cleanAlias}" copiado`)
      setTimeout(() => setCopied(false), 2500)
    } else {
      toast.error("Mantené presionado el alias para copiarlo.")
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-full flex-1 flex-col items-center overflow-x-hidden px-4 pb-8 pt-6 text-center touch-pan-y sm:px-5 sm:pt-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white animate-in zoom-in-50 duration-300 sm:size-14">
        <Check className="size-6 sm:size-7" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <h1 className="mt-3.5 text-xl font-semibold tracking-tight text-ink sm:text-[22px]">
        {requiresDeposit ? "Turno pre-reservado" : "Reserva Confirmada"}
      </h1>
      <p className="mt-1 text-[13px] text-neutral-500 sm:text-sm">
        {requiresDeposit
          ? "Transferí la seña para asegurar tu lugar."
          : "Te esperamos. Guardá estos datos."}
      </p>

      {requiresDeposit ? (
        <div className="mt-5 w-full rounded-2xl border border-copper/40 bg-copper/[0.06] p-3.5 text-left sm:p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-copper">Seña requerida</p>
            <p className="text-lg font-bold text-ink sm:text-xl">{formatPrice(depositAmount ?? 0)}</p>
          </div>

          {mpAlias ? (
            <>
              <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-neutral-500">Alias para transferir</p>
                  <p className="select-all truncate font-mono text-sm font-bold text-ink">{mpAlias}</p>
                  {mpAccountHolder ? <p className="truncate text-[11px] text-neutral-500">Titular: {mpAccountHolder}</p> : null}
                </div>
                <Btn type="button" size="sm" variant="dark" onClick={copyOnlyAlias} className="shrink-0">
                  {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  {copied ? "Copiado" : "Copiar"}
                </Btn>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
                1. Tocá <strong>Copiar</strong> · 2. Abrí Mercado Pago o tu banco y pegá el alias · 3. Enviá el comprobante por WhatsApp.
              </p>
            </>
          ) : null}

          <a
            href={whatsappProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white transition-all hover:bg-brand/90 active:scale-[0.98]"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Enviar comprobante por WhatsApp
          </a>
        </div>
      ) : null}

      <div className="mt-5 w-full overflow-hidden rounded-2xl border border-border bg-white text-left">
        <div className="flex items-center justify-center border-b border-dashed border-neutral-300 py-3">
          <BrandLogo name={shopName} />
        </div>
        <dl className="divide-y divide-border px-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 py-2.5">
              <dt className="text-xs text-neutral-500 sm:text-[13px]">{row.label}</dt>
              <dd className="text-right text-[13px] font-medium first-letter:uppercase text-ink sm:text-sm">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <dt className="text-xs font-medium text-ink sm:text-[13px]">Total</dt>
            <dd className="text-base font-semibold text-copper sm:text-lg">{formatPrice(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex w-full flex-col gap-2">
        {requiresDeposit && mercadopagoUrl ? (
          <Btn size="md" className="w-full" onClick={() => { window.location.href = mercadopagoUrl }}>
            Abonar seña con Mercado Pago
            <ExternalLink className="size-4" aria-hidden="true" />
          </Btn>
        ) : null}
        <Btn size="md" variant="outline" className="w-full" onClick={onRestart}>
          Hacer otra reserva
        </Btn>
      </div>
    </section>
  )
}
