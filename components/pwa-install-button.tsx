"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download } from "lucide-react"

export function PwaInstallButton() {
  const [installed, setInstalled] = useState(true)

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    setInstalled(isStandalone)
  }, [])

  if (installed) return null

  return (
    <Link
      href="/instalar"
      className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/5 px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
      title="Instalar DIN STIL como aplicación"
    >
      <Download className="size-3" aria-hidden="true" />
      <span>App</span>
    </Link>
  )
}
