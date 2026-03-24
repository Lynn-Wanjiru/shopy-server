import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopy')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message))

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static('uploads')) // Serve uploaded images


// Routes
import productRoutes from './routes/productRoutes.js'
import authRoutes from './routes/authRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)

// Test route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Shopy API is running', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Server error', error: err.message })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})