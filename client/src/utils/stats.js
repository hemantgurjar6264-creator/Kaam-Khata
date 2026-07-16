// client/src/utils/stats.js
// Computes dashboard/proof-card statistics from a list of work entries.
// The entries passed in must already be scoped to a single user (the
// backend guarantees this - GET /api/work only ever returns the logged-in
// user's own entries), so no user-filtering happens here.

export function computeStats(entries) {
  const confirmed = entries.filter((e) => e.status === 'confirmed')
  const pending = entries.filter((e) => e.status === 'pending')
  const disputed = entries.filter((e) => e.status === 'disputed')
  const employers = new Set(entries.map((e) => e.employerName))
  const totalEarnings = confirmed.reduce(
    (sum, e) => sum + (e.totalAmount ?? e.hours * (e.wagePerHour || 0)),
    0
  )
  const totalDays = confirmed.length

  // Simple, explainable credit-readiness score out of 100:
  // based on verified work days (capped), employer diversity, and a
  // dispute-free ratio.
  const dayScore = Math.min(totalDays * 6, 60)
  const employerScore = Math.min(employers.size * 8, 24)
  const disputeRatio = entries.length ? disputed.length / entries.length : 0
  const trustScore = Math.round((1 - disputeRatio) * 16)
  const creditScore = entries.length ? Math.min(100, dayScore + employerScore + trustScore) : 0

  return {
    totalEntries: entries.length,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    disputedCount: disputed.length,
    employerCount: employers.size,
    totalEarnings,
    creditScore,
  }
}
