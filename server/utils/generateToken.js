// server/utils/generateToken.js
// Small helper that signs a JWT for a given user id and attaches it to the
// response as an HTTP-only cookie. Keeping this in one place means the
// cookie settings (httpOnly, sameSite, secure, maxAge) are always consistent
// between register and login.

import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'token'

/**
 * Signs a JWT containing the user's id and sets it as an HTTP-only cookie
 * on the response.
 * @param {import('express').Response} res
 * @param {string} userId
 */
export function generateTokenAndSetCookie(res, userId) {
  const expiresDays = Number(process.env.JWT_EXPIRES_DAYS || 7)

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${expiresDays}d`,
  })

  const isProduction = process.env.NODE_ENV === 'production'

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JS on the client can never read this cookie (protects against XSS token theft)
    // In production the client (e.g. vercel.app) and server (e.g. onrender.com) live on
    // different domains, so the cookie must be sameSite:'none' + secure:true to be sent
    // on cross-site XHR/fetch requests. 'lax' only works when both are on the same site.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction, // only sent over HTTPS in production ('none' requires secure)
    maxAge: expiresDays * 24 * 60 * 60 * 1000, // in milliseconds
    path: '/',
  })

  return token
}

/**
 * Clears the auth cookie - used on logout.
 * @param {import('express').Response} res
 */
export function clearTokenCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production'
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  })
}

export { COOKIE_NAME }
