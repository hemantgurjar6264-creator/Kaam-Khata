// client/src/pages/ForgotPassword.jsx
// 3-step "Forgot Password" flow:
//   1. Enter mobile number -> we send an SMS OTP via Firebase Phone Auth
//   2. Enter the OTP -> Firebase confirms it and hands us a verified ID token
//   3. Enter a new password -> we send the ID token + new password to our
//      backend, which verifies the token with Firebase Admin and updates
//      the password in MongoDB.
//
// Firebase never touches passwords or MongoDB — it only proves that the
// person really does control that phone number.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Phone, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import api from '../api/axios.js'
import logoIcon from '../assets/logo-icon.png'

// Turns "98765 00000" / "9876500000" / "+91 98765 00000" into "+919876500000"
// (the E.164 format Firebase Phone Auth requires).
function toE164India(rawPhone) {
  const digitsOnly = String(rawPhone).replace(/[^\d]/g, '')
  const tenDigits = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
  return `+91${tenDigits}`
}

export default function ForgotPassword() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState('phone') // 'phone' | 'otp' | 'reset' | 'done'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const confirmationResultRef = useRef(null)
  const idTokenRef = useRef(null)
  const recaptchaVerifierRef = useRef(null)
  const recaptchaContainerRef = useRef(null)

  // Set up the invisible reCAPTCHA once, the first time this page mounts.
  // Guarded: if Firebase isn't configured yet, we show a message instead
  // of throwing (which would otherwise blank out this page only — never
  // the rest of the app, since Firebase is never touched anywhere else).
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError(t('forgotPassword.errFirebaseNotConfigured'))
      return
    }

    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(getFirebaseAuth(), recaptchaContainerRef.current, {
          size: 'invisible',
        })
      } catch (err) {
        setError(err.message || t('forgotPassword.errFirebaseNotConfigured'))
      }
    }
    return () => {
      recaptchaVerifierRef.current?.clear()
      recaptchaVerifierRef.current = null
    }
  }, [t])

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')

    if (!isFirebaseConfigured) {
      setError(t('forgotPassword.errFirebaseNotConfigured'))
      return
    }

    if (!phoneNumber.trim()) {
      setError(t('forgotPassword.errPhone'))
      return
    }

    setSubmitting(true)
    try {
      const e164Phone = toE164India(phoneNumber)
      const confirmationResult = await signInWithPhoneNumber(getFirebaseAuth(), e164Phone, recaptchaVerifierRef.current)
      confirmationResultRef.current = confirmationResult
      setStep('otp')
    } catch (err) {
      setError(err.message || t('forgotPassword.errSendOtp'))
      // Reset the reCAPTCHA widget so the user can retry.
      recaptchaVerifierRef.current?.render().then((widgetId) => {
        window.grecaptcha?.reset(widgetId)
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')

    if (!otp.trim()) {
      setError(t('forgotPassword.errOtp'))
      return
    }

    setSubmitting(true)
    try {
      const result = await confirmationResultRef.current.confirm(otp.trim())
      idTokenRef.current = await result.user.getIdToken()
      setStep('reset')
    } catch (err) {
      setError(t('forgotPassword.errOtpInvalid'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError(t('forgotPassword.errPasswordLength'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('forgotPassword.errPasswordMatch'))
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/reset-password-otp', {
        idToken: idTokenRef.current,
        newPassword,
        confirmNewPassword,
      })
      setStep('done')
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPassword.errGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-paper py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoIcon} alt="" className="w-16 h-16 object-contain mb-3" />
          <h1 className="font-display text-2xl">{t('forgotPassword.title')}</h1>
          <p className="text-paper/60 text-sm mt-1">{t('forgotPassword.subtitle')}</p>
        </div>

        <div className="ledger-page rounded-2xl shadow-ledger text-ink p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-maroon/40 bg-maroon/10 text-maroon text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* Step 1: phone number */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="fpPhone" className="block text-xs font-semibold text-ink/70 mb-1.5">
                  {t('forgotPassword.mobileNumber')}
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    id="fpPhone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 00000"
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <p className="text-xs text-ink/50 mt-1.5">{t('forgotPassword.otpHint')}</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !isFirebaseConfigured}
                className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <KeyRound size={16} />
                {submitting ? t('forgotPassword.sendingOtp') : t('forgotPassword.sendOtp')}
              </button>
            </form>
          )}

          {/* Step 2: OTP entry */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="fpOtp" className="block text-xs font-semibold text-ink/70 mb-1.5">
                  {t('forgotPassword.enterOtp')}
                </label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    id="fpOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <p className="text-xs text-ink/50 mt-1.5">
                  {t('forgotPassword.otpSentTo')} {toE164India(phoneNumber)}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={16} />
                {submitting ? t('forgotPassword.verifying') : t('forgotPassword.verifyOtp')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError('')
                }}
                className="focus-ring w-full text-center text-xs text-ink/60 hover:underline inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft size={12} /> {t('forgotPassword.changeNumber')}
              </button>
            </form>
          )}

          {/* Step 3: new password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="fpNewPassword" className="block text-xs font-semibold text-ink/70 mb-1.5">
                  {t('forgotPassword.newPassword')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    id="fpNewPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('forgotPassword.newPasswordPh')}
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
                <label htmlFor="fpConfirmPassword" className="block text-xs font-semibold text-ink/70 mb-1.5">
                  {t('forgotPassword.confirmNewPassword')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    id="fpConfirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t('forgotPassword.confirmNewPasswordPh')}
                    className="focus-ring w-full rounded-lg border border-ink/15 bg-white/70 pl-9 pr-9 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Lock size={16} />
                {submitting ? t('forgotPassword.resetting') : t('forgotPassword.resetPassword')}
              </button>
            </form>
          )}

          {/* Step 4: success */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <p className="text-sm text-ink/80">{t('forgotPassword.successMessage')}</p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="focus-ring w-full inline-flex items-center justify-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-2.5 text-sm hover:brightness-110 transition"
              >
                {t('forgotPassword.goToLogin')}
              </button>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <p className="text-center text-sm text-paper/60 mt-5">
            <Link to="/login" className="text-stamp-amber font-semibold hover:underline">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        )}

        {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
        <div ref={recaptchaContainerRef} />
      </div>
    </div>
  )
}
