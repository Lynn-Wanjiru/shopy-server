import axios from 'axios'
import Order from '../models/Order.js'

// Get credentials from .env (called at runtime, not import time)
const getCredentials = () => {
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'http://localhost:5000/api/payments/callback'
  }
}

const DARAJA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
const DARAJA_STK_PUSH_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
const DARAJA_QUERY_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'

// Generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

// Get access token from M-Pesa
const getAccessToken = async () => {
  try {
    const creds = getCredentials()
    
    // Verify credentials are loaded
    if (!creds.consumerKey || !creds.consumerSecret) {
      throw new Error('M-Pesa credentials not configured in .env file')
    }

    console.log('🔐 Getting M-Pesa access token...')
    console.log('Consumer Key:', creds.consumerKey.substring(0, 10) + '...')
    
    const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64')
    
    const response = await axios.get(DARAJA_AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    })
    
    console.log('✅ Access token received')
    return response.data.access_token
  } catch (error) {
    console.error('❌ Error getting access token:')
    console.error('Status:', error.response?.status)
    console.error('Message:', error.response?.data || error.message)
    throw new Error('Failed to authenticate with M-Pesa. Check credentials in .env file.')
  }
}

// Initiate STK Push payment
export const initiateStkPush = async (req, res) => {
  try {
    const creds = getCredentials()
    const { phone, amount, orderId, items, deliveryInfo } = req.body
    const userId = req.user.id

    // Validate input
    if (!phone || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number or amount'
      })
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order in database
    const order = new Order({
      userId,
      orderNumber,
      items,
      deliveryInfo,
      subtotal: amount * 0.86, // Rough calculation, adjust as needed
      tax: amount * 0.14,
      totalAmount: amount,
      status: 'pending',
      paymentMethod: 'mpesa'
    })

    await order.save()

    // Get access token
    const accessToken = await getAccessToken()

    // Format phone number (ensure it's in correct format)
    let formattedPhone = phone.toString()
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // Generate timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[^\d]/g, '')
      .substring(0, 14)

    // Generate password for STK Push
    const password = Buffer.from(`${creds.shortcode}${creds.passkey}${timestamp}`).toString('base64')

    // Prepare STK Push request
    const stkPushData = {
      BusinessShortCode: creds.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: creds.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: creds.callbackUrl,
      AccountReference: orderNumber,
      TransactionDesc: `Payment for order ${orderNumber}`
    }

    console.log('STK Push Request:', stkPushData)

    // Send STK Push request
    const stkResponse = await axios.post(DARAJA_STK_PUSH_URL, stkPushData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    console.log('STK Push Response:', stkResponse.data)

    // Save checkout request ID to order
    if (stkResponse.data.CheckoutRequestID) {
      order.mpesaCheckoutRequestId = stkResponse.data.CheckoutRequestID
      await order.save()
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      checkoutRequestId: stkResponse.data.CheckoutRequestID,
      orderId: order._id,
      orderNumber: orderNumber
    })
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      error: error.response?.data || error.message
    })
  }
}

// Payment callback from M-Pesa
export const paymentCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback

    console.log('Payment Callback:', callbackData)

    const resultCode = callbackData.ResultCode
    const checkoutRequestId = callbackData.CheckoutRequestID
    const merchantRequestId = callbackData.MerchantRequestID

    // Find order by checkout request ID
    const order = await Order.findOne({ mpesaCheckoutRequestId: checkoutRequestId })

    if (!order) {
      console.log('Order not found for checkout request:', checkoutRequestId)
      return res.status(200).json({ success: false })
    }

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.CallbackMetadata.Item
      const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value
      const transactionTimestamp = callbackMetadata.find(item => item.Name === 'TransactionTimestamp')?.Value
      const phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber')?.Value

      // Update order status
      order.status = 'paid'
      order.mpesaTransactionId = mpesaReceiptNumber
      order.paymentTimestamp = new Date()
      await order.save()

      console.log('Payment successful for order:', order.orderNumber)
    } else {
      // Payment failed
      order.status = 'cancelled'
      await order.save()

      console.log('Payment failed for order:', order.orderNumber, 'Result code:', resultCode)
    }

    // Return success to M-Pesa
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Callback Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Query payment status
export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params

    const order = await Order.findOne({ mpesaCheckoutRequestId: checkoutRequestId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.status(200).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentTimestamp: order.paymentTimestamp
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Get orders for user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id

    const orders = await Order.find({ userId }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      orders
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
