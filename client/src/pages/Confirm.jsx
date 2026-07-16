import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, X, ShieldCheck, Loader2 } from 'lucide-react'
import { fetchPublicEntry, confirmPublicEntry } from '../api/work.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Confirm() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [entry, setEntry] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'notfound'
  const [done, setDone] = useState(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchPublicEntry(id)
      setEntry(data)
      setStatus('ready')
    } catch (error) {
      setStatus('notfound')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const act = async (nextStatus) => {
    setActing(true)
    try {
      const updated = await confirmPublicEntry(id, nextStatus)
      setEntry((prev) => ({ ...prev, ...updated }))
      setDone(nextStatus)
    } catch (error) {
      alert(error.response?.data?.message || 'Could not submit your response. Please try again.')
    } finally {
      setActing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6 text-center">
        <div className="text-ink/60 text-sm flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </div>
    )
  }

  if (status === 'notfound' || !entry) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6 text-center">
        <div className="text-ink/60 text-sm">
          {t('confirm.notFound')}
          <br />
          <Link to="/" className="text-maroon underline">{t('confirm.goHome')}</Link>
        </div>
      </div>
    )
  }

  const earnings = entry.totalAmount ?? entry.hours * (entry.wagePerHour || 0)

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-2 justify-center mb-6 text-ink/50 text-xs">
          <ShieldCheck size={15} /> {t('confirm.tagline')}
        </div>

        <div className="bg-white rounded-2xl shadow-ledger p-6 text-ink">
          <div className="text-xs text-ink/50 mb-1">{entry.workerName} {t('confirm.sentBy')}</div>
          <div className="font-display text-xl mb-4">{entry.employerName}</div>

          <dl className="text-sm space-y-2 mb-5">
            <Row label={t('confirm.date')} value={entry.date} />
            <Row label={t('confirm.hours')} value={`${entry.hours}`} />
            {entry.wagePerHour > 0 && <Row label={t('confirm.amount')} value={`₹${earnings}`} />}
            {entry.note && <Row label={t('confirm.note')} value={entry.note} />}
          </dl>

          {entry.photo && (
            <img src={entry.photo} alt="" className="rounded-lg mb-5 w-full object-cover max-h-48" />
          )}

          {done || entry.status !== 'pending' ? (
            <div
              className={`text-center text-sm font-semibold rounded-lg py-3 ${
                (done || entry.status) === 'confirmed' ? 'bg-stamp-green/10 text-stamp-green' : 'bg-stamp-rust/10 text-stamp-rust'
              }`}
            >
              {(done || entry.status) === 'confirmed' ? t('confirm.confirmedMsg') : t('confirm.disputedMsg')}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => act('confirmed')}
                disabled={acting}
                className="focus-ring flex-1 inline-flex items-center justify-center gap-2 bg-stamp-green text-white font-semibold rounded-full py-2.5 text-sm hover:brightness-110 disabled:opacity-60"
              >
                <Check size={16} /> {t('confirm.yes')}
              </button>
              <button
                onClick={() => act('disputed')}
                disabled={acting}
                className="focus-ring flex-1 inline-flex items-center justify-center gap-2 border border-stamp-rust text-stamp-rust font-semibold rounded-full py-2.5 text-sm hover:bg-stamp-rust/5 disabled:opacity-60"
              >
                <X size={16} /> {t('confirm.no')}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-ink/40 text-xs mt-5">{t('confirm.footer')}</p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/50 shrink-0">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
