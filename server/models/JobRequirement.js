// server/models/JobRequirement.js
// Mongoose schema/model for an employer's "I need N workers" job posting.
// Workers can browse open requirements and mark themselves as available
// (apply). The employer can then accept or reject each applicant.
//
// Applicants are stored as an embedded array on the requirement itself
// (rather than a separate collection) because in practice a requirement
// never has more than a handful of applicants, and embedding keeps
// "how many workers still needed" trivial to compute without a join.

import mongoose from 'mongoose'

const applicantSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot the worker's name/phone at the time of applying so the
    // employer's list still reads correctly even if the worker later
    // edits their profile.
    workerName: { type: String, trim: true, default: '' },
    workerPhone: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'rejected'],
      default: 'requested',
    },
    appliedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
  },
  { _id: false, id: false }
)

const jobRequirementSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Snapshot of the employer's own details, same reasoning as above -
    // keeps the worker-facing job board fast (no populate needed) and
    // stable even if the employer edits their profile later.
    employerName: { type: String, trim: true, default: '' },
    employerPhone: { type: String, trim: true, default: '' },

    title: {
      type: String,
      required: [true, 'A short title for the work is required'],
      trim: true,
      maxlength: [120, 'Title must be less than 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description must be less than 1000 characters'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Location must be less than 150 characters'],
    },
    workersNeeded: {
      type: Number,
      required: [true, 'Number of workers needed is required'],
      min: [1, 'At least 1 worker is required'],
      max: [1000, 'That seems too large - please double check'],
    },
    rateType: {
      type: String,
      enum: ['hourly', 'daily'],
      default: 'daily',
    },
    wage: {
      type: Number,
      default: 0,
      min: [0, 'Wage cannot be negative'],
    },
    startDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    applicants: {
      type: [applicantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

jobRequirementSchema.index({ status: 1, createdAt: -1 })

// How many "accepted" spots are still open, so the client doesn't have
// to recompute this everywhere.
jobRequirementSchema.virtual('workersRemaining').get(function workersRemaining() {
  const accepted = this.applicants.filter((a) => a.status === 'accepted').length
  return Math.max(this.workersNeeded - accepted, 0)
})

jobRequirementSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    if (ret.startDate instanceof Date) {
      ret.startDate = ret.startDate.toISOString().slice(0, 10)
    }
    delete ret._id
    delete ret.__v
    return ret
  },
})

const JobRequirement = mongoose.model('JobRequirement', jobRequirementSchema)

export default JobRequirement
