// server/routes/workRoutes.js
// Defines the /api/work/* endpoints.
//
// Route order matters: the two public confirmation routes are registered
// BEFORE `router.use(protect)`, so they are reachable without a login.
// Every route registered after `router.use(protect)` requires a valid JWT
// cookie, and every handler behind it scopes its query to req.user._id.

import express from 'express'
import {
  getMyEntries,
  createEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
  getPublicEntry,
  confirmPublicEntry,
  getEntriesForEmployer,
  employerUpdateStatus,
  addEntryForWorker,
} from '../controllers/workController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// ---------- Public routes (no auth) - used by the WhatsApp confirm page ----------
router.get('/public/:id', getPublicEntry)
router.patch('/public/:id/status', confirmPublicEntry)

// ---------- Everything below requires a logged-in user ----------
router.use(protect)

// Employer-only views (registered before the generic '/:id' route for clarity)
router.get('/employer/mine', getEntriesForEmployer)
router.patch('/employer/:id/status', employerUpdateStatus)
router.post('/employer/log-for-worker', addEntryForWorker)

router.get('/', getMyEntries)
router.post('/', createEntry)
router.get('/:id', getEntryById)
router.put('/:id', updateEntry)
router.delete('/:id', deleteEntry)

export default router
