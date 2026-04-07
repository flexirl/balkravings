/**
 * Get the "business day" start — resets at 2 AM IST instead of midnight.
 * This way late-night orders (e.g. 12:30 AM) still count as the previous day's batch.
 */
export function getBusinessDayStart(): Date {
  const now = new Date()
  const start = new Date(now)
  start.setHours(2, 0, 0, 0)

  // If it's before 2 AM, the business day started yesterday at 2 AM
  if (now.getHours() < 2) {
    start.setDate(start.getDate() - 1)
  }

  return start
}

/**
 * Compute daily token numbers for orders.
 * Orders since 2 AM today are sorted by creation time and assigned
 * sequential numbers: Token #1, Token #2, etc.
 * Resets at 2 AM each day.
 */
export function getDailyTokenMap(orders: { id: string; created_at: string }[]): Map<string, number> {
  const dayStart = getBusinessDayStart()

  const todaysOrders = orders
    .filter((o) => new Date(o.created_at) >= dayStart)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const tokenMap = new Map<string, number>()
  todaysOrders.forEach((order, index) => {
    tokenMap.set(order.id, index + 1)
  })

  return tokenMap
}
