import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Layout() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <Outlet />
      <footer className="no-print max-w-7xl mx-auto px-6 sm:px-8 py-10 text-paper/35 text-xs">{t('footer')}</footer>
    </div>
  )
}
