import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key')

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

export const isAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key')

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this resource'
      })
    }

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}