"use client"

import { toast } from "sonner"
import { Check, Copy, ExternalLink, MessageCircle, Share2, Smartphone } from "lucide-react"
import { formatPrice } from "@/lib/api"
import { formatLongDate } from "@/lib/dates"
import { BrandLogo } from "@/components/brand-logo"
import { Btn } from "@/components/ds/primitives"

type WalletItem = {
  name: string
  webUrl: string
  androidPackage: string
  iosScheme: string
}

const WALLETS: WalletItem[] = [
  {
    name: "Mercado Pago",
    webUrl: "https://www.mercadopago.com.ar/home",
    androidPackage: "com.mercadopago.wallet",
    iosScheme: "mercadopago://home",
  },
  {
    name: "MODO",
    webUrl: "https://www.modo.com.ar/pagar",
    androidPackage: "com.playdigital.modo",
    iosScheme: "modo://",
  },
  {
    name: "Ualá",
    webUrl: "https://www.uala.com.ar",
    androidPackage: "ar.com.bancar.uala",
    iosScheme: "uala://",
  },
  {
    name: "Naranja X",
    webUrl: "https://www.naranjax.com",
    androidPackage: "com.tarjetanaranja.naranjax",
    iosScheme: "naranjax://",
  },
  {
    name: "Cocos",
    webUrl: "https://app.cocos.capital",
    androidPackage: "com.cocoscapital.app",
    iosScheme: "cocos://",
  },
  {
    name: "Uilo",
    webUrl: "https://www.uilo.com.ar",
    androidPackage: "com.wilobank.app",
    iosScheme: "uilo://",
  },
]

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
    navigator.clipboard?.writeText(mpAlias).catch(() => {})
    toast.success(`Alias "${mpAlias}" copiado`)
  }

  function openWalletApp(w: WalletItem) {
    if (mpAlias) {
      navigator.clipboard?.writeText(mpAlias).catch(() => {})
      toast.success(`Alias copiado · Abriendo ${w.name}...`)
    }

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    const isAndroid = /Android/i.test(ua)
    const isIOS = /iPhone|iPad|iPod/i.test(ua)

    if (isAndroid) {
      // Android Intent abre la app nativa instalada (o cae a la web si no está instalada)
      const schemeName = w.iosScheme.split("://")[0]
      const fallback = encodeURIComponent(w.webUrl)
      const intentUrl = `intent://home#Intent;scheme=${schemeName};package=${w.androidPackage};S.browser_fallback_url=${fallback};end`
      window.location.href = intentUrl
      return
    }

    if (isIOS) {
      // Intenta abrir la app nativa en iOS; si no responde en 1.4s abre la web
      const started = Date.now()
      window.location.href = w.iosScheme
      setTimeout(() => {
        if (Date.now() - started < 1800 && !document.hidden) {
          window.location.href = w.webUrl
        }
      }, 1400)
      return
    }

    window.open(w.webUrl, "_blank", "noopener,noreferrer")
  }

  async function shareTransferInfo() {
    if (!mpAlias) return
    const text = `Alias: ${mpAlias}${mpAccountHolder ? ` (${mpAccountHolder})` : ""} · Seña: ${formatPrice(depositAmount ?? 0)}`
    navigator.clipboard?.writeText(mpAlias).catch(() => {})
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Datos para transferir seña", text })
      } catch {}
    } else {
      toast.success("Alias copiado al portapapeles")
    }
  }

  return (
    <section className="flex w-full max-w-full flex-1 flex-col items-center overflow-x-hidden px-5 pb-10 pt-8 text-center touch-pan-y">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand text-white animate-in zoom-in-50 duration-300">
        <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">
        {requiresDeposit ? "Turno pre-reservado" : "Reserva Confirmada"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {requiresDeposit
          ? "Transferí la seña para asegurar tu lugar."
          : "Te esperamos. Guardá estos datos."}
      </p>

      {requiresDeposit ? (
        <div className="mt-6 w-full rounded-2xl border border-copper/40 bg-copper/[0.06] p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-copper">Seña requerida</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatPrice(depositAmount ?? 0)}</p>

          {mpAlias ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-neutral-500">Alias para transferir</p>
                <p className="truncate font-mono text-sm font-bold text-ink">{mpAlias}</p>
                {mpAccountHolder ? <p className="truncate text-xs text-neutral-500">Titular: {mpAccountHolder}</p> : null}
              </div>
              <Btn type="button" size="sm" variant="dark" onClick={copyAlias}>
                <Copy className="size-3.5" aria-hidden="true" />
                Copiar
              </Btn>
            </div>
          ) : null}

          <div className="mt-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              <Smartphone className="size-3.5 text-brand" aria-hidden="true" />
              Abrir app de billetera (copia el alias)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WALLETS.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => openWalletApp(w)}
                  className="flex min-w-0 items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                >
                  <span className="truncate">{w.name}</span>
                  <ExternalLink className="size-3 shrink-0 text-neutral-400" aria-hidden="true" />
                </button>
              ))}
            </div>

            {mpAlias ? (
              <button
                type="button"
                onClick={shareTransferInfo}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white/80 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-ink hover:text-ink"
              >
                <Share2 className="size-3.5" aria-hidden="true" />
                Otra billetera / Elegir app del celular
              </button>
            ) : null}
          </div>

          {proofWameUrl ? (
            <Btn
              type="button"
              size="md"
              variant="primary"
              className="mt-3.5 w-full"
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
          <Btn size="lg" className="w-full" onClick={() => { window.location.href = mercadopagoUrl }}>
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
