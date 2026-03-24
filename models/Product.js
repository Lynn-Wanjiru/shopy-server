import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL']
    },
    category: {
      type: String,
      required: [true, 'Please provide a product category'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)