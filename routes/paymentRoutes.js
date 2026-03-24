import express from 'express'
import {
  initiateStkPush,
  paymentCallback,
  checkPaymentStatus,
  getUserOrders
} from '../controllers/paymentController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// Initiate M-Pesa STK Push payment
router.post('/initiate', authenticate, initiateStkPush)

// Payment callback from M-Pesa (public endpoint)
router.post('/callback', paymentCallback)

// Check payment status
router.get('/status/:checkoutRequestId', authenticate, checkPaymentStatus)

// Get user orders
router.get('/orders', authenticate, getUserOrders)

export default router
