import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, PlusCircle, ScrollText, Home, LogOut, Sparkles } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import logoIcon from '../assets/logo-icon.png'

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const LINKS = [
    { to: '/dashboard', label: t('dash.sidebar.dashboard'), icon: LayoutGrid },
    { to: '/log', label: t('dash.sidebar.logWork'), icon: PlusCircle },
    { to: '/proof', label: t('dash.sidebar.proof'), icon: ScrollText },
    { to: '/', label: t('dash.sidebar.home'), icon: Home },
  ]

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 bg-ink-900 border-r border-white/10 flex flex-col z-40 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/10">
          <img src={logoIcon} alt="" className="w-9 h-9 object-contain shrink-0" />
          <span className="font-display text-paper text-lg tracking-wide">{t('brand')}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 flex flex-col gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={`focus-ring flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-stamp-amber text-ink'
                    : 'text-paper/65 hover:text-paper hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-3">
          <div className="rounded-2xl bg-gradient-to-br from-stamp-amber/20 to-stamp-amber/5 border border-stamp-amber/25 p-4">
            <Sparkles size={18} className="text-stamp-amber mb-2" />
            <div className="text-paper text-sm font-semibold leading-snug">{t('dash.promo.title')}</div>
            <p className="text-paper/55 text-xs mt-1 leading-relaxed">{t('dash.promo.body')}</p>
            <Link
              to="/proof"
              onClick={onClose}
              className="focus-ring mt-3 inline-flex w-full items-center justify-center rounded-full bg-stamp-amber text-ink text-xs font-bold py-2 hover:brightness-110 transition"
            >
              {t('dash.promo.cta')}
            </Link>
          </div>
        </div>

        <div className="px-3 pb-5 pt-1 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="focus-ring w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-paper/65 hover:text-paper hover:bg-white/5 transition-colors mt-2"
          >
            <LogOut size={18} />
            {t('dash.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
