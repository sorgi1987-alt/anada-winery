export function isValidTimeZone(timeZone: string) {
  try { new Intl.DateTimeFormat('en', { timeZone }).format(); return true } catch { return false }
}

export function formatZonedDateTime(value: string | Date, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium', timeStyle: 'short', ...options }).format(date)
}

export function formatRelativeTime(value: string | Date, locale: string, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] = abs < 60 ? [seconds, 'second'] : abs < 3600 ? [Math.round(seconds / 60), 'minute'] : abs < 86400 ? [Math.round(seconds / 3600), 'hour'] : [Math.round(seconds / 86400), 'day']
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(amount, unit)
}

export function nowForDateTimeInput(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
