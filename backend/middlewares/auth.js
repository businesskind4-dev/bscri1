/**
 * BSCRI Authentication Middleware
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module provides JWT authentication middleware for protecting
 * admin routes. It verifies incoming tokens and grants access to
 * authenticated admin users.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const jwt = require('jsonwebtoken');

// ============================================================
// Constants
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_HEADER = 'Authorization';
const TOKEN_PREFIX = 'Bearer ';

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not defined.');
  console.error('Please set JWT_SECRET in your .env file.');
  process.exit(1);
}

// ============================================================
// Authentication Middleware
// ============================================================

/**
 * Verify JWT token and authenticate admin access
 * 
 * This middleware extracts the JWT from the Authorization header,
 * verifies it, and attaches the decoded payload to the request
 * object for downstream use.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void}
 */
const authenticate = (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers[TOKEN_HEADER.toLowerCase()];
    
    if (!authHeader) {
      console.warn('Authentication rejected: missing Authorization header', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check for Bearer prefix
    if (!authHeader.startsWith(TOKEN_PREFIX)) {
      console.warn('Authentication rejected: invalid token format', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Use Bearer scheme.'
      });
    }

    // Extract token
    const token = authHeader.substring(TOKEN_PREFIX.length).trim();
    
    if (!token) {
      console.warn('Authentication rejected: empty token', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Token is empty'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        console.warn('Authentication rejected: expired token', {
          url: req.originalUrl,
          ip: req.ip
        });
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please log in again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.warn('Authentication rejected: invalid JWT', {
          url: req.originalUrl,
          ip: req.ip,
          reason: error.message
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid token signature or malformed token.'
        });
      }

      console.warn('Authentication rejected: token verification failed', {
        url: req.originalUrl,
        ip: req.ip,
        reason: error.message
      });
      return res.status(401).json({
        success: false,
        error: 'Token verification failed.'
      });
    }

    // Verify token contains admin claim
    if (!decoded.admin) {
      console.warn('Authentication rejected: missing admin claim', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges. Admin access required.'
      });
    }

    // Attach decoded token payload to request
    req.user = {
      admin: decoded.admin,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
    };

    // Log successful authentication (optional, for audit)
    // console.log(`Admin authenticated successfully at ${new Date().toISOString()}`);

    next();
  } catch (error) {
    // Catch any unexpected errors during authentication
    const err = new Error(`Authentication failed: ${error.message}`);
    err.statusCode = 500;
    next(err);
  }
};

// ============================================================
// Optional: Role-Based Access Control (Future Extension)
// ============================================================

/**
 * Check if authenticated user has a specific role
 * 
 * This is a placeholder for future role-based access control.
 * Currently, all authenticated users are admins.
 * 
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required before role check');
      error.statusCode = 401;
      return next(error);
    }

    // For now, all authenticated users are admins
    // Future implementation can check req.user.role against roles array
    next();
  };
};

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  authenticate,
  requireRole
};
