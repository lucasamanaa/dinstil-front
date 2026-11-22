import { Check, Clock } from "lucide-react"
import { formatPrice, type Service } from "@/lib/api"
import { cn } from "@/lib/utils"
import { StepTitle } from "./state-views"

export function StepService({
  services,
  selectedId,
  onSelect,
}: {
  services: Service[]
  selectedId?: number
  onSelect: (service: Service) => void
}) {
  return (
    <section>
      <StepTitle>¿Qué servicio te vas a realizar?</StepTitle>
      <ul className="flex flex-col gap-2.5">
        {services.map((service) => {
          const active = service.id === selectedId
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => onSelect(service)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all active:scale-[0.99]",
                  active ? "border-brand ring-1 ring-brand" : "border-border hover:border-ink",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-medium text-ink">{service.name}</p>
                    {service.requires_deposit ? (
                      <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-copper">
                        Requiere seña
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-neutral-500">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {service.duration_minutes} min
                    {service.category ? <span className="truncate"> · {service.category}</span> : null}
                  </p>
                </div>
                <span className="text-[15px] font-semibold text-copper">{formatPrice(service.price)}</span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border transition-colors",
                    active ? "border-brand bg-brand text-white" : "border-neutral-300",
                  )}
                  aria-hidden="true"
                >
                  {active ? <Check className="size-3.5" /> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
