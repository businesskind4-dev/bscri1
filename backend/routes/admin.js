/**
 * BSCRI Admin Routes
 * Botswana Supply Chain Readiness Index
 *
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 *
 * This module defines the admin API routes for authentication,
 * data retrieval, statistics, and export functionality.
 *
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ============================================================
// Middleware Imports
// ============================================================

const { authenticate } = require('../middlewares/auth');
const { verifyPassword } = require('../utils/password');

// ============================================================
// Model Imports
// ============================================================

const Assessment = require('../models/Assessment');

// ============================================================
// Constants
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// ============================================================
// Validation
// ============================================================

if (!ADMIN_PASSWORD_HASH) {
  console.error('ADMIN_PASSWORD_HASH environment variable is not defined.');
  console.error('Please generate a hash using: node -e "const bcrypt = require(\'bcrypt\'); bcrypt.hash(\'your_password\', 10).then(h => console.log(h));"');
  console.error('Then add ADMIN_PASSWORD_HASH to your .env file.');
  process.exit(1);
}

// ============================================================
// Route: Admin Login
// ============================================================

/**
 * Authenticate admin and issue JWT token
 *
 * POST /api/admin/login
 *
 * Request Body:
 *   - username: String (admin username)
 *   - password: String (admin password)
 *
 * Response:
 *   - success: true
 *   - token: String (JWT token)
 *   - expiresIn: String (token expiry duration)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      const error = new Error('Username and password are required');
      error.statusCode = 400;
      return next(error);
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);

    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { admin: true, username: ADMIN_USERNAME },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log successful login (audit)
    console.log(`Admin login successful from IP: ${req.ip}`);

    res.status(200).json({
      success: true,
      token,
      expiresIn: JWT_EXPIRES_IN,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// ============================================================
// Protected Routes (Require Authentication)
// ============================================================

/**
 * Get all assessments with optional filtering
 *
 * GET /api/admin/assessments
 *
 * Query Parameters (optional):
 *   - limit: Number (default 100)
 *   - skip: Number (default 0)
 *   - sector: String (filter by sector)
 *   - region: String (filter by region)
 *   - fromDate: Date (ISO string)
 *   - toDate: Date (ISO string)
 *
 * Response:
 *   - success: true
 *   - data: Array of assessment objects
 *   - pagination: Object (total, limit, skip)
 */
router.get('/assessments', authenticate, async (req, res, next) => {
  try {
    const {
      limit = 100,
      skip = 0,
      sector,
      region,
      fromDate,
      toDate
    } = req.query;

    // Build filter object
    const filter = {};

    if (sector) filter.sector = sector;
    if (region) filter.region = region;

    if (fromDate || toDate) {
      filter.submittedAt = {};
      if (fromDate) filter.submittedAt.$gte = new Date(fromDate);
      if (toDate) filter.submittedAt.$lte = new Date(toDate);
    }

    // Convert limit and skip to numbers
    const limitNum = parseInt(limit, 10);
    const skipNum = parseInt(skip, 10);

    // Execute query
    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .sort({ submittedAt: -1 })
        .limit(limitNum)
        .skip(skipNum)
        .lean(),
      Assessment.countDocuments(filter)
    ]);

    // Format response
    const data = assessments.map(doc => ({
      id: doc._id.toString(),
      scores: doc.scores,
      maturityLevel: doc.maturityLevel,
      sector: doc.sector,
      region: doc.region,
      companySize: doc.companySize,
      submittedAt: doc.submittedAt
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get detailed assessment by ID
 *
 * GET /api/admin/assessments/:id
 *
 * Path Parameters:
 *   - id: String (24-character MongoDB ObjectId)
 *
 * Response:
 *   - success: true
 *   - data: Full assessment object including responses
 */
router.get('/assessments/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      const error = new Error('Invalid assessment ID');
      error.statusCode = 400;
      return next(error);
    }

    const assessment = await Assessment.findById(id).lean();

    if (!assessment) {
      const error = new Error('Assessment not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        ...assessment,
        id: assessment._id.toString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get statistics and aggregations
 *
 * GET /api/admin/stats
 *
 * Response:
 *   - success: true
 *   - total: Number (total assessments)
 *   - averages: Object (average scores per dimension)
 *   - bySector: Array (sector breakdown)
 *   - byRegion: Array (region breakdown)
 *   - bySize: Array (company size breakdown)
 *   - byMaturity: Array (maturity level distribution)
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    // Total count
    const total = await Assessment.countDocuments();

    // Average scores across all assessments
    const avgScores = await Assessment.aggregate([
      {
        $group: {
          _id: null,
          avgProcurement: { $avg: '$scores.procurement' },
          avgLogistics: { $avg: '$scores.logistics' },
          avgCompliance: { $avg: '$scores.compliance' },
          avgDigital: { $avg: '$scores.digital' },
          avgSupplier: { $avg: '$scores.supplier' },
          avgResilience: { $avg: '$scores.resilience' },
          avgTrade: { $avg: '$scores.trade' },
          avgOverall: { $avg: '$scores.overall' }
        }
      }
    ]);

    // Breakdown by sector
    const bySector = await Assessment.aggregate([
      { $group: { _id: '$sector', count: { $sum: 1 }, avgScore: { $avg: '$scores.overall' } } },
      { $sort: { count: -1 } }
    ]);

    // Breakdown by region
    const byRegion = await Assessment.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 }, avgScore: { $avg: '$scores.overall' } } },
      { $sort: { count: -1 } }
    ]);

    // Breakdown by company size
    const bySize = await Assessment.aggregate([
      { $group: { _id: '$companySize', count: { $sum: 1 }, avgScore: { $avg: '$scores.overall' } } },
      { $sort: { count: -1 } }
    ]);

    // Breakdown by maturity level
    const byMaturity = await Assessment.aggregate([
      { $group: { _id: '$maturityLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCount = await Assessment.countDocuments({
      submittedAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      total,
      recentCount,
      averages: avgScores.length > 0 ? avgScores[0] : null,
      bySector,
      byRegion,
      bySize,
      byMaturity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Export all assessment data as JSON
 *
 * GET /api/admin/export
 *
 * Response:
 *   - JSON array of all assessments with full data
 */
router.get('/export', authenticate, async (req, res, next) => {
  try {
    // Fetch all assessments
    const assessments = await Assessment.find()
      .sort({ submittedAt: -1 })
      .lean();

    // Format for export
    const data = assessments.map(doc => ({
      id: doc._id.toString(),
      scores: doc.scores,
      maturityLevel: doc.maturityLevel,
      sector: doc.sector,
      region: doc.region,
      companySize: doc.companySize,
      organizationName: doc.organizationName || null,
      contactEmail: doc.contactEmail || null,
      submittedAt: doc.submittedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

// ============================================================
// Module Exports
// ============================================================

module.exports = router;