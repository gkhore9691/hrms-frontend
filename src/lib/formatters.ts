/**
 * Format number as Indian Rupee (₹X,XX,XXX)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display (e.g. 15 Jan 2025)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format duration in minutes to "Xh Ym"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Working days between from and to (YYYY-MM-DD), excluding weekends and given holiday dates.
 */
export function getWorkingDays(
  from: string,
  to: string,
  holidayDates: string[]
): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const set = new Set(holidayDates);
  let count = 0;
  const d = new Date(fromDate);
  while (d <= toDate) {
    const day = d.getDay();
    const dateStr = d.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !set.has(dateStr)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
