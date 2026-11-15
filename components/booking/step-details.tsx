"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Cake, ChevronDown, Loader2, Pencil, Ticket } from "lucide-react"
import { apiRequest, formatPrice, type AppointmentCreated, type CouponValidation, type Service } from "@/lib/api"
import { formatShortDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Btn, Field, Input, Textarea } from "@/components/ds/primitives"
import { StepTitle } from "./state-views"

const PROFILE_KEY = "dinstill_client_profile"

type ClientProfile = {
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  has_birth_date?: boolean
}

function readProfile(): ClientProfile {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "{}") as ClientProfile
  } catch {
    return {}
  }
}

function cleanPhone(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("54")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = digits.slice(1)
  return digits
}

export type BookingResult = {
  response: AppointmentCreated
  total: number
}

export function StepDetails({
  service,
  barberName,
  barberId,
  date,
  time,
  requireDeposit,
  depositPercent,
  onEdit,
  onConfirmed,
}: {
  service: Service
  barberName: string
  barberId: number
  date: string
  time: string
  requireDeposit: boolean
  depositPercent: number
  onEdit: (step: number) => void
  onConfirmed: (result: BookingResult) => void
}) {
  const [profile] = useState<ClientProfile>(readProfile)
  const [firstName, setFirstName] = useState(profile.first_name ?? "")
  const [lastName, setLastName] = useState(profile.last_name ?? "")
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [email, setEmail] = useState(profile.email ?? "")
  const [birthDate, setBirthDate] = useState("")
  const [editBirthday, setEditBirthday] = useState(!profile.has_birth_date)
  const [notes, setNotes] = useState("")

  const [couponOpen, setCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponStatus, setCouponStatus] = useState<{ code: string; percent: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const price = Number(service.price)
  const discount = couponStatus ? (price * couponStatus.percent) / 100 : 0
  const total = Math.max(0, Math.round(price - discount))
  const deposit = Math.round((total * depositPercent) / 100)

  const phoneDigits = cleanPhone(phone)

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await apiRequest<CouponValidation>(
        `/api/coupons/validate?code=${encodeURIComponent(code)}&target_date=${date}&start_time=${time}`,
      )
      const pct = res?.discount_percent ?? res?.discount_percentage
      if (res?.valid === false || !pct) {
        setCouponStatus(null)
        setCouponError(res?.message || res?.detail || "Cupón no válido para este turno")
      } else {
        setCouponStatus({ code, percent: Number(pct) })
      }
    } catch (e) {
      setCouponStatus(null)
      setCouponError(e instanceof Error ? e.message : "Cupón no válido")
    } finally {
      setCouponLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Completá tu nombre y apellido")
      return
    }
    if (phoneDigits.length < 8) {
      toast.error("Ingresá un número de teléfono válido")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await apiRequest<AppointmentCreated>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          service_id: service.id,
          barber_id: barberId,
          date,
          target_date: date,
          start_time: time,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: `+54${phoneDigits}`,
          email: email.trim() || null,
          birth_date: editBirthday && birthDate ? birthDate : null,
          notes: notes.trim() || null,
          coupon_code: couponStatus?.code ?? null,
        }),
      })
      const nextProfile: ClientProfile = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phoneDigits,
        email: email.trim(),
        has_birth_date: profile.has_birth_date || Boolean(birthDate),
      }
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
      onConfirmed({ response, total: Number(response?.total ?? response?.total_price ?? total) })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo confirmar la reserva")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col pb-28">
      <StepTitle>Completá tus datos para confirmar</StepTitle>

      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">{service.name}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              con {barberName} · {formatShortDate(date)} · {time} hs
            </p>
          </div>
          <span className="text-[15px] font-semibold text-copper">{formatPrice(price)}</span>
        </div>
        <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
          {[
            { step: 1, label: "Servicio" },
            { step: 2, label: "Barbero" },
            { step: 3, label: "Horario" },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onEdit(item.step)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-ink"
            >
              <Pencil className="size-3" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Field label="Nombre" htmlFor="first_name" required>
          <Input id="first_name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Apellido" htmlFor="last_name" required>
          <Input id="last_name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>

      <Field label="Teléfono" htmlFor="phone" required hint="Código de área sin 0 y número sin 15. Ej: 280 455 0000" className="mt-4">
        <div className="flex h-12 items-center rounded-xl border border-input bg-white focus-within:border-ink">
          <span className="border-r border-border px-3 text-[15px] font-medium text-neutral-500">+54</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
            onBlur={() => setPhone(phoneDigits)}
            placeholder="280 455 0000"
            className="h-full flex-1 bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-neutral-400"
          />
        </div>
      </Field>

      <Field label="Correo electrónico" htmlFor="email" className="mt-4">
        <Input id="email" type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      {editBirthday ? (
        <Field label="Fecha de cumpleaños" htmlFor="birth_date" hint="Para darte un descuento en tu día" className="mt-4">
          <Input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </Field>
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] text-neutral-600">
            <Cake className="size-4 text-copper" aria-hidden="true" />
            Cumpleaños ya registrado
          </span>
          <button type="button" onClick={() => setEditBirthday(true)} className="text-[13px] font-medium text-ink underline underline-offset-4">
            Editar
          </button>
        </div>
      )}

      <Field label="Observaciones" htmlFor="notes" className="mt-4">
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="mt-5 rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setCouponOpen((v) => !v)}
          aria-expanded={couponOpen}
          className="flex w-full items-center justify-between px-4 py-3.5 text-[14px] font-medium text-ink"
        >
          <span className="flex items-center gap-2">
            <Ticket className="size-4 text-copper" aria-hidden="true" />
            ¿Tenés un cupón de descuento?
          </span>
          <ChevronDown className={cn("size-4 transition-transform", couponOpen && "rotate-180")} aria-hidden="true" />
        </button>
        {couponOpen ? (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="flex gap-2">
              <Input
                aria-label="Código de cupón"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO"
                className="h-11 uppercase tracking-wider"
              />
              <Btn type="button" variant="dark" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                {couponLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Aplicar"}
              </Btn>
            </div>
            <div aria-live="polite">
              {couponStatus ? (
                <p className="mt-2 inline-flex rounded-full bg-copper/10 px-2.5 py-1 text-xs font-semibold text-copper">
                  {couponStatus.code} · -{couponStatus.percent}% aplicado
                </p>
              ) : null}
              {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-1.5 text-sm">
        {couponStatus ? (
          <div className="flex justify-between text-neutral-500">
            <span>Descuento ({couponStatus.percent}%)</span>
            <span className="text-copper">-{formatPrice(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold text-ink">
          <span>Total</span>
          <span className="text-copper">{formatPrice(total)}</span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-md px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
          <Btn type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {requireDeposit ? `Pagar seña ${depositPercent}% (${formatPrice(deposit)}) y Reservar` : "Confirmar Reserva"}
          </Btn>
        </div>
      </div>
    </form>
  )
}
