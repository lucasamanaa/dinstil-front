import { ArrowLeft } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { PwaInstallButton } from "@/components/pwa-install-button"
import { cn } from "@/lib/utils"

export type SummaryPill = { step: number; label: string }

export function BookingHeader({
  shopName,
  step,
  onBack,
  pills,
  onPillClick,
}: {
  shopName?: string | null
  step: number
  onBack?: () => void
  pills: SummaryPill[]
  onPillClick: (step: number) => void
}) {
  const showBack = step >= 2 && step <= 4
  const showProgress = step >= 1 && step <= 4

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-white/95 backdrop-blur">
      <div className="relative flex h-14 items-center justify-center px-4">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-2 flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-neutral-100"
            aria-label="Volver al paso anterior"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}
        <BrandLogo name={shopName} />
        <div className="absolute right-3">
          <PwaInstallButton />
        </div>
      </div>

      {showProgress ? (
        <div className="flex gap-1 px-4 pb-3" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Paso ${step} de 4`}>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-colors duration-300",
                i < step ? "bg-brand" : i === step ? "bg-copper" : "bg-neutral-200",
              )}
            />
          ))}
        </div>
      ) : null}

      {showBack && pills.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1.5 px-4 pb-3">
          {pills.map((pill) => (
            <button
              key={pill.step}
              type="button"
              onClick={() => onPillClick(pill.step)}
              className="max-w-full truncate rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-ink"
              aria-label={`Cambiar: ${pill.label}`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  )
}
