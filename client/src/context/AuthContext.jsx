// client/src/context/AuthContext.jsx
// Provides authentication state and actions to the whole app.
// The JWT itself lives only in an HTTP-only cookie (never in localStorage
// or JS-accessible storage) - this context just tracks the logged-in
// user's profile info in memory/React state.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Asks the backend "who am I?" using the HTTP-only cookie.
  // Called once on app load, and can be re-called any time to refresh state.
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      return data.user
    } catch (error) {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (phoneNumber, password) => {
    const { data } = await api.post('/auth/login', { phoneNumber, password })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async ({ name, role, companyName, phoneNumber, password, confirmPassword }) => {
    const { data } = await api.post('/auth/register', {
      name,
      role,
      companyName,
      phoneNumber,
      password,
      confirmPassword,
    })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    isLoggedIn: Boolean(user),
    login,
    register,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook for consuming the auth context throughout the app.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
