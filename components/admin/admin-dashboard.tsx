"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  BarChart3,
  CalendarDays,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Ticket,
  Users,
  UsersRound,
  X,
} from "lucide-react"
import { ApiError, apiRequest, asList, fetcher, type Barber, type Service, type Shop } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { Btn, Field, Input, Skeleton } from "@/components/ds/primitives"
import { AgendaTab } from "./agenda-tab"
import { BarbersPanel } from "./barbers-panel"
import { ClientsTab } from "./clients-tab"
import { CouponsTab } from "./coupons-tab"
import { ReportsTab } from "./reports-tab"
import { ServicesPanel } from "./services-panel"
import { SettingsTab } from "./settings-tab"

const AUTH_STORAGE_KEY = "dinstill_admin_auth"

type TabId = "agenda" | "reportes" | "clientes" | "equipo" | "cupones" | "ajustes"

const TABS: { id: TabId; label: string; icon: typeof CalendarDays }[] = [
  { id: "agenda", label: "Tablero y Turnos", icon: CalendarDays },
  { id: "reportes", label: "Caja y Reportes", icon: BarChart3 },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "equipo", label: "Equipo y Servicios", icon: Users },
  { id: "cupones", label: "Cupones", icon: Ticket },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    setMobileMenuOpen(false)
    setPin("")
  }

  if (authorized === null) {
    return <div className="min-h-dvh bg-neutral-50" />
  }

  if (!authorized) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4">
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
  const activeTabMeta = TABS.find((t) => t.id === tab)

  function selectTab(next: TabId) {
    setChosenTab(next)
    setMobileMenuOpen(false)
  }

  const navItems = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Menú principal">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-dvh w-full max-w-full overflow-x-hidden bg-neutral-50">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-white">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <BrandLogo name={shop.data?.name} />
        </div>
        {navItems}
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]"
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[82vw] flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <BrandLogo name={shop.data?.name} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-ink"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
            </div>
            {navItems}
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-ink hover:bg-neutral-50"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <BrandLogo name={shop.data?.name} />
          {activeTabMeta ? (
            <span className="ml-auto truncate rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              {activeTabMeta.label}
            </span>
          ) : null}
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {needsSetup ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-copper/30 bg-copper/5 p-4">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-copper" aria-hidden="true" />
              <div className="min-w-0 text-sm">
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
              <Skeleton className="h-52" />
            </div>
          ) : tab === "agenda" ? (
            <AgendaTab />
          ) : tab === "reportes" ? (
            <ReportsTab />
          ) : tab === "clientes" ? (
            <ClientsTab />
          ) : tab === "equipo" ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 [&>*]:min-w-0">
              <ServicesPanel onChanged={() => services.mutate()} />
              <BarbersPanel onChanged={() => barbers.mutate()} />
            </div>
          ) : tab === "cupones" ? (
            <CouponsTab />
          ) : (
            <SettingsTab key={shop.data?.name ?? "new"} shop={shop.data} onSaved={() => shop.mutate()} />
          )}
        </main>
      </div>
    </div>
  )
}
