// server/middleware/authMiddleware.js
// Protects routes by verifying the JWT stored in the HTTP-only cookie.
// If the token is missing or invalid, we respond with 401 so the frontend
// can redirect the user to /login.

import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { COOKIE_NAME } from '../utils/generateToken.js'

export async function protect(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME]

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
    }

    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' })
    }

    // Attach the user to the request so downstream route handlers can use it
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export default protect
