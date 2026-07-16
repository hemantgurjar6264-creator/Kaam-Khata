// server/middleware/errorMiddleware.js
// Centralized error handling so controllers can just `throw` or call
// `next(error)` and get a consistent JSON error response.

/**
 * Handles requests to routes that don't exist.
 */
export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  res.status(404)
  next(error)
}

/**
 * Final error handler - formats all errors as consistent JSON.
 * Must be registered LAST, after all routes.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
  let message = err.message || 'Server Error'

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404
    message = 'Resource not found'
  }

  // Mongoose duplicate key error (e.g. phoneNumber already registered)
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `An account with this ${field} already exists`
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the stack trace in development, never in production
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}
