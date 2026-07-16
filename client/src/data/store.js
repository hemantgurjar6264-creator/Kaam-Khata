// Kaam Khata data layer.
// NOTE: This demo uses localStorage to simulate a backend so the prototype
// runs entirely client-side and can be deployed as a static site for the
// hackathon demo. In production this would be replaced by a real API +
// database, with the WhatsApp confirmation message sent via the Twilio API
// instead of a wa.me deep link.

const ENTRIES_KEY = 'kk_entries_v1'
const WORKER_KEY = 'kk_worker_v1'

const DEFAULT_WORKER = {
  name: 'Ramesh Kumar',
  phone: '9876500000',
  trade: 'Construction & Daily Wage Labour',
  city: 'Bhopal, Madhya Pradesh',
  workerId: 'KK-2026-00417',
}

function seedEntries() {
  const today = new Date()
  const daysAgo = (n) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
  }
  return [
    {
      id: 'seed-1',
      date: daysAgo(1),
      employerName: 'Suresh Construction',
      employerPhone: '9123456780',
      hours: 8,
      wagePerHour: 60,
      note: 'Site shuttering kaam',
      photo: null,
      status: 'confirmed',
      createdAt: daysAgo(1),
      confirmedAt: daysAgo(1),
    },
    {
      id: 'seed-2',
      date: daysAgo(3),
      employerName: 'Anita Sharma (Ghar ka kaam)',
      employerPhone: '9988776655',
      hours: 5,
      wagePerHour: 70,
      note: 'Ghar ki safai aur bartan',
      photo: null,
      status: 'confirmed',
      createdAt: daysAgo(3),
      confirmedAt: daysAgo(3),
    },
    {
      id: 'seed-3',
      date: daysAgo(6),
      employerName: 'Suresh Construction',
      employerPhone: '9123456780',
      hours: 8,
      wagePerHour: 60,
      note: 'Cement mixing',
      photo: null,
      status: 'confirmed',
      createdAt: daysAgo(6),
      confirmedAt: daysAgo(6),
    },
    {
      id: 'seed-4',
      date: daysAgo(0),
      employerName: 'Vikas Traders',
      employerPhone: '9090909090',
      hours: 6,
      wagePerHour: 65,
      note: 'Godown loading-unloading',
      photo: null,
      status: 'pending',
      createdAt: daysAgo(0),
      confirmedAt: null,
    },
  ]
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getWorker() {
  let worker = read(WORKER_KEY, null)
  if (!worker) {
    worker = DEFAULT_WORKER
    write(WORKER_KEY, worker)
  }
  return worker
}

export function getEntries() {
  let entries = read(ENTRIES_KEY, null)
  if (!entries) {
    entries = seedEntries()
    write(ENTRIES_KEY, entries)
  }
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getEntry(id) {
  return getEntries().find((e) => e.id === id) || null
}

export function addEntry(partial) {
  const entries = read(ENTRIES_KEY, []) || []
  const id = 'kk-' + Date.now().toString(36)
  const entry = {
    id,
    status: 'pending',
    confirmedAt: null,
    createdAt: new Date().toISOString().slice(0, 10),
    ...partial,
  }
  entries.push(entry)
  write(ENTRIES_KEY, entries)
  return entry
}

export function updateEntryStatus(id, status) {
  const entries = read(ENTRIES_KEY, []) || []
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return null
  entries[idx].status = status
  entries[idx].confirmedAt =
    status === 'confirmed' ? new Date().toISOString().slice(0, 10) : entries[idx].confirmedAt
  write(ENTRIES_KEY, entries)
  return entries[idx]
}

export function getStats() {
  const entries = getEntries()
  const confirmed = entries.filter((e) => e.status === 'confirmed')
  const pending = entries.filter((e) => e.status === 'pending')
  const disputed = entries.filter((e) => e.status === 'disputed')
  const employers = new Set(entries.map((e) => e.employerName))
  const totalEarnings = confirmed.reduce((sum, e) => sum + e.hours * (e.wagePerHour || 0), 0)
  const totalDays = confirmed.length

  // Simple, explainable credit-readiness score out of 100:
  // base on verified work days (capped), employer diversity, and dispute-free ratio.
  const dayScore = Math.min(totalDays * 6, 60)
  const employerScore = Math.min(employers.size * 8, 24)
  const disputeRatio = entries.length ? disputed.length / entries.length : 0
  const trustScore = Math.round((1 - disputeRatio) * 16)
  const creditScore = Math.min(100, dayScore + employerScore + trustScore)

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

export function buildWhatsAppConfirmLink(entry, confirmUrl) {
  const message =
    `Namaste, main ${getWorker().name} aapke yahan ${entry.date} ko ${entry.hours} ghante kaam kiya tha. ` +
    `Kripya is link par confirm karein: ${confirmUrl}`
  return `https://wa.me/91${entry.employerPhone}?text=${encodeURIComponent(message)}`
}
