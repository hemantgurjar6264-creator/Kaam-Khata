// client/src/components/ProtectedRoute.jsx
// Wraps routes that require authentication. While we're checking auth
// status we show a small loading state; once resolved, either render the
// protected content or redirect to /login (remembering where they came
// from so we can send them back after login).

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ workerOnly = false }) {
  const { isLoggedIn, loading, user } = useAuth()
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

  // Some features (logging work, the proof card) only make sense for
  // worker accounts. Employers who navigate here directly get bounced
  // back to their own dashboard instead of seeing a worker-only page.
  if (workerOnly && user?.role === 'employer') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
