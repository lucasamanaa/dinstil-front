import type { Metadata } from "next"
import { InstallAppGuide } from "@/components/install-app-guide"

export const metadata: Metadata = {
  title: "Instalar App · DIN STIL",
  description: "Instalá DIN STIL en tu iPhone, Android, Windows o Mac para reservar tus turnos en un toque.",
}

export default function InstallPage() {
  return <InstallAppGuide />
}
