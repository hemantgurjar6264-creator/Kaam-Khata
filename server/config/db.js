// server/config/db.js
// Handles the connection to MongoDB Atlas using Mongoose.

import mongoose from 'mongoose'

/**
 * Connects to MongoDB Atlas using the connection string in MONGODB_URI.
 * If the connection fails, we log the error and exit the process,
 * because the API cannot function without a database connection.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined. Please set it in server/.env')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
