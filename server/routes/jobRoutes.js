// server/routes/jobRoutes.js
// Defines the /api/jobs/* endpoints for employer requirements + worker
// applications. Everything here requires a logged-in user; each handler
// further checks req.user.role (employer vs worker) as appropriate.

import express from 'express'
import {
  createRequirement,
  getMyRequirements,
  updateRequirementStatus,
  deleteRequirement,
  respondToApplicant,
  getOpenRequirements,
  getMyApplications,
  applyToRequirement,
  withdrawApplication,
} from '../controllers/jobController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

// ---------- Worker-facing ----------
router.get('/open', getOpenRequirements)
router.get('/mine/applications', getMyApplications)
router.post('/:id/apply', applyToRequirement)
router.delete('/:id/apply', withdrawApplication)

// ---------- Employer-facing ----------
router.get('/mine', getMyRequirements)
router.post('/', createRequirement)
router.patch('/:id/status', updateRequirementStatus)
router.patch('/:id/applicants/:workerId', respondToApplicant)
router.delete('/:id', deleteRequirement)

export default router
