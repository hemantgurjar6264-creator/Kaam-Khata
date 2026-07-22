// server/controllers/jobController.js
// Business logic for job requirements: an employer posts "I need N
// workers", and workers can browse open requirements and mark themselves
// available (apply). Same ownership rule as workController.js - the
// employer/worker identity always comes from req.user, never the body.

import JobRequirement from '../models/JobRequirement.js'

function validateRequirementInput(body, { partial = false } = {}) {
  const errors = []
  const data = {}

  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) errors.push('Title is required')
    else data.title = String(body.title).trim()
  }

  if (!partial || body.workersNeeded !== undefined) {
    const n = Number(body.workersNeeded)
    if (!Number.isFinite(n) || n < 1) errors.push('Number of workers needed must be at least 1')
    else data.workersNeeded = Math.round(n)
  }

  if (body.description !== undefined) data.description = String(body.description || '').trim()
  if (body.location !== undefined) data.location = String(body.location || '').trim()

  if (body.rateType !== undefined) {
    data.rateType = body.rateType === 'hourly' ? 'hourly' : 'daily'
  }

  if (body.wage !== undefined) {
    const wage = Number(body.wage)
    data.wage = Number.isFinite(wage) && wage >= 0 ? wage : 0
  }

  if (body.startDate !== undefined) {
    data.startDate = body.startDate ? new Date(body.startDate) : null
  }

  return { errors, data }
}

/**
 * @route   POST /api/jobs
 * @desc    Employer posts a new job requirement (e.g. "need 5 workers").
 * @access  Private (employer accounts only)
 */
export async function createRequirement(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can post a requirement' })
    }

    const { errors, data } = validateRequirementInput(req.body)
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') })
    }

    const requirement = await JobRequirement.create({
      ...data,
      employer: req.user._id,
      employerName: req.user.companyName || req.user.name,
      employerPhone: req.user.phoneNumber,
      status: 'open',
    })

    return res.status(201).json({ success: true, message: 'Requirement posted', requirement })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/jobs/mine
 * @desc    Employer's own posted requirements, with their applicants.
 * @access  Private (employer accounts only)
 */
export async function getMyRequirements(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can view this' })
    }

    const requirements = await JobRequirement.find({ employer: req.user._id }).sort({ createdAt: -1 })
    return res.status(200).json({ success: true, count: requirements.length, requirements })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PATCH /api/jobs/:id/status
 * @desc    Employer closes/reopens their own requirement.
 * @access  Private (employer accounts only)
 */
export async function updateRequirementStatus(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can do this' })
    }

    const { status } = req.body
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "open" or "closed"' })
    }

    const requirement = await JobRequirement.findOne({ _id: req.params.id, employer: req.user._id })
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' })
    }

    requirement.status = status
    await requirement.save()

    return res.status(200).json({ success: true, requirement })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Employer deletes their own requirement.
 * @access  Private (employer accounts only)
 */
export async function deleteRequirement(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can do this' })
    }

    const requirement = await JobRequirement.findOneAndDelete({ _id: req.params.id, employer: req.user._id })
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' })
    }

    return res.status(200).json({ success: true, message: 'Requirement deleted' })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   PATCH /api/jobs/:id/applicants/:workerId
 * @desc    Employer accepts or rejects one worker's application.
 * @access  Private (employer accounts only)
 */
export async function respondToApplicant(req, res, next) {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employer accounts can do this' })
    }

    const { status } = req.body
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "accepted" or "rejected"' })
    }

    const requirement = await JobRequirement.findOne({ _id: req.params.id, employer: req.user._id })
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' })
    }

    const applicant = requirement.applicants.find((a) => a.worker.toString() === req.params.workerId)
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' })
    }

    applicant.status = status
    applicant.respondedAt = new Date()
    await requirement.save()

    return res.status(200).json({ success: true, requirement })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/jobs/open
 * @desc    Worker-facing job board: every currently open requirement from
 *          any employer, most recent first. Includes `myStatus` so the
 *          client knows whether the logged-in worker has already applied.
 * @access  Private (worker accounts only)
 */
export async function getOpenRequirements(req, res, next) {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: 'Only worker accounts can view this' })
    }

    const requirements = await JobRequirement.find({ status: 'open' }).sort({ createdAt: -1 })

    const shaped = requirements.map((requirement) => {
      const json = requirement.toJSON()
      const mine = requirement.applicants.find((a) => a.worker.toString() === req.user._id.toString())
      delete json.applicants // workers only need their own status, not the full list
      return { ...json, myStatus: mine ? mine.status : null }
    })

    return res.status(200).json({ success: true, count: shaped.length, requirements: shaped })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/jobs/mine/applications
 * @desc    Requirements the logged-in worker has applied to, with their
 *          own application status on each.
 * @access  Private (worker accounts only)
 */
export async function getMyApplications(req, res, next) {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: 'Only worker accounts can view this' })
    }

    const requirements = await JobRequirement.find({ 'applicants.worker': req.user._id }).sort({ createdAt: -1 })

    const shaped = requirements.map((requirement) => {
      const json = requirement.toJSON()
      const mine = requirement.applicants.find((a) => a.worker.toString() === req.user._id.toString())
      delete json.applicants
      return { ...json, myStatus: mine ? mine.status : null }
    })

    return res.status(200).json({ success: true, count: shaped.length, requirements: shaped })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Worker marks themselves as available / requests this job.
 * @access  Private (worker accounts only)
 */
export async function applyToRequirement(req, res, next) {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: 'Only worker accounts can apply' })
    }

    const requirement = await JobRequirement.findById(req.params.id)
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' })
    }

    if (requirement.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This requirement is no longer open' })
    }

    const alreadyApplied = requirement.applicants.some((a) => a.worker.toString() === req.user._id.toString())
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already requested this job' })
    }

    requirement.applicants.push({
      worker: req.user._id,
      workerName: req.user.name,
      workerPhone: req.user.phoneNumber,
      status: 'requested',
    })
    await requirement.save()

    return res.status(200).json({ success: true, message: 'Marked as available. The employer has been notified.' })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   DELETE /api/jobs/:id/apply
 * @desc    Worker withdraws their application, as long as the employer
 *          hasn't already accepted/rejected it.
 * @access  Private (worker accounts only)
 */
export async function withdrawApplication(req, res, next) {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: 'Only worker accounts can do this' })
    }

    const requirement = await JobRequirement.findById(req.params.id)
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' })
    }

    const applicant = requirement.applicants.find((a) => a.worker.toString() === req.user._id.toString())
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'You have not applied to this requirement' })
    }

    if (applicant.status !== 'requested') {
      return res
        .status(400)
        .json({ success: false, message: 'This request has already been responded to and cannot be withdrawn' })
    }

    requirement.applicants = requirement.applicants.filter(
      (a) => a.worker.toString() !== req.user._id.toString()
    )
    await requirement.save()

    return res.status(200).json({ success: true, message: 'Request withdrawn' })
  } catch (error) {
    next(error)
  }
}
