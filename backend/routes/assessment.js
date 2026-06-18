/**
 * BSCRI Assessment Routes
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module defines the public API routes for assessment submission
 * and result retrieval.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const express = require('express');
const router = express.Router();

// ============================================================
// Controller Imports
// ============================================================

const {
  submitAssessment,
  getAssessmentResult
} = require('../controllers/assessmentController');

// ============================================================
// Route Definitions
// ============================================================

/**
 * Submit a new assessment
 * 
 * POST /api/assessment/submit
 * 
 * Request Body:
 *   - responses: Object mapping question IDs (q1-q25) to scores (0-3)
 *   - sector: String (agriculture, mining, manufacturing, retail, services, government, nonprofit, other)
 *   - region: String (gaborone, francistown, maun, lobatse, selebi-phikwe, other)
 *   - companySize: String (micro, small, medium, large, enterprise)
 *   - organizationName: String (optional)
 *   - contactEmail: String (optional)
 * 
 * Response:
 *   - success: true
 *   - id: String (assessment ID)
 *   - scores: Object (dimension scores and overall)
 *   - maturityLevel: String
 *   - maturityDetails: Object (label, description, color)
 *   - gapAnalysis: Object
 *   - recommendations: Object
 *   - actionPlan: Array
 *   - submittedAt: Date
 *   - metadata: Object
 */
router.post('/submit', submitAssessment);

/**
 * Retrieve assessment results by ID
 * 
 * GET /api/assessment/result/:id
 * 
 * Path Parameters:
 *   - id: String (24-character MongoDB ObjectId)
 * 
 * Response:
 *   - Same as submission response
 */
router.get('/result/:id', getAssessmentResult);

// ============================================================
// Module Exports
// ============================================================

module.exports = router;
