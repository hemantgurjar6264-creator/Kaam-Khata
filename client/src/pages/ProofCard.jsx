import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  Wallet,
  Star,
  Briefcase,
  Plus,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  Info,
  BadgeCheck,
} from 'lucide-react'
import { fetchMyEntries } from '../api/work.js'
import { computeStats } from '../utils/stats.js'
import { formatWorkerCode } from '../utils/whatsapp.js'
import StampBadge from '../components/StampBadge.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Default window shown on-screen and printed/downloaded by default.
// Anything older only shows up (and only prints) once the worker taps "more".
const RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 90 // ~3 months
// A worker's most recent employer is labelled "Current" if they logged
// work for them within this many days of today.
const CURRENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 45

function formatMonthYear(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function formatFullDate(date) {
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPhone(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return phone
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

// Groups flat, day-by-day work entries into one "employment stint" per
// employer - the shape the Proof Card timeline is designed around.
function groupByEmployer(entries) {
  const map = new Map()
  entries.forEach((e) => {
    if (!map.has(e.employerName)) map.set(e.employerName, [])
    map.get(e.employerName).push(e)
  })

  const groups = Array.from(map.entries()).map(([employerName, list]) => {
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
    const times = list.map((e) => new Date(e.date).getTime())
    const startDate = new Date(Math.min(...times))
    const endDate = new Date(Math.max(...times))

    const confirmedEntries = list.filter((e) => e.confirmation?.confirmedAt)
    const latestConfirmed = [...confirmedEntries].sort(
      (a, b) => new Date(b.confirmation.confirmedAt) - new Date(a.confirmation.confirmedAt)
    )[0]

    const withLocation = sorted.find((e) => e.location?.address)
    const totalEarnings = list.reduce(
      (sum, e) => sum + (e.totalAmount ?? e.hours * (e.wagePerHour || 0)),
      0
    )

    return {
      employerName,
      employerPhone: list[0]?.employerPhone || null,
      startDate,
      endDate,
      entries: sorted,
      totalCount: list.length,
      verifiedCount: confirmedEntries.length,
      totalEarnings,
      workLocation: withLocation?.location?.address || null,
      confirmedByPhone: latestConfirmed?.confirmation?.confirmedByPhone || null,
      confirmedOn: latestConfirmed?.confirmation?.confirmedAt
        ? new Date(latestConfirmed.confirmation.confirmedAt)
        : null,
    }
  })

  groups.sort((a, b) => b.endDate - a.endDate)
  return groups
}

function scoreLabel(score, lang) {
  if (lang === 'hi') {
    if (score >= 85) return 'बहुत अच्छा'
    if (score >= 70) return 'अच्छा'
    if (score >= 45) return 'ठीक-ठाक'
    return 'शुरुआत'
  }
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Very Good'
  if (score >= 45) return 'Good'
  return 'Building up'
}

function experienceLabel(entries, t) {
  if (!entries.length) return '—'
  const times = entries.map((e) => new Date(e.date).getTime())
  const earliest = new Date(Math.min(...times))
  const now = new Date()
  let months = (now.getFullYear() - earliest.getFullYear()) * 12 + (now.getMonth() - earliest.getMonth())
  months = Math.max(months, 0)
  const years = Math.floor(months / 12)
  const remMonths = months % 12

  if (years >= 1) {
    const yLabel = years > 1 ? t('proof.years') : t('proof.year')
    return remMonths ? `${years} ${yLabel} ${remMonths} ${t('proof.months')}` : `${years} ${yLabel}`
  }
  const mCount = Math.max(months, 1)
  return `${mCount} ${mCount > 1 ? t('proof.months') : t('proof.month')}`
}

export default function ProofCard() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()

  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState(null)

  const loadEntries = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchMyEntries()
      setEntries(data.filter((e) => e.status !== 'disputed'))
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not load your proof card. Please try again.')
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
  const groups = useMemo(() => groupByEmployer(entries), [entries])

  const cutoff = useMemo(() => Date.now() - RECENT_WINDOW_MS, [])
  const recentGroups = useMemo(() => groups.filter((g) => g.endDate.getTime() >= cutoff), [groups, cutoff])
  const visibleGroups = showAllHistory ? groups : recentGroups
  const hiddenCount = groups.length - recentGroups.length

  const experience = experienceLabel(entries, t)
  const memberSince = user?.createdAt ? formatMonthYear(new Date(user.createdAt)) : null
  const headerLocation = groups[0]?.workLocation || null

  const circumference = 2 * Math.PI * 50
  const dashOffset = circumference * (1 - Math.min(stats.creditScore, 100) / 100)

  const handleShare = async () => {
    const shareData = {
      title: `${user?.name || 'Kaam Khata'} — Proof Card`,
      text: `${user?.name || 'Worker'}'s verified work & income proof card on Kaam Khata.`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        alert(t('proof.shareLinkCopied'))
      }
    } catch {
      /* user cancelled share - nothing to do */
    }
  }

  const handleRaiseDispute = () => {
    alert(t('proof.disputeInfo'))
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {stats.confirmedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 border border-emerald-300/30 rounded-full px-3 py-1 text-xs font-semibold">
                <BadgeCheck size={14} /> {t('proof.verifiedWorker')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={14} /> {t('proof.awaitingConfirmation')}
              </span>
            )}
            <div className="text-right text-xs text-white/70 font-mono leading-relaxed">
              ID: {formatWorkerCode(user.id)}
              <br />
              {t('proof.issued')}: {formatFullDate(new Date())}
            </div>
          </div>

          <div className="flex items-start justify-between gap-6 mt-6 flex-wrap">
            <div className="min-w-[200px]">
              <div className="font-display text-2xl sm:text-3xl font-bold">{user.name}</div>
              {user.phoneNumber && (
                <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1.5">
                  <Phone size={14} /> {formatPhone(user.phoneNumber) || user.phoneNumber}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {headerLocation && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                    <MapPin size={12} /> {headerLocation}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                    <CalendarDays size={12} /> {t('proof.memberSince')} {memberSince}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 min-w-[220px]">
              <div className="flex items-center gap-1.5 text-xs text-white/70 mb-2">
                {t('proof.creditScoreLabel')}
                <Info size={12} className="opacity-70" />
              </div>
              <div className="flex items-center gap-3">
                <svg width="76" height="76" viewBox="0 0 120 120" className="-rotate-90 shrink-0">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                  <text
                    x="60"
                    y="66"
                    textAnchor="middle"
                    fill="white"
                    fontSize="30"
                    fontWeight="700"
                    transform="rotate(90 60 60)"
                  >
                    {stats.creditScore}
                  </text>
                </svg>
                <div>
                  <div className="text-emerald-300 font-semibold text-sm">{scoreLabel(stats.creditScore, lang)}</div>
                  <div className="text-white/70 text-xs mt-0.5">
                    {stats.creditScore >= 45 ? t('proof.trustHigh') : t('proof.trustBuilding')}
                  </div>
                  <div className="text-white/70 text-xs">{t('proof.keepItUp')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {status === 'loading' && (
            <div className="p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading your proof card…
            </div>
          )}

          {status === 'error' && (
            <div className="p-10 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={20} className="text-rose-500" />
              <p className="text-slate-600 text-sm">{errorMessage}</p>
              <button onClick={loadEntries} className="focus-ring text-xs font-semibold text-indigo-600 underline">
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <MiniStat
                  icon={Building2}
                  tone="violet"
                  label={t('proof.stat.employers')}
                  value={stats.employerCount}
                  sub={t('proof.statSub.employers')}
                />
                <MiniStat
                  icon={Wallet}
                  tone="emerald"
                  label={t('proof.stat.earnings')}
                  value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
                  sub={t('proof.statSub.earnings')}
                />
                <MiniStat
                  icon={CalendarDays}
                  tone="sky"
                  label={t('proof.experienceLabel')}
                  value={experience}
                  sub={t('proof.statSub.experience')}
                />
                <MiniStat
                  icon={Star}
                  tone="amber"
                  label={t('proof.stat.credit')}
                  value={`${stats.creditScore}/100`}
                  sub={scoreLabel(stats.creditScore, lang)}
                />
              </div>

              {/* Work history */}
              <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Briefcase size={17} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{t('proof.historyTitle')}</div>
                      <div className="text-slate-500 text-xs">{t('proof.historySubtitle')}</div>
                    </div>
                  </div>
                  <Link
                    to="/log"
                    className="no-print focus-ring inline-flex items-center gap-1.5 bg-indigo-600 text-white font-semibold rounded-full px-4 py-2 text-xs hover:bg-indigo-700"
                  >
                    <Plus size={14} /> {t('proof.addEntry')}
                  </Link>
                </div>

                {entries.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 mb-4 text-xs text-emerald-600 font-semibold">
                    <ShieldCheck size={14} />
                    {stats.confirmedCount} of {entries.length} {t('proof.authenticatedNote')}
                  </div>
                )}

                {entries.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">{t('proof.noEntries')}</div>
                ) : (
                  <>
                    <ol className="relative mt-4">
                      {visibleGroups.map((group, idx) => {
                        const isCurrent =
                          idx === 0 && Date.now() - group.endDate.getTime() < CURRENT_WINDOW_MS
                        const isExpanded = expandedGroup === group.employerName
                        const isLast = idx === visibleGroups.length - 1

                        return (
                          <li key={group.employerName} className="relative pl-7 pb-6">
                            {!isLast && (
                              <span className="absolute left-[7px] top-3 bottom-0 w-px bg-slate-200" aria-hidden="true" />
                            )}
                            <span
                              className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                                isCurrent ? 'bg-emerald-500 ring-emerald-200' : 'bg-indigo-400 ring-indigo-100'
                              }`}
                              aria-hidden="true"
                            />

                            <div className="text-xs font-semibold text-slate-500 mb-1.5">
                              {formatMonthYear(group.startDate)} – {isCurrent ? t('proof.present') : formatMonthYear(group.endDate)}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                              <button
                                type="button"
                                onClick={() => setExpandedGroup(isExpanded ? null : group.employerName)}
                                className="focus-ring w-full flex items-start justify-between gap-3 text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                    <Building2 size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-800 text-sm">{group.employerName}</span>
                                      {isCurrent && (
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full px-2 py-0.5">
                                          {t('proof.current')}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 text-xs mt-0.5">
                                      {group.totalCount} {group.totalCount > 1 ? 'entries' : 'entry'}
                                    </div>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp size={16} className="text-slate-400 shrink-0 mt-1.5" />
                                ) : (
                                  <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1.5" />
                                )}
                              </button>

                              {group.verifiedCount > 0 ? (
                                <span className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[11px] font-semibold rounded-full px-2.5 py-1">
                                  <ShieldCheck size={12} /> {t('proof.verifiedBy')} {group.employerName}
                                </span>
                              ) : (
                                <span className="mt-3 inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[11px] font-semibold rounded-full px-2.5 py-1">
                                  {t('proof.awaitingConfirmation')}
                                </span>
                              )}

                              {(group.confirmedByPhone || group.confirmedOn) && (
                                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                                  {group.confirmedByPhone && (
                                    <div>
                                      <div className="text-slate-400">{t('proof.confirmedBy')}</div>
                                      <div className="text-slate-700 font-medium mt-0.5">
                                        {formatPhone(group.confirmedByPhone)}
                                      </div>
                                    </div>
                                  )}
                                  {group.confirmedOn && (
                                    <div>
                                      <div className="text-slate-400">{t('proof.confirmedOn')}</div>
                                      <div className="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
                                        <CalendarDays size={12} /> {formatFullDate(group.confirmedOn)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {group.workLocation && (
                                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                                  <div className="text-slate-400">{t('proof.workLocation')}</div>
                                  <div className="text-slate-700 font-medium mt-0.5 flex items-center gap-1">
                                    <MapPin size={12} /> {group.workLocation}
                                  </div>
                                </div>
                              )}

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-slate-400 border-b border-slate-100">
                                        <th className="py-1.5 pr-3 font-medium">{t('proof.table.date')}</th>
                                        <th className="py-1.5 pr-3 font-medium">{t('proof.table.hours')}</th>
                                        <th className="py-1.5 pr-3 font-medium">Rate</th>
                                        <th className="py-1.5 pr-3 font-medium text-right">{t('proof.table.status')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.entries.map((e) => (
                                        <tr key={e.id} className="border-b border-slate-50">
                                          <td className="py-1.5 pr-3 font-mono">{e.date}</td>
                                          <td className="py-1.5 pr-3">{e.hours}</td>
                                          <td className="py-1.5 pr-3 text-slate-500">
                                            {e.rateType === 'daily'
                                              ? `₹${e.dailyRate}/day`
                                              : e.wagePerHour
                                              ? `₹${e.wagePerHour}/hr`
                                              : '—'}
                                          </td>
                                          <td className="py-1.5 pr-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {e.confirmation?.confirmedAt && (
                                                <ShieldCheck size={12} className="text-emerald-500" />
                                              )}
                                              <StampBadge status={e.status} size="sm" />
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ol>

                    {hiddenCount > 0 && !showAllHistory && (
                      <button
                        type="button"
                        onClick={() => setShowAllHistory(true)}
                        className="no-print focus-ring w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-300 text-indigo-600 font-semibold text-xs rounded-xl py-2.5 hover:bg-indigo-50"
                      >
                        <ChevronDown size={14} /> +{hiddenCount} {t('proof.moreCompanies')} · {t('proof.viewFullHistory')}
                      </button>
                    )}

                    {showAllHistory && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllHistory(false)}
                        className="no-print focus-ring w-full flex items-center justify-center gap-1.5 border border-slate-200 text-slate-500 font-semibold text-xs rounded-xl py-2.5 hover:bg-slate-50"
                      >
                        <ChevronUp size={14} /> {t('proof.showRecentOnly')}
                      </button>
                    )}

                    <p className="text-slate-400 text-[11px] mt-3 text-center">
                      {showAllHistory || hiddenCount === 0 ? t('proof.allHistoryNote') : t('proof.recentOnlyNote')}
                    </p>
                  </>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-5 bg-indigo-50 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-indigo-900/70 text-xs leading-relaxed max-w-md">{t('proof.disclaimer')}</p>
                </div>
                <div className="text-right text-[11px] text-indigo-900/60 whitespace-nowrap">
                  {t('proof.generated')}
                  <br />
                  kaamkhata.app
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {status === 'ready' && (
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <button
            onClick={handleShare}
            className="focus-ring inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl px-4 py-3 text-sm hover:bg-slate-50"
          >
            <Share2 size={16} /> {t('proof.share')}
          </button>
          <button
            onClick={() => window.print()}
            className="focus-ring inline-flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-xl px-4 py-3 text-sm hover:bg-emerald-100"
          >
            <Download size={16} /> {t('proof.download')}
          </button>
          <button
            onClick={handleRaiseDispute}
            className="focus-ring inline-flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 font-semibold rounded-xl px-4 py-3 text-sm hover:bg-rose-100"
          >
            <AlertTriangle size={16} /> {t('proof.raiseDispute')}
          </button>
        </div>
      )}
    </div>
  )
}

const TONES = {
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
}

function MiniStat({ icon: Icon, label, value, sub, tone = 'violet' }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${TONES[tone]}`}>
        <Icon size={16} />
      </div>
      <div className="text-slate-800 font-bold text-base sm:text-lg leading-tight">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-slate-400 text-[10px] mt-0.5">{sub}</div>}
    </div>
  )
}
