const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export const WEEKDAYS_MON_FIRST = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

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

export function normalizeTime(value: string) {
  return value.slice(0, 5)
}
