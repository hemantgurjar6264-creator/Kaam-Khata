import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { translations } from '../i18n/translations.js'

const LANG_KEY = 'kk_lang'
const LanguageContext = createContext(null)

function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'hi') return saved
  } catch {
    /* ignore */
  }
  return 'hi'
}

function lookup(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => {
    const dict = translations[lang]
    const fallback = translations.hi
    const t = (path) => {
      const val = lookup(dict, path)
      if (val !== undefined) return val
      return lookup(fallback, path) ?? path
    }
    return { lang, setLang, t }
  }, [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
