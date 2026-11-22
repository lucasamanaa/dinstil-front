"use client"

import { useRef, useState } from "react"
import useSWR from "swr"
import { ApiError, asList, fetcher, type Service, type Shop } from "@/lib/api"
import { formatShortDate, todayISO } from "@/lib/dates"
import { BookingHeader, type SummaryPill } from "./booking-header"
import { BookingSuccess } from "./booking-success"
import { ConnectionError, ListSkeleton, SetupEmptyState } from "./state-views"
import { StepBarber } from "./step-barber"
import { StepDateTime } from "./step-datetime"
import { StepDetails, type BookingResult } from "./step-details"
import { StepService } from "./step-service"

const AUTO_ADVANCE_MS = 150

async function shopFetcher(path: string) {
  try {
    return await fetcher<Shop>(path)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export function BookingFlow() {
  const { data: shop } = useSWR("/api/setup/shop", shopFetcher)
  const services = useSWR("/api/services", fetcher)
  const serviceList = asList<Service>(services.data, "services")

  const [step, setStep] = useState(1)
  const [service, setService] = useState<Service | null>(null)
  const [barber, setBarber] = useState<{ id: number; name: string } | null>(null)
  const [date, setDate] = useState(todayISO)
  const [time, setTime] = useState<string | null>(null)
  const [result, setResult] = useState<BookingResult | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function advance(to: number) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setStep(to)
      window.scrollTo({ top: 0 })
    }, AUTO_ADVANCE_MS)
  }

  function goTo(to: number) {
    if (timer.current) clearTimeout(timer.current)
    setStep(to)
    window.scrollTo({ top: 0 })
  }

  function restart() {
    setService(null)
    setBarber(null)
    setTime(null)
    setDate(todayISO())
    setResult(null)
    goTo(1)
  }

  const pills: SummaryPill[] = []
  if (service && step > 1) pills.push({ step: 1, label: service.name })
  if (barber && step > 2) pills.push({ step: 2, label: barber.name })
  if (time && step > 3) pills.push({ step: 3, label: `${formatShortDate(date)} · ${time}` })

  const requireDeposit = Boolean(service?.requires_deposit)
  const depositPercent = Number(shop?.deposit_percent ?? shop?.deposit_percentage ?? 30) || 30

  let content: React.ReactNode
  if (services.isLoading) {
    content = (
      <div className="px-5 pt-6">
        <div className="mb-5 h-7 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <ListSkeleton rows={5} />
      </div>
    )
  } else if (services.error) {
    content = <ConnectionError onRetry={() => services.mutate()} />
  } else if (serviceList.length === 0) {
    content = <SetupEmptyState />
  } else if (step === 5 && result && service && time) {
    const assigned = result.response.barber_assigned
    content = (
      <BookingSuccess
        shopName={shop?.name}
        address={shop?.address}
        shopPhone={shop?.phone}
        date={result.response.target_date ?? date}
        time={result.response.start_time?.slice(0, 5) ?? time}
        serviceName={service.name}
        barber={(typeof assigned === "string" ? assigned : assigned?.name) || barber?.name || "A confirmar"}
        total={result.total}
        requiresDeposit={Boolean(result.response.requires_deposit ?? requireDeposit)}
        depositAmount={result.response.deposit_amount}
        mpAlias={result.response.mp_alias ?? shop?.mp_alias}
        mpAccountHolder={result.response.mp_account_holder ?? shop?.mp_account_holder}
        mercadopagoUrl={result.response.mercadopago_url}
        proofWameUrl={result.response.proof_wame_url}
        onRestart={restart}
      />
    )
  } else {
    content = (
      <div key={step} className="w-full max-w-full overflow-x-hidden px-5 pt-6 pb-10 animate-in fade-in duration-150">
        {step === 1 ? (
          <StepService
            services={serviceList}
            selectedId={service?.id}
            onSelect={(s) => {
              if (s.id !== service?.id) {
                setBarber(null)
                setTime(null)
              }
              setService(s)
              advance(2)
            }}
          />
        ) : null}
        {step === 2 && service ? (
          <StepBarber
            serviceId={service.id}
            selectedId={barber?.id}
            onSelect={(b) => {
              if (b.id !== barber?.id) setTime(null)
              setBarber(b)
              advance(3)
            }}
          />
        ) : null}
        {step === 3 && service && barber ? (
          <StepDateTime
            serviceId={service.id}
            barberId={barber.id}
            date={date}
            selectedTime={time ?? undefined}
            onDateChange={(d) => {
              setDate(d)
              setTime(null)
            }}
            onSelectTime={(t) => {
              setTime(t)
              advance(4)
            }}
          />
        ) : null}
        {step === 4 && service && barber && time ? (
          <StepDetails
            service={service}
            barberId={barber.id}
            barberName={barber.id === 0 ? "el primer disponible" : barber.name}
            date={date}
            time={time}
            requireDeposit={requireDeposit}
            depositPercent={depositPercent}
            onEdit={goTo}
            onConfirmed={(r) => {
              setResult(r)
              goTo(5)
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-white sm:border-x sm:border-border">
      <BookingHeader
        shopName={shop?.name}
        step={serviceList.length === 0 ? 0 : step}
        onBack={() => goTo(Math.max(1, step - 1))}
        pills={pills}
        onPillClick={goTo}
      />
      {content}
    </main>
  )
}
