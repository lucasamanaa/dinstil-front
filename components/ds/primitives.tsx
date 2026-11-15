import * as React from "react"
import { cn } from "@/lib/utils"

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-white px-4 text-[15px] text-ink placeholder:text-neutral-400 outline-none transition-colors focus:border-ink focus-visible:ring-0 disabled:opacity-50"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClass, className)} {...props} />,
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClass, "h-auto min-h-20 resize-none py-3", className)} {...props} />
  ),
)
Textarea.displayName = "Textarea"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputClass, "appearance-none bg-white pr-8", className)} {...props} />
  ),
)
Select.displayName = "Select"

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {label}
        {required ? <span className="text-copper"> *</span> : <span className="font-normal text-neutral-400"> · opcional</span>}
      </label>
      {children}
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-neutral-100", className)} aria-hidden="true" />
}

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger"

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90",
  dark: "bg-ink text-white hover:bg-ink/90",
  outline: "border border-input bg-white text-ink hover:border-ink",
  ghost: "text-ink hover:bg-neutral-100",
  danger: "border border-input bg-white text-destructive hover:border-destructive",
}

export function Btn({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        size === "sm" && "h-9 px-3 text-[13px]",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 px-5 text-[15px]",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold tracking-wide text-ink",
        className,
      )}
      aria-hidden="true"
    >
      {initials || "·"}
    </span>
  )
}

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />
    )
  }
  return <Initials name={name} className={className} />
}
