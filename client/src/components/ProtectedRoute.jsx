// client/src/components/ProtectedRoute.jsx
// Wraps routes that require authentication. While we're checking auth
// status we show a small loading state; once resolved, either render the
// protected content or redirect to /login (remembering where they came
// from so we can send them back after login).

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-paper/60 text-sm">
        Loading…
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
