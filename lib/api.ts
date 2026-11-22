const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim().replace(/\/$/, "")
export const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}`

export type ScheduleRow = {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
  break_start?: string | null
  break_end?: string | null
  split_shift?: boolean
  morning_start?: string
  morning_end?: string
  afternoon_start?: string
  afternoon_end?: string
}

export type Shop = {
  name?: string | null
  address?: string | null
  phone?: string | null
  require_deposit?: boolean
  deposit_percent?: number | null
  deposit_percentage?: number | null
  mp_alias?: string | null
  mp_account_holder?: string | null
  opening_time?: string | null
  closing_time?: string | null
  break_start?: string | null
  break_end?: string | null
  split_shift?: boolean | null
  morning_start?: string | null
  morning_end?: string | null
  afternoon_start?: string | null
  afternoon_end?: string | null
  open_days?: string | null
  schedules?: ScheduleRow[]
}

export type Service = {
  id: number
  name: string
  category?: string | null
  price: number
  duration_minutes: number
  requires_deposit?: boolean
  deposit_amount?: number | null
}

export type Barber = {
  id: number
  name: string
  photo_url?: string | null
  service_ids?: number[]
}

export type Coupon = {
  id: number
  code: string
  discount_percent?: number
  discount_percentage?: number
  valid_days?: string | null
  valid_start_time?: string | null
  valid_end_time?: string | null
  is_active?: boolean
}

export type CouponValidation = {
  valid: boolean
  discount_percent?: number
  discount_percentage?: number
  message?: string
  detail?: string
}

export type AppointmentStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED"

export type CalendarAppointment = {
  id: number
  start_time: string
  end_time?: string
  status: AppointmentStatus
  reminder_sent?: boolean
  client_id?: number
  client_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  client_phone?: string
  barber_id?: number
  barber_name?: string
  service_id?: number
  service_name?: string
  duration_minutes?: number
  price?: number
  total?: number
  total_price?: number
  deposit_amount?: number
  notes?: string | null
  reminder_wame_url?: string
}

export type CalendarBarberColumn = {
  id: number
  name: string
  photo_url?: string | null
  is_working: boolean
  is_day_off: boolean
  start_time: string
  end_time: string
  break_start?: string | null
  break_end?: string | null
  appointments_count: number
  completed_count: number
  cash_collected: number
  pending_revenue: number
}

export type CalendarDaySummary = {
  cash_collected: number
  pending_revenue: number
  total_active: number
  completed_count: number
  confirmed_count: number
  no_show_count: number
  cancelled_count: number
  occupancy_rate: number
  attendance_rate: number
}

export type CalendarResponse = {
  date?: string
  total_appointments?: number
  shop_schedule?: {
    start_time: string
    end_time: string
    break_start?: string | null
    break_end?: string | null
  }
  barbers?: CalendarBarberColumn[]
  appointments?: CalendarAppointment[]
  people_per_slot?: Record<string, number> | { time: string; count: number }[]
  day_summary?: CalendarDaySummary
}

export type ReportMovement = {
  id: number
  date: string
  start_time: string
  end_time: string
  client_name: string
  client_phone: string
  client_dni: string
  barber_name: string
  service_name: string
  status: AppointmentStatus
  total_price: number
  discount_applied: number
  coupon_code: string
  deposit_amount: number
}

export type ReportResponse = {
  period: "day" | "month" | "year"
  start_date: string
  end_date: string
  cash_collected: number
  pending_revenue: number
  lost_revenue: number
  average_ticket: number
  total_bookings: number
  active_bookings: number
  completed_count: number
  confirmed_count: number
  no_show_count: number
  cancelled_count: number
  unique_clients: number
  completion_rate: number
  no_show_rate: number
  occupancy_rate?: number | null
  by_barber: {
    barber_id: number
    barber_name: string
    completed_count: number
    confirmed_count: number
    no_show_count: number
    cash_collected: number
    pending_revenue: number
  }[]
  by_service: {
    service_id: number
    service_name: string
    count: number
    cash_collected: number
  }[]
  timeline: {
    label: string
    cash: number
    count: number
  }[]
  movements?: ReportMovement[]
}

export type BarberException = {
  id: number
  date?: string
  target_date?: string
  is_full_day_off: boolean
  blocked_start?: string | null
  blocked_end?: string | null
  reason?: string | null
}

export type Client = {
  id: number
  first_name?: string
  last_name?: string
  phone?: string
  dni?: string | null
  email?: string | null
  birth_date?: string | null
  created_at?: string | null
  visits?: number
  appointments_count?: number
  total_cuts?: number
  completed_cuts?: number
  no_shows?: number
  total_spent?: number
  last_visit?: string | null
  days_since_last_visit?: number | null
  avg_days_between_visits?: number | null
  favorite_barber?: string | null
  favorite_service?: string | null
  is_birthday_today?: boolean
  is_birthday_month?: boolean
}

export type AppointmentCreated = {
  id?: number
  appointment_id?: number
  status?: string
  barber_assigned?: string | { name?: string }
  requires_deposit?: boolean
  deposit_amount?: number
  mp_alias?: string | null
  mp_account_holder?: string | null
  mercadopago_url?: string | null
  proof_wame_url?: string | null
  wame_url?: string | null
  total?: number
  total_price?: number
  target_date?: string
  start_time?: string
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function translateErrorText(msg: string): string {
  const lower = msg.toLowerCase()
  if (
    lower.includes("field required") ||
    lower.includes("input should be a valid") ||
    lower.includes("value is not a valid") ||
    lower.includes("string should have at least") ||
    lower.includes("missing")
  ) {
    return "Faltan completar campos obligatorios o el formato no es válido"
  }
  return msg
}

async function parseError(res: Response) {
  try {
    const body = await res.json()
    const detail = body?.detail ?? body?.message
    if (typeof detail === "string") return translateErrorText(detail)
    if (Array.isArray(detail)) {
      const joined = detail.map((d) => d?.msg ?? String(d)).join(", ")
      return translateErrorText(joined)
    }
  } catch {}
  return `Error ${res.status}`
}

export async function apiRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new ApiError(await parseError(res), res.status)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const fetcher = <T,>(path: string) => apiRequest<T>(path)

export function asList<T>(data: unknown, key?: string): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    if (key && Array.isArray(record[key])) return record[key] as T[]
    for (const value of Object.values(record)) {
      if (Array.isArray(value)) return value as T[]
    }
  }
  return []
}

export function formatPrice(value: number | null | undefined) {
  const amount = Number(value ?? 0)
  return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}
