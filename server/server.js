// server/server.js
// Entry point for the Kaam Khata backend API.

import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'

import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import workRoutes from './routes/workRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

dotenv.config()

// Connect to MongoDB Atlas before starting the server
connectDB()

const app = express()

// ---------- Security & core middleware ----------
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // allow the HTTP-only cookie to be sent/received
  })
)
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(cookieParser())

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Kaam Khata API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/work', workRoutes)

// ---------- Error handling (must be last) ----------
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Kaam Khata server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`)
})
