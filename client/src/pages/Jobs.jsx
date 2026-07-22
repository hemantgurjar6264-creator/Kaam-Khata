// client/src/pages/Jobs.jsx
// Routes /jobs to the right view based on the logged-in user's role,
// same pattern as Dashboard.jsx: employers post/manage "need N workers"
// requirements, workers browse open requirements and apply.
import { useAuth } from '../context/AuthContext.jsx'
import WorkerJobBoard from './WorkerJobBoard.jsx'
import EmployerRequirements from './EmployerRequirements.jsx'

export default function Jobs() {
  const { user } = useAuth()
  if (!user) return null
  return user.role === 'employer' ? <EmployerRequirements /> : <WorkerJobBoard />
}
