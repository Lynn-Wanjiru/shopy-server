// Admin middleware - will be fully implemented in Part 6 (Authentication)
// For now, all admin routes are accessible. JWT verification will be added later.

export const isAdmin = (req, res, next) => {
  // TODO: Add JWT verification and admin role check in Part 6
  // For now, allow all requests to proceed
  next()
}

export const isAuthenticated = (req, res, next) => {
  // TODO: Add JWT verification in Part 6
  // For now, allow all requests to proceed
  next()
}