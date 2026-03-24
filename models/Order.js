import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        name: String,
        quantity: Number,
        price: Number,
        imageUrl: String
      }
    ],
    deliveryInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'stripe', 'paypal'],
      default: 'mpesa'
    },
    mpesaTransactionId: String,
    mpesaCheckoutRequestId: String,
    paymentTimestamp: Date,
    shippingDate: Date,
    deliveryDate: Date,
    notes: String
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
