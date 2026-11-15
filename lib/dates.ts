const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export const WEEKDAYS_MON_FIRST = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export const TIME_OPTIONS_24H: string[] = Array.from({ length: 34 }, (_, i) => {
  const totalMinutes = (7 + Math.floor(i / 2)) * 60 + (i % 2 === 0 ? 0 : 30)
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  const mm = String(totalMinutes % 60).padStart(2, "0")
  return `${hh}:${mm}`
})

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function fromISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDaysISO(iso: string, days: number) {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function nextDays(count: number) {
  const base = new Date()
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    return {
      iso: toISODate(date),
      short: i === 0 ? "Hoy" : SHORT_DAYS[date.getDay()],
      day: date.getDate(),
      month: MONTHS[date.getMonth()],
    }
  })
}

export function formatLongDate(iso: string) {
  const date = fromISODate(iso)
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

export function formatShortDate(iso: string) {
  const date = fromISODate(iso)
  return `${SHORT_DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function formatDMY(iso: string) {
  if (!iso) return ""
  const clean = iso.slice(0, 10)
  const parts = clean.split("-")
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function maskDMYInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseDMYToISO(dmy: string): string | null {
  const trimmed = dmy.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const day = Number(dd)
  const month = Number(mm)
  const year = Number(yyyy)
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null
  return `${yyyy}-${mm}-${dd}`
}

export function normalizeTime(value: string) {
  return value.slice(0, 5)
}
