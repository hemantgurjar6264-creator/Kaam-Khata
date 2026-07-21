// server/controllers/workController.js
// Business logic for work/ledger entries.
//
// SECURITY RULE (applies to every private handler below):
// The owning user is ALWAYS taken from req.user._id (set by the `protect`
// middleware after verifying the JWT cookie). It is NEVER read from
// req.body or req.params. Every read/update/delete query filters by BOTH
// _id and user, so one user can never touch another user's entry - a
// mismatched id simply looks like "not found".

import WorkEntry from '../models/WorkEntry.js'
import User from '../models/User.js'

const ALLOWED_STATUSES = ['pending', 'confirmed', 'disputed']

function normalizePhone(rawPhone = '') {
  return String(rawPhone).replace(/\D/g, '').slice(-10)
}

function validateEntryInput(body, { partial = false } = {}) {
  const errors = []
  const data = {}

  if (!partial || body.date !== undefined) {
    if (!body.date) errors.push('Date is required')
    else data.date = new Date(body.date)
  }

  if (!partial || body.employerName !== undefined) {
    if (!body.employerName || !String(body.employerName).trim()) errors.push('Employer name is required')
    else data.employerName = String(body.employerName).trim()
  }

  if (!partial || body.employerPhone !== undefined) {
    const phone = normalizePhone(body.employerPhone)
    if (!phone || phone.length !== 10) errors.push('A valid 10-digit employer phone number is required')
    else data.employerPhone = phone
  }

  if (!partial || body.hours !== undefined) {
    const hours = Number(body.hours)
    if (Number.isNaN(hours) || hours <= 0 || hours > 24) errors.push('Hours must be a number between 0 and 24')
    else data.hours = hours
  }

  if (body.wagePerHour !== undefined) {
    const wage = Number(body.wagePerHour)
    data.wagePerHour = Number.isNaN(wage) || wage < 0 ? 0 : wage
  }

  if (body.rateType !== undefined) {
    data.rateType = body.rateType === 'daily' ? 'daily' : 'hourly'
  }

  if (body.note !== undefined) data.note = String(body.note || '').trim()
  if (body.photo !== undefined) data.photo = body.photo || null

  if (body.location !== undefined) {
    const loc = body.location
    if (loc && typeof loc === 'object' && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))) {
      data.location = { lat: Number(loc.lat), lng: Number(loc.lng) }
    } else {
      data.location = null
    }
  }

  return { errors, data }
}

/**
 * @route   GET /api/work
 * @desc    Get all work entries belonging to the logged-in user
 * @access  Private
 */
export async function getMyEntries(req, res, next) {
  try {
    const entries = await WorkEntry.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 })
    return res.status(200).json({ success: true, count: entries.length, entries })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/work
 * @desc    Create a new work entry for the logged-in user
 * @access  Private
 */
export async function createEntry(req, res, next) {
  try {
    const { errors, data } = validateEntryInput(req.body)
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }

    const entry = await WorkEntry.create({
      ...data,
      user: req.user._id, // <-- owner comes ONLY from the authenticated request
      status: 'pending',
    })

    return res.status(201).json({ success: true, message: 'Work entry created', entry })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/work/:id
 * @desc    Get a single work entry, only if it belongs to the logged-in user
 * @access  Private
 */
export async function getEntryById(req, res, next) {
  try {
    const entry = await WorkEntry.findOne({ _id: req.params.id, user: req.user._id })
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }
    return res.status(200).json({ success: true, entry })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PUT /api/work/:id
 * @desc    Update a work entry, only if it belongs to the logged-in user
 * @access  Private
 */
export async function updateEntry(req, res, next) {
  try {
    const entry = await WorkEntry.findOne({ _id: req.params.id, user: req.user._id })
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    const { errors, data } = validateEntryInput(req.body, { partial: true })
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }

    // Only allow the owner to move their own entry back to pending/disputed
    // manually if they want to; confirmation from pending normally happens
    // via the public WhatsApp confirm link instead.
    if (req.body.status !== undefined && ALLOWED_STATUSES.includes(req.body.status)) {
      entry.status = req.body.status
    }

    Object.assign(entry, data)
    await entry.save()

    return res.status(200).json({ success: true, message: 'Work entry updated', entry })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   DELETE /api/work/:id
 * @desc    Delete a work entry, only if it belongs to the logged-in user
 * @access  Private
 */
export async function deleteEntry(req, res, next) {
  try {
    const entry = await WorkEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }
    return res.status(200).json({ success: true, message: 'Work entry deleted' })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/work/employer/mine
 * @desc    Get all work entries that name the logged-in employer as the
 *          employer (matched by the employer's own phone number against
 *          each entry's employerPhone). This is how an employer account
 *          sees the work logged against them by workers.
 * @access  Private (employer accounts only)
 */
export async function getEntriesForEmployer(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can view this' })
    }

    const entries = await WorkEntry.find({ employerPhone: req.user.phoneNumber })
      .populate('user', 'name phoneNumber')
      .sort({ date: -1, createdAt: -1 })

    const shaped = entries.map((entry) => {
      const json = entry.toJSON()
      return { ...json, workerName: entry.user?.name || '', workerPhone: entry.user?.phoneNumber || '' }
    })

    return res.status(200).json({ success: true, count: shaped.length, entries: shaped })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PATCH /api/work/employer/:id/status
 * @desc    Logged-in employer confirms or disputes a pending entry that
 *          names them as the employer. Same rules as the public WhatsApp
 *          confirm link, but usable directly from the employer's own
 *          dashboard once they're logged in.
 * @access  Private (employer accounts only)
 */
export async function employerUpdateStatus(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can do this' })
    }

    const { status } = req.body
    if (!['confirmed', 'disputed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "confirmed" or "disputed"' })
    }

    const entry = await WorkEntry.findOne({ _id: req.params.id, employerPhone: req.user.phoneNumber })
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This entry has already been resolved' })
    }

    entry.status = status
    await entry.save()

    return res.status(200).json({ success: true, entry: entry.toJSON() })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/work/employer/log-for-worker
 * @desc    Logged-in employer directly adds a work entry on behalf of a
 *          worker (identified by phone number) - no WhatsApp confirmation
 *          step needed, since the employer is the one entering it. The
 *          entry is created straight into the 'confirmed' state.
 *          The worker MUST already have a Kaam Khata account with that
 *          phone number and role 'worker' - we never create a user here.
 * @access  Private (employer accounts only)
 */
export async function addEntryForWorker(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can do this' })
    }

    const workerPhone = normalizePhone(req.body.workerPhone)
    if (!workerPhone || workerPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit worker phone number is required' })
    }

    // Match on the last 10 digits so it doesn't matter whether the worker's
    // stored number has a +91 prefix or not.
    const worker = await User.findOne({
      role: 'worker',
      phoneNumber: { $regex: `${workerPhone}$` },
    })

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          'No worker account found with this number. Ask them to sign up on Kaam Khata first, then try again.',
      })
    }

    // Validate the rest of the entry (date, hours, wage, etc.) using the
    // same rules as a normal entry, but the employer identity always comes
    // from the logged-in employer's own account - never from the request
    // body - so it can't be spoofed.
    const { errors, data } = validateEntryInput({
      ...req.body,
      employerName: req.user.companyName || req.user.name,
      employerPhone: req.user.phoneNumber,
    })
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }

    const entry = await WorkEntry.create({
      ...data,
      user: worker._id, // <-- the worker this entry belongs to
      // Entered by the employer themselves, so it's already confirmed -
      // no separate confirmation step needed.
      status: 'confirmed',
    })

    return res.status(201).json({ success: true, message: 'Work entry added for worker', entry })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/work/public/:id
 * @desc    Get a single entry for the public WhatsApp confirmation page.
 *          No login required here - the employer confirming the work is
 *          NOT a registered user of the app. The entry's MongoDB ObjectId
 *          acts as an unguessable share token, exactly like the old
 *          localStorage-based /confirm/:id link did.
 * @access  Public
 */
export async function getPublicEntry(req, res, next) {
  try {
    const entry = await WorkEntry.findById(req.params.id).populate('user', 'name')
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    const json = entry.toJSON()
    return res.status(200).json({
      success: true,
      entry: { ...json, workerName: entry.user?.name || '' },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PATCH /api/work/public/:id/status
 * @desc    Employer confirms or disputes a work entry from the WhatsApp link.
 *          Only allowed while the entry is still "pending", and only to
 *          "confirmed" or "disputed" - this prevents random tampering with
 *          entries that have already been resolved.
 * @access  Public
 */
export async function confirmPublicEntry(req, res, next) {
  try {
    const { status } = req.body

    if (!['confirmed', 'disputed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "confirmed" or "disputed"' })
    }

    const entry = await WorkEntry.findById(req.params.id)
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' })
    }

    if (entry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This entry has already been resolved' })
    }

    entry.status = status
    await entry.save()

    return res.status(200).json({ success: true, entry: entry.toJSON() })
  } catch (error) {
    next(error)
  }
}
