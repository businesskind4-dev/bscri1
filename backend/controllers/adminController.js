/**
 * BSCRI Admin Controller
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module handles admin operations including assessment retrieval,
 * statistics aggregation, and data export.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const Assessment = require('../models/Assessment');
const jwt = require('jsonwebtoken');

// ============================================================
// Constants
// ============================================================

const DEFAULT_LIMIT = 100;
const DEFAULT_SKIP = 0;
const VALID_SECTORS = ['agriculture', 'mining', 'manufacturing', 'retail', 'services', 'government', 'nonprofit', 'other'];
const VALID_REGIONS = ['gaborone', 'francistown', 'maun', 'lobatse', 'selebi-phikwe', 'other'];
const VALID_MATURITY = ['foundational', 'emerging', 'developing', 'established', 'advanced'];
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Build filter object for assessment queries
 * @param {Object} query - Request query parameters
 * @returns {Object} MongoDB filter object
 */
const buildFilter = (query) => {
  const filter = {};

  if (query.sector && VALID_SECTORS.includes(query.sector)) {
    filter.sector = query.sector;
  }

  if (query.region && VALID_REGIONS.includes(query.region)) {
    filter.region = query.region;
  }

  if (query.maturity && VALID_MATURITY.includes(query.maturity)) {
    filter.maturityLevel = query.maturity;
  }

  if (query.fromDate || query.toDate) {
    filter.submittedAt = {};
    if (query.fromDate) {
      filter.submittedAt.$gte = new Date(query.fromDate);
    }
    if (query.toDate) {
      filter.submittedAt.$lte = new Date(query.toDate);
    }
  }

  return filter;
};

/**
 * Format assessment for API response
 * @param {Object} doc - Mongoose document
 * @returns {Object} Formatted assessment object
 */
const formatAssessment = (doc) => {
  return {
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
  };
};

/**
 * Format assessment with full details including responses
 * @param {Object} doc - Mongoose document
 * @returns {Object} Full assessment object
 */
const formatAssessmentFull = (doc) => {
  return {
    ...formatAssessment(doc),
    responses: doc.responses
  };
};

// ============================================================
// Controller Functions
// ============================================================

/**
 * Authenticate admin and issue a JWT token
 * POST /api/admin/login
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    console.log('Admin login attempt:', {
      username: username || null,
      ip: req.ip,
      hasPassword: Boolean(password),
      timestamp: new Date().toISOString()
    });

    if (!JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('Admin login configuration error:', {
        hasJwtSecret: Boolean(JWT_SECRET),
        hasAdminUsername: Boolean(ADMIN_USERNAME),
        hasAdminPassword: Boolean(ADMIN_PASSWORD)
      });

      return res.status(500).json({
        success: false,
        error: 'Admin authentication is not configured correctly'
      });
    }

    if (!username || !password) {
      console.warn('Admin login rejected: missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!isValid) {
      console.warn('Admin login rejected: invalid credentials', {
        username,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { admin: true, username: ADMIN_USERNAME },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('Admin login successful:', {
      username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      token,
      expiresIn: JWT_EXPIRES_IN,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Admin login failed unexpectedly:', {
      message: error.message,
      stack: error.stack,
      ip: req.ip
    });
    return next(error);
  }
};

/**
 * Get assessments with pagination and filtering
 * GET /api/admin/assessments
 * 
 * Query Parameters:
 *   - limit: Number (default 100)
 *   - skip: Number (default 0)
 *   - sector: String
 *   - region: String
 *   - maturity: String
 *   - fromDate: Date (ISO string)
 *   - toDate: Date (ISO string)
 */
const getAssessments = async (req, res, next) => {
  try {
    const {
      limit = DEFAULT_LIMIT,
      skip = DEFAULT_SKIP,
      sector,
      region,
      maturity,
      fromDate,
      toDate
    } = req.query;

    // Validate and parse pagination parameters
    const limitNum = parseInt(limit, 10);
    const skipNum = parseInt(skip, 10);

    if (isNaN(limitNum) || limitNum < 1) {
      const error = new Error('Invalid limit parameter. Must be a positive integer.');
      error.statusCode = 400;
      return next(error);
    }

    if (isNaN(skipNum) || skipNum < 0) {
      const error = new Error('Invalid skip parameter. Must be a non-negative integer.');
      error.statusCode = 400;
      return next(error);
    }

    // Build filter
    const filter = buildFilter(req.query);

    // Execute queries in parallel
    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .sort({ submittedAt: -1 })
        .limit(limitNum)
        .skip(skipNum)
        .lean(),
      Assessment.countDocuments(filter)
    ]);

    // Format response
    const data = assessments.map(formatAssessment);

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
};

/**
 * Get a single assessment by ID with full details
 * GET /api/admin/assessments/:id
 */
const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
      const error = new Error('Invalid assessment ID format. Must be a 24-character MongoDB ObjectId.');
      error.statusCode = 400;
      return next(error);
    }

    const assessment = await Assessment.findById(id).lean();

    if (!assessment) {
      const error = new Error('Assessment not found.');
      error.statusCode = 404;
      return next(error);
    }

    const data = formatAssessmentFull(assessment);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 * 
 * Returns:
 *   - Total assessments
 *   - Recent count (last 30 days)
 *   - Average scores by dimension
 *   - Breakdown by sector, region, company size, maturity level
 */
const getStats = async (req, res, next) => {
  try {
    // Total count
    const total = await Assessment.countDocuments();

    // Recent count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await Assessment.countDocuments({
      submittedAt: { $gte: thirtyDaysAgo }
    });

    // Average scores across all assessments
    const avgScoresPipeline = [
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
    ];

    const avgScoresResult = await Assessment.aggregate(avgScoresPipeline);
    const averages = avgScoresResult.length > 0 ? avgScoresResult[0] : null;

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

    res.status(200).json({
      success: true,
      total,
      recentCount,
      averages,
      bySector,
      byRegion,
      bySize,
      byMaturity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Export all assessment data
 * GET /api/admin/export
 * 
 * Returns all assessments with full data as JSON array
 */
const exportData = async (req, res, next) => {
  try {
    const assessments = await Assessment.find()
      .sort({ submittedAt: -1 })
      .lean();

    const data = assessments.map(formatAssessmentFull);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete an assessment by ID
 * DELETE /api/admin/assessments/:id
 * 
 * This is a soft-delete operation (hard delete for MVP)
 */
const deleteAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      const error = new Error('Invalid assessment ID format.');
      error.statusCode = 400;
      return next(error);
    }

    const assessment = await Assessment.findByIdAndDelete(id);

    if (!assessment) {
      const error = new Error('Assessment not found.');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully.',
      id: id
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  loginAdmin,
  getAssessments,
  getAssessmentById,
  getStats,
  exportData,
  deleteAssessment
};
