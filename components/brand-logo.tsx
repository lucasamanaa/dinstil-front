import Image from "next/image"
import { cn } from "@/lib/utils"

export function BrandLogo({ name, className }: { name?: string | null; className?: string }) {
  const label = name?.trim() || "DIN STIL"
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/din-stil-mark.jpg" alt="" width={14} height={28} className="h-6 w-auto mix-blend-multiply" priority />
      <span className="text-[15px] font-extrabold uppercase tracking-[0.18em] text-ink">{label}</span>
    </span>
  )
}
