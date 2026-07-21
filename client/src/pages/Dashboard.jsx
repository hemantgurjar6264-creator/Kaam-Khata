// client/src/pages/Dashboard.jsx
// Routes /dashboard to the right view based on the logged-in user's role.
// Workers and employers see completely different data (a worker's own
// logged entries vs. entries logged against an employer by workers), so
// this stays a plain role switch rather than one component trying to
// branch internally.
import { useAuth } from '../context/AuthContext.jsx'
import WorkerDashboard from './WorkerDashboard.jsx'
import EmployerDashboard from './EmployerDashboard.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  return user.role === 'employer' ? <EmployerDashboard /> : <WorkerDashboard />
}
