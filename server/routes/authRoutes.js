// server/routes/authRoutes.js
// Defines the /api/auth/* endpoints.

import express from 'express'
import rateLimit from 'express-rate-limit'
import { registerUser, loginUser, getMe, logoutUser, resetPasswordWithOtp } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Rate limit auth endpoints to slow down brute-force attacks.
// 20 requests per 15 minutes per IP is generous for real users but
// annoying enough for automated password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
})

router.post('/register', authLimiter, registerUser)
router.post('/login', authLimiter, loginUser)
router.post('/reset-password-otp', authLimiter, resetPasswordWithOtp)
router.get('/me', protect, getMe)
router.post('/logout', protect, logoutUser)

export default router
