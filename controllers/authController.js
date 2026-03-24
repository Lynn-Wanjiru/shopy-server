import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

// Register
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user'
    })

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    )

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Logout (client-side only, but endpoint for consistency)
export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
}

// Google OAuth
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token required'
      })
    }

    // Verify token with Google
    const { OAuth2Client } = await import('google-auth-library')
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId })

    if (!user) {
      // Check if email exists
      user = await User.findOne({ email })

      if (!user) {
        // Create new user
        user = await User.create({
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || '',
          googleId,
          oauthProvider: 'google',
          role: 'user'
        })
      } else {
        // Link Google ID to existing user
        user.googleId = googleId
        user.oauthProvider = 'google'
        await user.save()
      }
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    )

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    })
  }
}