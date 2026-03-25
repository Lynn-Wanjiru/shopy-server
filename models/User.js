import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: false,
      minlength: 6
    },
    // OAuth fields
    googleId: {
      type: String,
      default: null,
      sparse: true
    },
    oauthProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email'
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name']
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name']
    },
    phone: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    address: {
      street: String,
      city: String,
      country: String,
      zipCode: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
