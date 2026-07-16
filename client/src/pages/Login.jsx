// client/src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Phone, Lock, Eye, EyeOff, HardHat, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import logoIcon from '../assets/logo-icon.png'

export default function Login() {
  const { login, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState('worker')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!phoneNumber || !password) {
      setError(t('login.errMissing'))
      return
    }

    setSubmitting(true)
    try {
      const loggedInUser = await login(phoneNumber, password)

      if (loggedInUser.role !== role) {
        await logout()
        setError(t('login.errRoleMismatch'))
        return
      }

      const redirectTo = location.state?.from || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || t('login.errGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-paper">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoIcon} alt="" className="w-16 h-16 object-contain mb-3" />
          <h1 className="font-display text-2xl">{t('login.welcome')}</h1>
          <p className="text-paper/60 text-sm mt-1">{t('login.subtitle')}</p>
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
                onClick={() => setRole('worker')}
                aria-pressed={role === 'worker'}
                className={`focus-ring flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                  role === 'worker'
                    ? 'border-stamp-amber bg-stamp-amber/10 text-ink'
                    : 'border-ink/15 bg-white/50 text-ink/60 hover:bg-ink/5'
                }`}
              >
                <HardHat size={16} /> {t('register.roleWorker')}
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                aria-pressed={role === 'employer'}
                className={`focus-ring flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors ${
                  role === 'employer'
                    ? 'border-stamp-amber bg-stamp-amber/10 text-ink'
                    : 'border-ink/15 bg-white/50 text-ink/60 hover:bg-ink/5'
                }`}
              >
                <Building2 size={16} /> {t('register.roleEmployer')}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('login.mobileNumber')}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98765 00000"
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-ink/70 mb-1.5">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <div className="flex justify-end">
            <Link to="/forgot-password" className="focus-ring text-xs text-maroon hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogIn size={16} />
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-paper/60 mt-5">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-stamp-amber font-semibold hover:underline">
            {t('login.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  )
}
