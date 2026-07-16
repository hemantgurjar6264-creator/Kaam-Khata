// server/models/WorkEntry.js
// Mongoose schema/model for a single day's work/ledger entry.
// Every entry is tied to exactly one User via the `user` field, which is
// how we guarantee each worker only ever sees their own data. The `user`
// field is NEVER set from client input - it is always taken from
// req.user._id (set by the `protect` auth middleware).

import mongoose from 'mongoose'

const workEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    employerName: {
      type: String,
      required: [true, 'Employer name is required'],
      trim: true,
    },
    employerPhone: {
      type: String,
      required: [true, 'Employer phone number is required'],
      trim: true,
    },
    hours: {
      type: Number,
      required: [true, 'Hours worked is required'],
      min: [0, 'Hours cannot be negative'],
      max: [24, 'Hours cannot exceed 24'],
    },
    wagePerHour: {
      type: Number,
      default: 0,
      min: [0, 'Wage cannot be negative'],
    },
    rateType: {
      type: String,
      enum: ['hourly', 'daily'],
      default: 'hourly',
      // 'hourly' -> wagePerHour is a per-hour rate, total = hours * wagePerHour
      // 'daily'  -> wagePerHour holds a flat per-day amount, total = wagePerHour
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    photo: {
      type: String, // base64 data URL or hosted image URL
      default: null,
    },
    location: {
      type: new mongoose.Schema(
        { lat: { type: Number }, lng: { type: Number } },
        { _id: false }
      ),
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'disputed'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
)

// Keep entries sorted by most-recent-first efficient for the common
// "my entries" query.
workEntrySchema.index({ user: 1, date: -1 })

// Always keep totalAmount in sync with hours * wagePerHour, whether the
// document is created or updated via .save().
function computeTotal(doc) {
  const hours = Number(doc.hours) || 0
  const wage = Number(doc.wagePerHour) || 0
  if (doc.rateType === 'daily') {
    // Flat day-rate: total pay doesn't scale with hours logged.
    doc.totalAmount = Math.round(wage * 100) / 100
  } else {
    doc.totalAmount = Math.round(hours * wage * 100) / 100
  }
}

workEntrySchema.pre('save', function preSave(next) {
  computeTotal(this)
  next()
})

// Format the document for API responses: expose a clean `id`, drop
// Mongo-specific fields, and render `date` as a plain YYYY-MM-DD string
// so the existing frontend (which was built around plain date strings)
// keeps working unchanged.
workEntrySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    if (ret.date instanceof Date) {
      ret.date = ret.date.toISOString().slice(0, 10)
    }
    delete ret._id
    delete ret.__v
    return ret
  },
})

const WorkEntry = mongoose.model('WorkEntry', workEntrySchema)

export default WorkEntry
