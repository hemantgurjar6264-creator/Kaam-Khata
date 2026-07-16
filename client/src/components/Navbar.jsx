import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookText, PlusCircle, ScrollText, Home, Languages, LogOut, LogIn, Moon, Sun } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/logo-navbar.png'

export default function Navbar() {
  const { pathname } = useLocation()
  const { lang, setLang, t } = useLanguage()
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(true)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const LINKS = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/dashboard', label: t('nav.dashboard'), icon: BookText },
    { to: '/log', label: t('nav.log'), icon: PlusCircle },
    { to: '/proof', label: t('nav.proof'), icon: ScrollText },
  ]

  return (
    <header className="no-print sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px] gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt={t('brand')} className="h-9 sm:h-10 w-auto object-contain" />
          <span className="hidden sm:inline-flex items-center rounded-full bg-stamp-amber/15 text-stamp-amber text-[10px] font-bold px-2 py-0.5 tracking-wide">

          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {LINKS.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`focus-ring relative pb-1 text-sm transition-colors whitespace-nowrap ${
                  active ? 'text-paper font-semibold' : 'text-paper/60 hover:text-paper'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-stamp-amber" />
                )}
              </Link>
            )
          })}
        </nav>

        <nav className="flex md:hidden items-center gap-1 overflow-x-auto">
          {LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`focus-ring relative flex items-center gap-1.5 px-1.5 py-1.5 text-xs transition-colors whitespace-nowrap ${
                  active ? 'text-paper font-semibold' : 'text-paper/60 hover:text-paper'
                }`}
              >
                <Icon size={15} />
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
{/*           <button */}
{/*             onClick={() => setIsDark((v) => !v)} */}
{/*             className="focus-ring flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-paper/70 hover:bg-white/5 transition-colors" */}
{/*             title="Toggle theme" */}
{/*           > */}
{/*             {isDark ? <Moon size={15} /> : <Sun size={15} />} */}
{/*           </button> */}

          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-paper hover:bg-white/5 transition-colors focus-ring"
            title="Change language"
          >
            <Languages size={14} />
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="focus-ring flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-paper hover:bg-white/5 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="focus-ring flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-paper hover:bg-white/5 transition-colors"
              >
                <LogIn size={14} className="sm:hidden" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Link>
              <Link
                to="/register"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-stamp-amber text-ink px-4 py-1.5 text-xs font-bold hover:brightness-110 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
