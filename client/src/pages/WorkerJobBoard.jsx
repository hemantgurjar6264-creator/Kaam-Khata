// client/src/pages/WorkerJobBoard.jsx
// Worker-facing job board: browse every open "I need N workers"
// requirement posted by employers, and mark yourself available for one
// with a single tap. Shows the worker's own request status on each card.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, Users, MapPin, Wallet, CalendarDays, Loader2, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { fetchOpenRequirements, applyToRequirement, withdrawApplication } from '../api/jobs.js'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function WorkerJobBoard() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [requirements, setRequirements] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [actingOnId, setActingOnId] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchOpenRequirements()
      setRequirements(data)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not load jobs. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const filtered = useMemo(() => {
    if (!search.trim()) return requirements
    const q = search.trim().toLowerCase()
    return requirements.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.employerName?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q)
    )
  }, [requirements, search])

  async function handleApply(id) {
    setActingOnId(id)
    try {
      await applyToRequirement(id)
      setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, myStatus: 'requested' } : r)))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not send your request.')
    } finally {
      setActingOnId(null)
    }
  }

  async function handleWithdraw(id) {
    setActingOnId(id)
    try {
      await withdrawApplication(id)
      setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, myStatus: null } : r)))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not withdraw your request.')
    } finally {
      setActingOnId(null)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-ink flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} onMenuClick={() => setMenuOpen(true)} />

        <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl text-paper flex items-center gap-2">
              <Briefcase size={24} className="text-stamp-amber" /> {t('jobs.workerTitle')}
            </h1>
            <p className="text-paper/55 text-sm mt-1 max-w-xl">{t('jobs.workerSubtitle')}</p>
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
              <button onClick={load} className="focus-ring text-xs font-semibold text-stamp-amber underline">
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && (
            <>
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-xs px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-paper/45 text-sm">
                  {t('jobs.noneOpen')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map((r) => {
                    const applying = actingOnId === r.id
                    return (
                      <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-display text-lg text-paper leading-snug">{r.title}</h3>
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-stamp-amber/15 text-stamp-amber text-xs font-semibold px-2.5 py-1">
                            <Users size={12} /> {r.workersRemaining ?? r.workersNeeded}/{r.workersNeeded}
                          </span>
                        </div>

                        <div className="text-paper/60 text-xs mb-1">{r.employerName}</div>

                        {r.description && (
                          <p className="text-paper/55 text-sm mt-1 mb-3 line-clamp-3">{r.description}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-paper/50 text-xs mb-4">
                          {r.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} /> {r.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Wallet size={13} /> ₹{r.wage} {r.rateType === 'hourly' ? t('jobs.perHour') : t('jobs.perDay')}
                          </span>
                          {r.startDate && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={13} /> {r.startDate}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto">
                          {r.myStatus === 'accepted' ? (
                            <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                              <CheckCircle2 size={14} /> {t('jobs.accepted')}
                            </div>
                          ) : r.myStatus === 'rejected' ? (
                            <div className="text-paper/40 text-xs font-semibold">{t('jobs.notSelected')}</div>
                          ) : r.myStatus === 'requested' ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-stamp-amber text-xs font-semibold">
                                <Clock3 size={14} /> {t('jobs.requested')}
                              </span>
                              <button
                                onClick={() => handleWithdraw(r.id)}
                                disabled={applying}
                                className="focus-ring text-xs font-semibold text-paper/50 hover:text-paper underline disabled:opacity-50"
                              >
                                {t('jobs.withdraw')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApply(r.id)}
                              disabled={applying}
                              className="focus-ring w-full rounded-full bg-stamp-amber text-ink font-semibold text-sm py-2 hover:brightness-110 transition disabled:opacity-60"
                            >
                              {applying ? '…' : t('jobs.iAmAvailable')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
