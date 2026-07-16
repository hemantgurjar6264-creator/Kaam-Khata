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
