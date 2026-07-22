// client/src/pages/EmployerRequirements.jsx
// Employer-facing page: post "I need N workers" requirements, and
// accept/reject the workers who mark themselves available for each one.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  Plus,
  Users,
  MapPin,
  Wallet,
  CalendarDays,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react'
import {
  fetchMyRequirements,
  createRequirement,
  updateRequirementStatus,
  deleteRequirement,
  respondToApplicant,
} from '../api/jobs.js'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const emptyForm = {
  title: '',
  workersNeeded: '',
  description: '',
  location: '',
  rateType: 'daily',
  wage: '',
  startDate: '',
}

export default function EmployerRequirements() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [requirements, setRequirements] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const [postOpen, setPostOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actingKey, setActingKey] = useState(null)

  const updateForm = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchMyRequirements()
      setRequirements(data)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not load your requirements.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const filtered = useMemo(() => {
    if (!search.trim()) return requirements
    const q = search.trim().toLowerCase()
    return requirements.filter((r) => r.title?.toLowerCase().includes(q))
  }, [requirements, search])

  async function handlePost(e) {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      setFormError(t('jobs.errTitle'))
      return
    }
    const workersNeeded = Number(form.workersNeeded)
    if (!Number.isFinite(workersNeeded) || workersNeeded < 1) {
      setFormError(t('jobs.errWorkers'))
      return
    }

    setSubmitting(true)
    try {
      await createRequirement({
        title: form.title.trim(),
        workersNeeded,
        description: form.description.trim(),
        location: form.location.trim(),
        rateType: form.rateType,
        wage: form.wage ? Number(form.wage) : 0,
        startDate: form.startDate || undefined,
      })
      setPostOpen(false)
      setForm(emptyForm)
      await load()
    } catch (error) {
      setFormError(error.response?.data?.message || 'Could not post this requirement.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(r) {
    const key = `status-${r.id}`
    setActingKey(key)
    try {
      const next = r.status === 'open' ? 'closed' : 'open'
      const updated = await updateRequirementStatus(r.id, next)
      setRequirements((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not update this requirement.')
    } finally {
      setActingKey(null)
    }
  }

  async function handleDelete(r) {
    const key = `delete-${r.id}`
    setActingKey(key)
    try {
      await deleteRequirement(r.id)
      setRequirements((prev) => prev.filter((x) => x.id !== r.id))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not delete this requirement.')
    } finally {
      setActingKey(null)
    }
  }

  async function handleApplicant(r, workerId, decision) {
    const key = `${r.id}-${workerId}`
    setActingKey(key)
    try {
      const updated = await respondToApplicant(r.id, workerId, decision)
      setRequirements((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not update this applicant.')
    } finally {
      setActingKey(null)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-ink flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 min-w-0">
        <Topbar search={search} onSearchChange={setSearch} onMenuClick={() => setMenuOpen(true)} />

        <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-paper flex items-center gap-2">
                <Briefcase size={24} className="text-stamp-amber" /> {t('jobs.employerTitle')}
              </h1>
              <p className="text-paper/55 text-sm mt-1 max-w-xl">{t('jobs.employerSubtitle')}</p>
            </div>
            <button
              onClick={() => setPostOpen(true)}
              className="focus-ring inline-flex items-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-4 py-2.5 text-sm hover:brightness-110 transition shrink-0"
            >
              <Plus size={16} /> {t('jobs.postButton')}
            </button>
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
                  {t('jobs.noneMine')}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filtered.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div>
                          <h3 className="font-display text-lg text-paper leading-snug">{r.title}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-paper/50 text-xs mt-1.5">
                            <span className="inline-flex items-center gap-1">
                              <Users size={13} /> {r.workersRemaining}/{r.workersNeeded} {t('jobs.stillNeeded')}
                            </span>
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
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              r.status === 'open'
                                ? 'bg-green-500/15 text-green-400'
                                : 'bg-white/10 text-paper/50'
                            }`}
                          >
                            {r.status === 'open' ? t('jobs.open') : t('jobs.closed')}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(r)}
                            disabled={actingKey === `status-${r.id}`}
                            className="focus-ring rounded-full p-1.5 text-paper/50 hover:text-paper hover:bg-white/10 transition disabled:opacity-50"
                            aria-label={r.status === 'open' ? t('jobs.closed') : t('jobs.open')}
                            title={r.status === 'open' ? t('jobs.closeReq') : t('jobs.reopenReq')}
                          >
                            {r.status === 'open' ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={actingKey === `delete-${r.id}`}
                            className="focus-ring rounded-full p-1.5 text-maroon/70 hover:text-maroon hover:bg-maroon/10 transition disabled:opacity-50"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {r.description && <p className="text-paper/55 text-sm mb-3">{r.description}</p>}

                      <div className="border-t border-white/10 pt-3 mt-1">
                        <div className="text-paper/60 text-xs font-semibold mb-2">
                          {t('jobs.applicants')} ({r.applicants.length})
                        </div>
                        {r.applicants.length === 0 ? (
                          <p className="text-paper/40 text-xs">{t('jobs.noApplicants')}</p>
                        ) : (
                          <div className="flex flex-col divide-y divide-white/10">
                            {r.applicants.map((a) => (
                              <div key={a.worker} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                                <div className="flex-1 min-w-0">
                                  <div className="text-paper text-sm font-semibold truncate">{a.workerName}</div>
                                  <div className="text-paper/45 text-xs font-mono">{a.workerPhone}</div>
                                </div>
                                {a.status === 'requested' ? (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleApplicant(r, a.worker, 'accepted')}
                                      disabled={actingKey === `${r.id}-${a.worker}`}
                                      className="focus-ring rounded-full p-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 transition disabled:opacity-50"
                                      aria-label="Accept"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleApplicant(r, a.worker, 'rejected')}
                                      disabled={actingKey === `${r.id}-${a.worker}`}
                                      className="focus-ring rounded-full p-1.5 bg-maroon/15 text-maroon hover:bg-maroon/25 transition disabled:opacity-50"
                                      aria-label="Reject"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                      a.status === 'accepted'
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-white/10 text-paper/45'
                                    }`}
                                  >
                                    {a.status === 'accepted' ? t('jobs.accepted') : t('jobs.notSelected')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {postOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="ledger-page rounded-2xl shadow-ledger p-6 w-full max-w-sm text-ink max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-1">{t('jobs.postButton')}</h3>
            <p className="text-ink/60 text-xs mb-4">{t('jobs.postSubtitle')}</p>

            <form onSubmit={handlePost} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-xs px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                  {t('jobs.formTitle')} <span className="text-maroon">*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder={t('jobs.formTitlePh')}
                  value={form.title}
                  onChange={updateForm('title')}
                  className="kk-input"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                  {t('jobs.formWorkers')} <span className="text-maroon">*</span>
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="5"
                  value={form.workersNeeded}
                  onChange={updateForm('workersNeeded')}
                  className="kk-input"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('jobs.formLocation')}</span>
                <input
                  type="text"
                  placeholder={t('jobs.formLocationPh')}
                  value={form.location}
                  onChange={updateForm('location')}
                  className="kk-input"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('jobs.formRateType')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'daily', label: t('logwork.rateDaily') },
                      { key: 'hourly', label: t('logwork.rateHourly') },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rateType: key }))}
                        className={`focus-ring rounded-lg px-2 py-2 text-xs font-semibold border transition ${
                          form.rateType === key
                            ? 'bg-stamp-amber/15 border-stamp-amber text-ink'
                            : 'border-ink/15 text-ink/55 hover:bg-ink/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                    {form.rateType === 'daily' ? t('logwork.wageFlat') : t('logwork.wage')}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={form.wage}
                    onChange={updateForm('wage')}
                    className="kk-input"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('jobs.formStartDate')}</span>
                <input type="date" value={form.startDate} onChange={updateForm('startDate')} className="kk-input" />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('jobs.formDescription')}</span>
                <textarea
                  rows={3}
                  placeholder={t('jobs.formDescriptionPh')}
                  value={form.description}
                  onChange={updateForm('description')}
                  className="kk-input resize-none"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPostOpen(false)}
                  className="focus-ring flex-1 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/5"
                >
                  {t('dash.addEntry.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-ring flex-1 rounded-full bg-maroon text-white px-4 py-2.5 text-sm font-semibold hover:bg-maroon-dark transition disabled:opacity-60"
                >
                  {submitting ? '…' : t('jobs.postButton')}
                </button>
              </div>
            </form>
          </div>

          <style>{`.kk-input { width: 100%; border: 1px solid rgba(20,27,48,0.15); border-radius: 0.5rem; padding: 0.55rem 0.75rem; background: rgba(255,255,255,0.5); font-size: 0.875rem; } .kk-input:focus { outline: 2px solid #D98E2B; outline-offset: 1px; }`}</style>
        </div>
      )}
    </div>
  )
}
