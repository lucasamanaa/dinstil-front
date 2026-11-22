"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Laptop,
  Menu,
  Monitor,
  Plus,
  Share,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { Btn } from "@/components/ds/primitives"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type DeviceId = "iphone" | "ipad" | "android" | "windows" | "mac"

type StepItem = {
  icon: typeof Smartphone
  title: string
  detail?: string
}

const DEVICES: { id: DeviceId; label: string; icon: typeof Smartphone }[] = [
  { id: "iphone", label: "iPhone", icon: Smartphone },
  { id: "ipad", label: "iPad", icon: Tablet },
  { id: "android", label: "Android", icon: Smartphone },
  { id: "windows", label: "Windows", icon: Monitor },
  { id: "mac", label: "Mac", icon: Laptop },
]

const GUIDES: Record<DeviceId, { name: string; steps: StepItem[] }> = {
  iphone: {
    name: "iPhone",
    steps: [
      { icon: ExternalLink, title: "Abrí DIN STIL en Safari" },
      {
        icon: Share,
        title: "Tocá el botón Compartir",
        detail: "El ícono cuadrado con una flecha hacia arriba en la barra inferior",
      },
      { icon: Plus, title: "Buscá 'Agregar a inicio'", detail: "Deslizá hacia abajo en el menú hasta encontrar la opción" },
      { icon: CheckCircle2, title: "Confirmá tocando 'Agregar'" },
    ],
  },
  ipad: {
    name: "iPad",
    steps: [
      { icon: ExternalLink, title: "Abrí DIN STIL en Safari" },
      {
        icon: Share,
        title: "Tocá el botón Compartir",
        detail: "El ícono cuadrado con una flecha hacia arriba en la barra superior",
      },
      { icon: Plus, title: "Elegí 'Agregar a inicio'" },
      { icon: CheckCircle2, title: "Confirmá tocando 'Agregar'" },
    ],
  },
  android: {
    name: "Android",
    steps: [
      { icon: ExternalLink, title: "Abrí DIN STIL en Google Chrome" },
      { icon: Menu, title: "Tocá el menú de los tres puntos (⋮)", detail: "Está en la esquina superior derecha del navegador" },
      { icon: Download, title: "Tocá 'Instalar aplicación' o 'Agregar a pantalla principal'" },
      { icon: CheckCircle2, title: "Confirmá tocando 'Instalar'" },
    ],
  },
  windows: {
    name: "Windows",
    steps: [
      { icon: ExternalLink, title: "Abrí DIN STIL en Chrome o Edge" },
      {
        icon: Download,
        title: "Tocá el ícono de Instalar en la barra de direcciones",
        detail: "Si no aparece, abrí el menú (⋮) → Guardar y compartir → Instalar página como app",
      },
      { icon: CheckCircle2, title: "Confirmá tocando 'Instalar'" },
    ],
  },
  mac: {
    name: "Mac",
    steps: [
      { icon: ExternalLink, title: "Abrí DIN STIL en Safari o Chrome" },
      {
        icon: Share,
        title: "En Safari tocá Compartir → 'Agregar al Dock'",
        detail: "En Chrome, tocá el ícono de instalar a la derecha de la barra de direcciones",
      },
      { icon: CheckCircle2, title: "Confirmá tocando 'Agregar'" },
    ],
  },
}

export function InstallAppGuide() {
  const [selected, setSelected] = useState<DeviceId | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    setIsInstalled(standalone)

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success("DIN STIL se instaló en tu dispositivo")
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function triggerNativeInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  const guide = selected ? GUIDES[selected] : null

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a reservar
          </Link>
          <BrandLogo />
          <div className="w-24 sm:w-28" aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-copper/30 bg-copper/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-copper">
            Experiencia App
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Instalá <span className="text-brand">DIN STIL</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-500 sm:text-base">
            Reservá tu turno en segundos y tené la barbería a un toque de distancia desde tu pantalla de inicio.
          </p>

          {isInstalled ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
              <Check className="size-4" aria-hidden="true" />
              Ya estás usando DIN STIL como aplicación
            </div>
          ) : deferredPrompt ? (
            <div className="mt-6">
              <Btn type="button" size="lg" onClick={triggerNativeInstall} className="px-7 shadow-sm">
                <Download className="size-4" aria-hidden="true" />
                Instalar DIN STIL ahora
              </Btn>
            </div>
          ) : null}
        </div>

        {/* Selector de dispositivos o Guía paso a paso */}
        <div className="mt-10">
          {!guide ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {DEVICES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-7 transition-all hover:border-brand hover:shadow-xs active:scale-[0.98]"
                >
                  <Icon className="size-7 text-brand transition-transform group-hover:scale-110" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Guía para: <span className="font-bold text-ink">{guide.name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs font-semibold uppercase tracking-wider text-copper hover:underline"
                >
                  Cambiar dispositivo
                </button>
              </div>

              <ol className="mt-6 flex flex-col gap-5">
                {guide.steps.map((step, idx) => {
                  const StepIcon = step.icon
                  return (
                    <li key={step.title} className="flex items-start gap-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-neutral-50 text-sm font-bold text-neutral-500">
                        {idx + 1}
                      </span>
                      <div className="flex items-start gap-2.5 pt-1.5">
                        <StepIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-ink sm:text-[15px]">{step.title}</p>
                          {step.detail ? <p className="mt-0.5 text-xs text-neutral-500">{step.detail}</p> : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-7 rounded-xl border border-brand/20 bg-brand/[0.05] px-4 py-3.5 text-center text-sm font-medium text-brand">
                DIN STIL aparecerá junto a tus otras aplicaciones.
              </div>
            </div>
          )}
        </div>

        {/* Sección de beneficios */}
        <div className="mt-14 border-t border-border pt-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            ¿Por qué instalarla?
          </p>
          <div className="mt-7 grid gap-6 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Smartphone className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold text-ink">Acceso rápido</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                Abrí DIN STIL directamente desde tu pantalla de inicio sin buscar el enlace.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-copper/10 text-copper">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold text-ink">Sin ocupar espacio</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                Funciona como una app nativa en pantalla completa sin descargar archivos pesados.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold text-ink">Turnos en 4 toques</h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                Elegí servicio, barbero y horario al instante, siempre a mano en tu celular.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
