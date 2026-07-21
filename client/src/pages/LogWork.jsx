import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Mic,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  CalendarRange,
  MapPin,
  Loader2,
} from 'lucide-react'
import { createWorkEntry } from '../api/work.js'
import { buildWhatsAppConfirmLink } from '../utils/whatsapp.js'
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

export default function LogWork() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const [form, setForm] = useState({
    date: todayStr(),
    endDate: '',
    multiDay: false,
    employerName: '',
    employerPhone: '',
    hours: '',
    rateType: 'hourly',
    wagePerHour: '',
    note: '',
    photo: null,
    location: null,
  })
  const [listening, setListening] = useState(false)
  const [submittedEntry, setSubmittedEntry] = useState(null)
  const [loggedCount, setLoggedCount] = useState(1)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | done | error | unsupported
  const [locationErrorMsg, setLocationErrorMsg] = useState('')
  const recognitionRef = useRef(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }))
    reader.readAsDataURL(file)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    // Geolocation only works on secure origins (https) or localhost.
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setLocationStatus('error')
      setLocationErrorMsg('Location sirf HTTPS site par ya localhost par kaam karta hai. Is site ka URL http:// se shuru ho raha hai.')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }))
        setLocationStatus('done')
        setLocationErrorMsg('')
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message)
        setLocationStatus('error')
        if (err.code === err.PERMISSION_DENIED) {
          setLocationErrorMsg('Permission deny ho gayi hai. Browser settings me is site ke liye Location "Allow" karo.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationErrorMsg('Device ki location detect nahi ho payi. GPS/Location service on karke dobara try karo.')
        } else if (err.code === err.TIMEOUT) {
          setLocationErrorMsg('Location lene me zyada time lag gaya. Dobara try karo, ya thodi der khule aasman ke neeche jao.')
        } else {
          setLocationErrorMsg('Location capture nahi ho payi. Dobara try karo.')
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    )
  }

  const toggleVoiceNote = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(t('logwork.voiceUnsupported'))
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setForm((f) => ({ ...f, note: f.note ? `${f.note} ${transcript}` : transcript }))
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.employerName || !form.employerPhone || !form.hours) return

    const dates = form.multiDay && form.endDate ? dateRange(form.date, form.endDate) : [form.date]

    setSubmitting(true)
    try {
      const basePayload = {
        employerName: form.employerName,
        employerPhone: form.employerPhone.replace(/\D/g, '').slice(-10),
        hours: Number(form.hours),
        rateType: form.rateType,
        wagePerHour: form.wagePerHour ? Number(form.wagePerHour) : 0,
        note: form.note,
        photo: form.photo,
        location: form.location,
      }

      let lastEntry = null
      for (const d of dates) {
        // Sequential on purpose: keeps entries in order and avoids hammering
        // the API with a burst of parallel writes when logging many days.
        lastEntry = await createWorkEntry({ ...basePayload, date: d })
      }

      setLoggedCount(dates.length)
      setSubmittedEntry(lastEntry)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedEntry) {
    const confirmUrl = `${window.location.origin}/confirm/${submittedEntry.id}`
    const waLink = buildWhatsAppConfirmLink(submittedEntry, user?.name || '', confirmUrl)
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-paper text-center">
        <div className="stamp stamp-pending mx-auto px-4 py-1.5 text-xs mb-6">{t('status.pending')}</div>
        <h1 className="font-display text-2xl mb-2">{t('logwork.success.title')}</h1>
        <p className="text-paper/65 text-sm mb-2">{t('logwork.success.body')}</p>
        {loggedCount > 1 && (
          <p className="text-stamp-amber text-xs font-semibold mb-6">
            {loggedCount} {t('logwork.success.loggedCount')}
          </p>
        )}
        {loggedCount <= 1 && <div className="mb-6" />}
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-green text-white font-semibold rounded-full px-5 py-3 text-sm mb-3"
        >
          <MessageCircle size={16} /> {t('logwork.success.whatsapp')}
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(confirmUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="focus-ring w-full inline-flex items-center justify-center gap-2 border border-white/20 rounded-full px-5 py-3 text-sm mb-8 hover:bg-white/5"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t('logwork.success.copied') : t('logwork.success.copy')}
        </button>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link to="/dashboard" className="focus-ring text-paper/70 hover:text-paper underline">
            {t('logwork.success.dashboard')}
          </Link>
          <button
            onClick={() => {
              setSubmittedEntry(null)
              setLocationStatus('idle')
              setForm({
                date: todayStr(),
                endDate: '',
                multiDay: false,
                employerName: '',
                employerPhone: '',
                hours: '',
                rateType: 'hourly',
                wagePerHour: '',
                note: '',
                photo: null,
                location: null,
              })
            }}
            className="focus-ring text-paper/70 hover:text-paper underline"
          >
            {t('logwork.success.another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-paper">
      <h1 className="font-display text-2xl mb-1">{t('logwork.title')}</h1>
      <p className="text-paper/60 text-sm mb-8">{t('logwork.subtitle')}</p>

      <form onSubmit={handleSubmit} className="ledger-page rounded-2xl shadow-ledger p-6 text-ink space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-sm px-3 py-2">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('logwork.date')} required>
            <input type="date" required value={form.date} onChange={update('date')} className="kk-input" />
          </Field>
          <Field label={t('logwork.hours')} required>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              required
              placeholder="8"
              value={form.hours}
              onChange={update('hours')}
              className="kk-input"
            />
          </Field>
        </div>

        <label className="focus-ring flex items-center gap-2 rounded-lg border border-ink/15 bg-white/40 px-3 py-2 text-xs font-semibold text-ink/75 cursor-pointer hover:bg-white/60">
          <input
            type="checkbox"
            checked={form.multiDay}
            onChange={(e) => setForm((f) => ({ ...f, multiDay: e.target.checked }))}
            className="accent-maroon w-4 h-4"
          />
          <CalendarRange size={15} className="text-ink/50 shrink-0" />
          {t('logwork.multiDay')}
        </label>

        {form.multiDay && (
          <div>
            <Field label={t('logwork.endDate')} required>
              <input
                type="date"
                required
                min={form.date}
                value={form.endDate}
                onChange={update('endDate')}
                className="kk-input"
              />
            </Field>
            <p className="text-[11px] text-ink/50 mt-1.5">{t('logwork.multiDayHint')}</p>
          </div>
        )}

        <Field label={t('logwork.employerName')} required>
          <input
            type="text"
            required
            placeholder={t('logwork.employerNamePh')}
            value={form.employerName}
            onChange={update('employerName')}
            className="kk-input"
          />
        </Field>

        <Field label={t('logwork.employerPhone')} required>
          <input
            type="tel"
            required
            placeholder={t('logwork.employerPhonePh')}
            value={form.employerPhone}
            onChange={update('employerPhone')}
            className="kk-input"
          />
        </Field>

        <Field label={t('logwork.rateType')}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'hourly', label: t('logwork.rateHourly') },
              { key: 'daily', label: t('logwork.rateDaily') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rateType: key }))}
                className={`focus-ring rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                  form.rateType === key
                    ? 'bg-stamp-amber/15 border-stamp-amber text-ink'
                    : 'border-ink/15 text-ink/55 hover:bg-ink/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={form.rateType === 'daily' ? t('logwork.wageFlat') : t('logwork.wage')}>
          <input
            type="number"
            min="0"
            placeholder="60"
            value={form.wagePerHour}
            onChange={update('wagePerHour')}
            className="kk-input"
          />
        </Field>

        <Field label={t('logwork.location')}>
          {form.location ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-stamp-green/40 bg-stamp-green/10 px-3 py-2.5 text-sm text-stamp-green">
              <span className="flex items-center gap-2 truncate">
                <MapPin size={16} className="shrink-0" />
                {t('logwork.locationCaptured')}
              </span>
              <button
                type="button"
                onClick={requestLocation}
                className="focus-ring shrink-0 underline text-xs font-semibold"
              >
                {t('logwork.locationChange')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationStatus === 'loading'}
              className="focus-ring w-full flex items-center justify-center gap-2 border border-ink/15 rounded-lg px-3 py-2.5 text-sm text-ink/60 hover:bg-ink/5 disabled:opacity-60"
            >
              {locationStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {locationStatus === 'loading' ? t('logwork.locationLoading') : t('logwork.addLocation')}
            </button>
          )}
          {locationStatus === 'error' && (
            <div className="text-xs text-maroon mt-1">{locationErrorMsg || t('logwork.locationError')}</div>
          )}
          {locationStatus === 'unsupported' && (
            <div className="text-xs text-maroon mt-1">{t('logwork.locationUnsupported')}</div>
          )}
        </Field>

        <Field label={t('logwork.note')}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('logwork.notePh')}
              value={form.note}
              onChange={update('note')}
              className="kk-input flex-1"
            />
            <button
              type="button"
              onClick={toggleVoiceNote}
              className={`focus-ring shrink-0 rounded-lg px-3 flex items-center justify-center border ${
                listening ? 'bg-stamp-rust text-white border-stamp-rust' : 'border-ink/15 text-ink/60 hover:bg-ink/5'
              }`}
              title="Voice note"
            >
              <Mic size={16} />
            </button>
          </div>
          {listening && <div className="text-xs text-stamp-rust mt-1">{t('logwork.listening')}</div>}
        </Field>

        <Field label={t('logwork.photo')}>
          <label className="focus-ring flex items-center gap-2 border border-dashed border-ink/25 rounded-lg px-3 py-2.5 text-sm text-ink/60 cursor-pointer hover:bg-ink/5">
            <Camera size={16} />
            {form.photo ? t('logwork.photoChosen') : t('logwork.photoUpload')}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-maroon text-white font-semibold rounded-full px-5 py-3 text-sm hover:bg-maroon-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : t('logwork.submit')} <ArrowRight size={16} />
        </button>
      </form>

      <style>{`.kk-input { width: 100%; border: 1px solid rgba(20,27,48,0.15); border-radius: 0.5rem; padding: 0.55rem 0.75rem; background: rgba(255,255,255,0.5); font-size: 0.875rem; } .kk-input:focus { outline: 2px solid #D98E2B; outline-offset: 1px; }`}</style>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink/70 mb-1.5 block">
        {label} {required && <span className="text-maroon">*</span>}
      </span>
      {children}
    </label>
  )
}