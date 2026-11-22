"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    let registration: ServiceWorkerRegistration | undefined
    const hadController = Boolean(navigator.serviceWorker.controller)
    let prompted = false

    const onControllerChange = () => {
      if (!hadController || prompted) return
      prompted = true
      toast("Hay una nueva versión de DIN STIL", {
        duration: 15000,
        action: {
          label: "Actualizar",
          onClick: () => window.location.reload(),
        },
      })
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        registration = reg
        reg.update().catch(() => {})
      })
      .catch(() => {})

    const checkUpdate = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {})
      }
    }

    document.addEventListener("visibilitychange", checkUpdate)
    window.addEventListener("focus", checkUpdate)

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
      document.removeEventListener("visibilitychange", checkUpdate)
      window.removeEventListener("focus", checkUpdate)
    }
  }, [])

  return null
}
