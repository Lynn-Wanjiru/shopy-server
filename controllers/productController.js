import Product from '../models/Product.js'
import fs from 'fs'
import path from 'path'

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query
    
    let query = { isActive: true }
    
    if (category) {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await Product.findById(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: product
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    
    const products = await Product.find({ 
      category: category,
      isActive: true
    }).sort({ name: 1 })
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, stock, sku } = req.body
    
    // Determine image source: file upload or URL
    let finalImageUrl = imageUrl
    
    if (req.file) {
      // If file was uploaded, use the file path
      finalImageUrl = `/uploads/${req.file.filename}`
    }
    
    if (!finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either an image file or image URL'
      })
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      imageUrl: finalImageUrl,
      category,
      stock,
      sku
    })
    
    res.status(201).json({
      success: true,
      data: product
    })
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    // Get the current product to handle image deletion
    const currentProduct = await Product.findById(id)
    
    if (!currentProduct) {
      if (req.file) fs.unlinkSync(req.file.path)
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // If new file is uploaded
    if (req.file) {
      // Delete old image if it's a local file (not a URL)
      if (currentProduct.imageUrl && currentProduct.imageUrl.startsWith('/uploads/')) {
        const oldImagePath = path.join('.', currentProduct.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      // Use new file path
      updates.imageUrl = `/uploads/${req.file.filename}`
    } else if (updates.imageUrl === '') {
      // If imageUrl is empty string, keep the old one
      updates.imageUrl = currentProduct.imageUrl
    }
    
    const product = await Product.findByIdAndUpdate(id, updates, { 
      returnDocument: 'after',
      runValidators: true
    })
    
    res.status(200).json({
      success: true,
      data: product
    })
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await Product.findByIdAndDelete(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Delete the image file if it's a local upload
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join('.', product.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}