import express from 'express'
import upload from '../config/multerConfig.js'
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js'
import { isAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/', getAllProducts)
router.get('/:id', getProductById)
router.get('/category/:category', getProductsByCategory)

// Admin routes with authentication and Multer
router.post('/', isAdmin, upload.single('image'), createProduct)
router.put('/:id', isAdmin, upload.single('image'), updateProduct)
router.delete('/:id', isAdmin, deleteProduct)

export default router