import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LogWork from './pages/LogWork.jsx'
import ProofCard from './pages/ProofCard.jsx'
import Confirm from './pages/Confirm.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/confirm/:id" element={<Confirm />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes: require a logged-in worker (not employer) */}
        <Route element={<ProtectedRoute workerOnly />}>
          <Route path="/log" element={<LogWork />} />
          <Route path="/proof" element={<ProofCard />} />
        </Route>
      </Route>

      {/* Dashboard renders its own sidebar shell instead of the shared Navbar/Layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
