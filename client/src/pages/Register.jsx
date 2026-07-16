// client/src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Phone, Lock, Eye, EyeOff, HardHat, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import logoIcon from '../assets/logo-icon.png'

export default function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [form, setForm] = useState({ role: 'worker', name: '', companyName: '', phoneNumber: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function selectRole(role) {
    setForm((prev) => ({ ...prev, role }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError(t('register.errName'))
      return
    }
    if (form.role === 'employer' && !form.companyName.trim()) {
      setError(t('register.errCompanyName'))
      return
    }
    if (!form.phoneNumber.trim()) {
      setError(t('register.errPhone'))
      return
    }
    if (form.password.length < 6) {
      setError(t('register.errPasswordLength'))
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(t('register.errPasswordMatch'))
      return
    }

    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || t('register.errGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-paper py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoIcon} alt="" className="w-16 h-16 object-contain mb-3" />
          <h1 className="font-display text-2xl">{t('register.title')}</h1>
          <p className="text-paper/60 text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="ledger-page rounded-2xl shadow-ledger text-ink p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1.5">{t('register.iAmA')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectRole('worker')}
                aria-pressed={form.role === 'worker'}
                className={`focus-ring flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                  form.role === 'worker'
                    ? 'border-stamp-amber bg-stamp-amber/10 text-ink'
                    : 'border-ink/15 bg-white/50 text-ink/60 hover:bg-ink/5'
                }`}
              >
                <HardHat size={16} /> {t('register.roleWorker')}
              </button>
              <button
                type="button"
                onClick={() => selectRole('employer')}
                aria-pressed={form.role === 'employer'}
                className={`focus-ring flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                  form.role === 'employer'
                    ? 'border-stamp-amber bg-stamp-amber/10 text-ink'
                    : 'border-ink/15 bg-white/50 text-ink/60 hover:bg-ink/5'
                }`}
              >
                <Building2 size={16} /> {t('register.roleEmployer')}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('register.name')}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update('name')}
                placeholder={t('register.namePh')}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {form.role === 'employer' && (
            <div>
              <label htmlFor="companyName" className="block text-xs font-semibold text-ink/70 mb-1.5">
                {t('register.companyName')}
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  id="companyName"
                  type="text"
                  autoComplete="organization"
                  value={form.companyName}
                  onChange={update('companyName')}
                  placeholder={t('register.companyNamePh')}
                  className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="phoneNumber" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('register.mobileNumber')}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={update('phoneNumber')}
                placeholder="98765 00000"
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('register.password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                placeholder={t('register.passwordPh')}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-9 py-2.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('register.confirmPassword')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder={t('register.confirmPasswordPh')}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-9 py-2.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />
            {submitting ? t('register.submitting') : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-paper/60 mt-5">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-stamp-amber font-semibold hover:underline">
            {t('register.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
