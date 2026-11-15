"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Toaster, toast } from "sonner"
import { CalendarDays, Lock, LogOut, Loader2, Settings, Sparkles, Ticket, Users, UsersRound } from "lucide-react"
import { ApiError, apiRequest, asList, fetcher, type Barber, type Service, type Shop } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { Btn, Field, Input, Skeleton } from "@/components/ds/primitives"
import { AgendaTab } from "./agenda-tab"
import { BarbersPanel } from "./barbers-panel"
import { ClientsTab } from "./clients-tab"
import { CouponsTab } from "./coupons-tab"
import { ServicesPanel } from "./services-panel"
import { SettingsTab } from "./settings-tab"

const AUTH_STORAGE_KEY = "dinstill_admin_auth"

type TabId = "agenda" | "equipo" | "cupones" | "clientes" | "ajustes"

const TABS: { id: TabId; label: string; icon: typeof CalendarDays }[] = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "equipo", label: "Equipo y Servicios", icon: Users },
  { id: "cupones", label: "Cupones", icon: Ticket },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "ajustes", label: "Ajustes", icon: Settings },
]

async function shopFetcher(path: string) {
  try {
    return await fetcher<Shop>(path)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [pin, setPin] = useState("")
  const [checkingPin, setCheckingPin] = useState(false)

  useEffect(() => {
    const saved = window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
    setAuthorized(saved)
  }, [])

  const shop = useSWR(authorized ? "/api/setup/shop" : null, shopFetcher)
  const services = useSWR(authorized ? "/api/services" : null, fetcher)
  const barbers = useSWR(authorized ? "/api/barbers" : null, fetcher)
  const [chosenTab, setChosenTab] = useState<TabId | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const cleanPin = pin.trim()
    if (!cleanPin) {
      toast.error("Ingresá el PIN de administrador")
      return
    }
    setCheckingPin(true)
    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin: cleanPin }),
      })
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true")
      setAuthorized(true)
      setPin("")
    } catch (err) {
      const fallbackPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234"
      if (err instanceof ApiError && err.status === 404 && cleanPin === fallbackPin) {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true")
        setAuthorized(true)
        setPin("")
      } else {
        toast.error("Clave de acceso incorrecta")
      }
    } finally {
      setCheckingPin(false)
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthorized(false)
    setPin("")
  }

  if (authorized === null) {
    return <div className="min-h-dvh bg-neutral-50" />
  }

  if (!authorized) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4">
        <Toaster position="top-center" richColors />
        <form
          onSubmit={handleLogin}
          noValidate
          className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-xs"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <BrandLogo />
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <Lock className="size-3" aria-hidden="true" />
              Acceso Admin
            </span>
          </div>
          <Field label="PIN de administrador" htmlFor="admin-pin" required>
            <Input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="text-center text-lg tracking-[0.3em]"
            />
          </Field>
          <Btn type="submit" size="lg" className="w-full" disabled={checkingPin}>
            {checkingPin ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Ingresar
          </Btn>
        </form>
      </div>
    )
  }

  const loading = shop.isLoading || services.isLoading || barbers.isLoading
  const needsShop = !shop.data?.name
  const needsTeam = asList<Service>(services.data, "services").length === 0 || asList<Barber>(barbers.data, "barbers").length === 0
  const needsSetup = !loading && (needsShop || needsTeam)
  const tab: TabId = chosenTab ?? (needsSetup ? (needsShop ? "ajustes" : "equipo") : "agenda")

  return (
    <div className="min-h-dvh bg-neutral-50">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-20 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <BrandLogo name={shop.data?.name} />
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Panel</span>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-ink"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Salir
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4" aria-label="Secciones">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setChosenTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                tab === id ? "border-brand text-ink" : "border-transparent text-neutral-500 hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {needsSetup ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-copper/30 bg-copper/5 p-4">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-copper" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-ink">Paso inicial</p>
              <p className="mt-0.5 text-neutral-600">
                Configurá los datos y horarios de tu barbería y agregá tus servicios y barberos.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                <span className={cn("rounded-full px-2 py-0.5", needsShop ? "bg-white text-copper" : "bg-brand/10 text-brand")}>
                  {needsShop ? "○" : "✓"} Datos de la barbería
                </span>
                <span className={cn("rounded-full px-2 py-0.5", needsTeam ? "bg-white text-copper" : "bg-brand/10 text-brand")}>
                  {needsTeam ? "○" : "✓"} Servicios y barberos
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {loading && !chosenTab ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-40" />
          </div>
        ) : tab === "agenda" ? (
          <AgendaTab />
        ) : tab === "equipo" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <ServicesPanel onChanged={() => services.mutate()} />
            <BarbersPanel onChanged={() => barbers.mutate()} />
          </div>
        ) : tab === "cupones" ? (
          <CouponsTab />
        ) : tab === "clientes" ? (
          <ClientsTab />
        ) : (
          <SettingsTab key={shop.data?.name ?? "new"} shop={shop.data} onSaved={() => shop.mutate()} />
        )}
      </main>
    </div>
  )
}
