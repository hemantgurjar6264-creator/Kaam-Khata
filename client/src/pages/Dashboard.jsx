import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Hourglass,
  Star,
  Loader2,
  AlertTriangle,
  PlusCircle,
  MessageCircle,
} from 'lucide-react'
import { fetchMyEntries } from '../api/work.js'
import { computeStats } from '../utils/stats.js'
import { buildWhatsAppConfirmLink } from '../utils/whatsapp.js'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import IconStatCard from '../components/IconStatCard.jsx'
import StampBadge from '../components/StampBadge.jsx'
import WeeklyHoursChart from '../components/WeeklyHoursChart.jsx'
import MiniCalendar from '../components/MiniCalendar.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const loadEntries = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchMyEntries()
      setEntries(data)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not load your entries. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadEntries()
    } else {
      setEntries([])
    }
  }, [user, loadEntries])

  const stats = computeStats(entries)
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0),
    [entries]
  )

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter((e) => e.employerName?.toLowerCase().includes(q))
  }, [entries, search])

  const recentEntries = filteredEntries.slice(0, 5)

  const now = new Date()
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthConfirmed = monthEntries.filter((e) => e.status === 'confirmed').length
  const monthProgressPct = monthEntries.length
    ? Math.round((monthConfirmed / monthEntries.length) * 100)
    : 0

  const employerBreakdown = useMemo(() => {
    const map = new Map()
    entries.forEach((e) => {
      map.set(e.employerName, (map.get(e.employerName) || 0) + (Number(e.hours) || 0))
    })
    const arr = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const max = Math.max(...arr.map(([, h]) => h), 1)
    return { arr, max }
  }, [entries])

  if (!user) return null

  return (
    <div className="min-h-screen bg-ink flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} onMenuClick={() => setMenuOpen(true)} />

        <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-paper">
                {t('dash.greeting')}, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-paper/55 text-sm mt-1 max-w-xl">{t('dash.greetingSub')}</p>
            </div>
            <Link
              to="/log"
              className="focus-ring inline-flex items-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-4 py-2.5 text-sm hover:brightness-110 transition shrink-0"
            >
              <PlusCircle size={16} /> {t('dash.sidebar.logWork')}
            </Link>
          </div>

          {status === 'loading' && (
            <div className="py-16 flex items-center justify-center gap-2 text-paper/60 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          )}

          {status === 'error' && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={20} className="text-stamp-rust" />
              <p className="text-paper/70 text-sm">{errorMessage}</p>
              <button onClick={loadEntries} className="focus-ring text-xs font-semibold text-stamp-amber underline">
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                <IconStatCard icon={ClipboardList} label={t('dash.stat.totalTasks')} value={stats.totalEntries} tone="amber" />
                <IconStatCard icon={Clock} label={t('dash.stat.totalHours')} value={`${totalHours}h`} tone="amber" />
                <IconStatCard icon={CheckCircle2} label={t('dash.stat.completed')} value={stats.confirmedCount} tone="green" />
                <IconStatCard icon={Hourglass} label={t('dash.stat.pending')} value={stats.pendingCount} tone="rust" />
                <IconStatCard icon={Star} label={t('dash.stat.credit')} value={`${stats.creditScore}/100`} tone="amber" />
              </div>

              {/* Chart + Recent + Calendar */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_0.9fr] gap-4 mb-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg text-paper">{t('dash.chartTitle')}</h2>
                    <span className="text-paper/45 text-xs">{t('dash.chartSubtitle')}</span>
                  </div>
                  <WeeklyHoursChart entries={entries} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-lg text-paper">{t('dash.recentTitle')}</h2>
                    <Link to="/proof" className="text-stamp-amber text-xs font-semibold hover:underline">
                      {t('dash.viewAll')}
                    </Link>
                  </div>
                  <div className="flex flex-col divide-y divide-white/10">
                    {recentEntries.length === 0 && (
                      <p className="text-paper/45 text-sm py-6 text-center">{t('dash.noRecent')}</p>
                    )}
                    {recentEntries.map((entry) => {
                      const confirmUrl = `${window.location.origin}/confirm/${entry.id}`
                      const waLink = buildWhatsAppConfirmLink(entry, user.name, confirmUrl)
                      return (
                        <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-paper text-sm font-semibold truncate">{entry.employerName}</div>
                            <div className="text-paper/45 text-xs font-mono">
                              {entry.hours}h · {entry.date}
                            </div>
                          </div>
                          <StampBadge status={entry.status} size="sm" />
                          {entry.status === 'pending' && (
                            <a href={waLink} target="_blank" rel="noreferrer" className="focus-ring shrink-0 hover:opacity-70">
                              <MessageCircle size={16} className="text-stamp-amber" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <MiniCalendar entries={entries} />
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-paper/70">{t('dash.calendarGoal')}</span>
                      <span className="text-paper font-semibold">{monthProgressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-stamp-amber rounded-full transition-all"
                        style={{ width: `${monthProgressPct}%` }}
                      />
                    </div>
                    <p className="text-paper/40 text-xs mt-1.5">
                      {monthConfirmed}/{monthEntries.length} {t('dash.calendarGoalBody')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employer breakdown */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-display text-lg text-paper mb-4">{t('dash.employerTitle')}</h2>
                {employerBreakdown.arr.length === 0 ? (
                  <p className="text-paper/45 text-sm">{t('dash.employerEmpty')}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {employerBreakdown.arr.map(([name, hours]) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-28 sm:w-40 shrink-0 text-paper/70 text-xs truncate">{name}</div>
                        <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-stamp-amber rounded-full"
                            style={{ width: `${(hours / employerBreakdown.max) * 100}%` }}
                          />
                        </div>
                        <div className="w-12 shrink-0 text-paper text-xs font-mono text-right">{hours}h</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
