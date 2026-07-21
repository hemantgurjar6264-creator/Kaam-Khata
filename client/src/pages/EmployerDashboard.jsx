import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Hourglass,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Users,
  Plus,
  Trash2,
  CalendarRange,
} from 'lucide-react'
import { fetchEmployerEntries, employerConfirmEntry, employerLogEntryForWorker } from '../api/work.js'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import IconStatCard from '../components/IconStatCard.jsx'
import StampBadge from '../components/StampBadge.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)
const MAX_MULTI_DAYS = 31

/** Every YYYY-MM-DD date from start to end inclusive (capped, order-safe). */
function dateRange(start, end) {
  if (!start || !end) return [start].filter(Boolean)
  const startD = new Date(start)
  const endD = new Date(end)
  if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) return [start]
  const lo = startD <= endD ? startD : endD
  const hi = startD <= endD ? endD : startD
  const days = []
  const cursor = new Date(lo)
  while (cursor <= hi && days.length < MAX_MULTI_DAYS) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export default function EmployerDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [actingOnId, setActingOnId] = useState(null)

  // "Add entry for worker" modal - lets the employer log work for one or
  // more workers (by phone number) across a date range, in one go, without
  // any confirmation step.
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    workerPhones: [''], // one input row per worker
    date: todayStr(),
    endDate: '',
    multiDay: false,
    hours: '',
    rateType: 'daily',
    wagePerHour: '',
    note: '',
  })
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [addProgress, setAddProgress] = useState('')

  const updateAddForm = (key) => (e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))

  const updateWorkerPhone = (idx) => (e) => {
    setAddForm((f) => {
      const workerPhones = [...f.workerPhones]
      workerPhones[idx] = e.target.value
      return { ...f, workerPhones }
    })
  }
  const addWorkerRow = () => setAddForm((f) => ({ ...f, workerPhones: [...f.workerPhones, ''] }))
  const removeWorkerRow = (idx) =>
    setAddForm((f) => ({ ...f, workerPhones: f.workerPhones.filter((_, i) => i !== idx) }))

  function resetAddForm() {
    setAddForm({
      workerPhones: [''],
      date: todayStr(),
      endDate: '',
      multiDay: false,
      hours: '',
      rateType: 'daily',
      wagePerHour: '',
      note: '',
    })
  }

  async function handleAddEntry(e) {
    e.preventDefault()
    setAddError('')
    setAddProgress('')

    const phones = addForm.workerPhones.map((p) => p.trim()).filter(Boolean)
    if (phones.length === 0) {
      setAddError(t('dash.addEntry.errNoPhone'))
      return
    }

    const dates = addForm.multiDay && addForm.endDate ? dateRange(addForm.date, addForm.endDate) : [addForm.date]
    const total = phones.length * dates.length

    setAddSubmitting(true)
    let done = 0
    const failures = []

    // Sequential on purpose: keeps things predictable and avoids hammering
    // the API with a big burst of parallel writes when logging many
    // workers x many days at once.
    for (const phone of phones) {
      for (const d of dates) {
        try {
          await employerLogEntryForWorker({
            workerPhone: phone,
            date: d,
            hours: Number(addForm.hours),
            rateType: addForm.rateType,
            wagePerHour: addForm.wagePerHour ? Number(addForm.wagePerHour) : 0,
            note: addForm.note,
          })
        } catch (err) {
          failures.push(`${phone} (${d}): ${err.response?.data?.message || 'failed'}`)
        }
        done += 1
        setAddProgress(`${done}/${total}`)
      }
    }

    setAddSubmitting(false)
    setAddProgress('')
    await loadEntries()

    if (failures.length) {
      const shown = failures.slice(0, 3).join('; ')
      setAddError(
        `${total - failures.length}/${total} ${t('dash.addEntry.saved')}. ${failures.length} ${t(
          'dash.addEntry.failed'
        )}: ${shown}${failures.length > 3 ? '…' : ''}`
      )
    } else {
      setAddOpen(false)
      resetAddForm()
    }
  }

  const loadEntries = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await fetchEmployerEntries()
      setEntries(data)
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not load entries. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (user) loadEntries()
  }, [user, loadEntries])

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0),
    [entries]
  )
  const pendingCount = entries.filter((e) => e.status === 'pending').length
  const confirmedCount = entries.filter((e) => e.status === 'confirmed').length
  const workerCount = new Set(entries.map((e) => e.workerName)).size

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter((e) => e.workerName?.toLowerCase().includes(q))
  }, [entries, search])

  async function handleDecision(id, decision) {
    setActingOnId(id)
    try {
      const updated = await employerConfirmEntry(id, decision)
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Could not update this entry.')
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

        <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl text-paper">
              {t('dash.greeting')}, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-paper/55 text-sm mt-1 max-w-xl">{t('dash.employerGreetingSub')}</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <IconStatCard icon={ClipboardList} label={t('dash.stat.totalTasks')} value={entries.length} tone="amber" />
                <IconStatCard icon={Clock} label={t('dash.stat.totalHours')} value={`${totalHours}h`} tone="amber" />
                <IconStatCard icon={CheckCircle2} label={t('dash.stat.completed')} value={confirmedCount} tone="green" />
                <IconStatCard icon={Hourglass} label={t('dash.stat.pending')} value={pendingCount} tone="rust" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-stamp-amber" />
                  <h2 className="font-display text-lg text-paper">{t('dash.employerWorkersTitle')}</h2>
                  <span className="text-paper/45 text-xs ml-2">{workerCount}</span>
                  <button
                    onClick={() => setAddOpen(true)}
                    className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-full bg-stamp-amber text-ink text-xs font-semibold px-3 py-1.5 hover:brightness-95 transition"
                  >
                    <Plus size={14} /> {t('dash.addEntry.button')}
                  </button>
                </div>

                {filteredEntries.length === 0 ? (
                  <p className="text-paper/45 text-sm py-6 text-center">{t('dash.noRecent')}</p>
                ) : (
                  <div className="flex flex-col divide-y divide-white/10">
                    {filteredEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-paper text-sm font-semibold truncate">{entry.workerName}</div>
                          <div className="text-paper/45 text-xs font-mono">
                            {entry.hours}h · {entry.date}
                          </div>
                        </div>
                        <StampBadge status={entry.status} size="sm" />
                        {entry.status === 'pending' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleDecision(entry.id, 'confirmed')}
                              disabled={actingOnId === entry.id}
                              className="focus-ring rounded-full p-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 transition disabled:opacity-50"
                              aria-label="Confirm"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleDecision(entry.id, 'disputed')}
                              disabled={actingOnId === entry.id}
                              className="focus-ring rounded-full p-1.5 bg-maroon/15 text-maroon hover:bg-maroon/25 transition disabled:opacity-50"
                              aria-label="Dispute"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="ledger-page rounded-2xl shadow-ledger p-6 w-full max-w-sm text-ink">
            <h3 className="font-display text-lg mb-1">{t('dash.addEntry.title')}</h3>
            <p className="text-ink/60 text-xs mb-4">{t('dash.addEntry.subtitle')}</p>

            <form onSubmit={handleAddEntry} className="space-y-4">
              {addError && (
                <div className="flex items-start gap-2 rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-xs px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {addError}
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                  {t('dash.addEntry.workerPhones')} <span className="text-maroon">*</span>
                </span>
                <div className="space-y-2">
                  {addForm.workerPhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="tel"
                        placeholder={t('dash.addEntry.workerPhonePh')}
                        value={phone}
                        onChange={updateWorkerPhone(idx)}
                        className="kk-input flex-1"
                      />
                      {addForm.workerPhones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorkerRow(idx)}
                          className="focus-ring shrink-0 rounded-lg p-2 text-maroon hover:bg-maroon/10"
                          aria-label={t('dash.addEntry.removeWorker')}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addWorkerRow}
                  className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:underline"
                >
                  <Plus size={13} /> {t('dash.addEntry.addWorker')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                    {addForm.multiDay ? t('dash.addEntry.startDate') : t('dash.addEntry.date')}{' '}
                    <span className="text-maroon">*</span>
                  </span>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={updateAddForm('date')}
                    className="kk-input"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                    {t('dash.addEntry.days')} <span className="text-maroon">*</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    required
                    placeholder="1"
                    value={addForm.hours}
                    onChange={updateAddForm('hours')}
                    className="kk-input"
                  />
                </label>
              </div>

              <label className="focus-ring flex items-center gap-2 rounded-lg border border-ink/15 bg-white/40 px-3 py-2 text-xs font-semibold text-ink/75 cursor-pointer hover:bg-white/60">
                <input
                  type="checkbox"
                  checked={addForm.multiDay}
                  onChange={(e) => setAddForm((f) => ({ ...f, multiDay: e.target.checked }))}
                  className="accent-maroon w-4 h-4"
                />
                <CalendarRange size={15} className="text-ink/50 shrink-0" />
                {t('dash.addEntry.multiDay')}
              </label>

              {addForm.multiDay && (
                <div>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
                      {t('logwork.endDate')} <span className="text-maroon">*</span>
                    </span>
                    <input
                      type="date"
                      required
                      min={addForm.date}
                      value={addForm.endDate}
                      onChange={updateAddForm('endDate')}
                      className="kk-input"
                    />
                  </label>
                  <p className="text-[11px] text-ink/50 mt-1.5">{t('dash.addEntry.multiDayHint')}</p>
                </div>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('dash.addEntry.rateType')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'daily', label: t('logwork.rateDaily') },
                    { key: 'hourly', label: t('logwork.rateHourly') },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAddForm((f) => ({ ...f, rateType: key }))}
                      className={`focus-ring rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                        addForm.rateType === key
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
                  {addForm.rateType === 'daily' ? t('logwork.wageFlat') : t('logwork.wage')}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="500"
                  value={addForm.wagePerHour}
                  onChange={updateAddForm('wagePerHour')}
                  className="kk-input"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink/70 mb-1.5 block">{t('logwork.note')}</span>
                <input
                  type="text"
                  placeholder={t('logwork.notePh')}
                  value={addForm.note}
                  onChange={updateAddForm('note')}
                  className="kk-input"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="focus-ring flex-1 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/5"
                >
                  {t('dash.addEntry.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="focus-ring flex-1 rounded-full bg-maroon text-white px-4 py-2.5 text-sm font-semibold hover:bg-maroon-dark transition disabled:opacity-60"
                >
                  {addSubmitting ? addProgress || '…' : t('dash.addEntry.submit')}
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
