// server/controllers/authController.js
// Business logic for registration, login, fetching the current user,
// and logout. Kept free of Express-specific routing details so it's
// easy to test/read.

import User from '../models/User.js'
import { generateTokenAndSetCookie, clearTokenCookie } from '../utils/generateToken.js'
import { initFirebaseAdmin } from '../config/firebaseAdmin.js'

// Normalizes a phone number by stripping spaces, dashes, and a leading +91
// so "9876500000", "+91 98765 00000" etc. are all treated as the same number.
function normalizePhone(rawPhone = '') {
  const digitsOnly = String(rawPhone).replace(/[^\d]/g, '')
  return digitsOnly.length === 12 && digitsOnly.startsWith('91')
    ? digitsOnly.slice(2)
    : digitsOnly
}

/**
 * @route   POST /api/auth/register
 * @desc    Create a new worker account
 * @access  Public
 */
export async function registerUser(req, res, next) {
  try {
    const { name, role, companyName, phoneNumber, password, confirmPassword } = req.body

    // ---- Validation ----
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' })
    }

    const normalizedRole = role === 'employer' ? 'employer' : 'worker'

    if (normalizedRole === 'employer' && (!companyName || !companyName.trim())) {
      return res.status(400).json({ success: false, message: 'Company / business name is required' })
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' })
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' })
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    // ---- Uniqueness check ----
    const existingUser = await User.findOne({ phoneNumber: normalizedPhone })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this mobile number already exists' })
    }

    // ---- Create user (password gets hashed automatically via the pre-save hook) ----
    const user = await User.create({
      name: name.trim(),
      role: normalizedRole,
      companyName: normalizedRole === 'employer' ? companyName.trim() : '',
      phoneNumber: normalizedPhone,
      password,
    })

    user.lastLoginAt = new Date()
    await user.save()

    generateTokenAndSetCookie(res, user._id.toString())

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Log a user in with phone number + password
 * @access  Public
 */
export async function loginUser(req, res, next) {
  try {
    const { phoneNumber, password } = req.body

    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required' })
    }

    const normalizedPhone = normalizePhone(phoneNumber)

    // We explicitly select('+password') because the schema hides it by default
    const user = await User.findOne({ phoneNumber: normalizedPhone }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' })
    }

    user.lastLoginAt = new Date()
    await user.save()

    generateTokenAndSetCookie(res, user._id.toString())

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently logged-in user (based on the JWT cookie)
 * @access  Private
 */
export async function getMe(req, res, next) {
  try {
    // req.user was attached by the `protect` middleware
    const user = req.user

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/auth/reset-password-otp
 * @desc    Reset a user's password after they've verified an SMS OTP
 *          via Firebase Phone Auth on the client. The client sends us
 *          the Firebase ID token it received after confirming the OTP;
 *          we verify that token with Firebase Admin (proving the phone
 *          really is theirs) and then update the password.
 * @access  Public (identity is proven by the verified OTP, not a login)
 */
export async function resetPasswordWithOtp(req, res, next) {
  try {
    const { idToken, newPassword, confirmNewPassword } = req.body

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Missing OTP verification token' })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    // ---- Verify the OTP was actually confirmed with Firebase ----
    const admin = initFirebaseAdmin()
    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken)
    } catch (verifyError) {
      return res.status(401).json({ success: false, message: 'OTP verification expired or invalid. Please try again.' })
    }

    const firebasePhone = decodedToken.phone_number // e.g. "+919876500000"
    if (!firebasePhone) {
      return res.status(401).json({ success: false, message: 'Could not verify a phone number for this OTP.' })
    }

    const normalizedPhone = normalizePhone(firebasePhone)

    // ---- Find the matching account and update the password ----
    const user = await User.findOne({ phoneNumber: normalizedPhone }).select('+password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for this mobile number' })
    }

    user.password = newPassword // pre-save hook re-hashes it since it's modified
    await user.save()

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    next(error)
  }
}

/**
 * @route   POST /api/auth/logout
 * @desc    Clear the auth cookie
 * @access  Private
 */
export async function logoutUser(req, res, next) {
  try {
    clearTokenCookie(res)
    return res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}
