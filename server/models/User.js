// server/models/User.js
// Mongoose schema/model for a user (worker) account.
// Passwords are hashed with bcrypt before being saved - we never store
// plain text passwords in the database.

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    role: {
      type: String,
      enum: ['worker', 'employer'],
      default: 'worker',
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name must be less than 150 characters'],
      default: '',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      // Basic Indian mobile number validation: 10 digits, optionally
      // starting with +91. Adjust this regex if you need other countries.
      match: [/^(\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return the password hash by default in queries
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
)

// Hash the password before saving, but only if it was modified
// (so we don't re-hash an already-hashed password on unrelated updates).
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method to compare a plain text password with the stored hash.
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Never leak the password hash even if a document is accidentally
// serialized to JSON somewhere.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.model('User', userSchema)

export default User
