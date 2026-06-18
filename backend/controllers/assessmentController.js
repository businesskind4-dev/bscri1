/**
 * BSCRI Assessment Controller
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module handles assessment submission, score calculation,
 * recommendation generation, and result retrieval.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const Assessment = require('../models/Assessment');

// ============================================================
// Constants
// ============================================================

const TOTAL_QUESTIONS = 25;
const QUESTION_PATTERN = /^q([1-9]|1[0-9]|2[0-5])$/;

// ============================================================
// Recommendation Engine
// ============================================================

/**
 * Recommendation database mapping dimension scores to resources.
 * This implements the recommendation-engine.md methodology.
 */
const RECOMMENDATIONS = {
  procurement: {
    critical: [
      { priority: 1, recommendation: 'Establish a basic procurement policy', resource: 'BITC Procurement Guidelines' },
      { priority: 2, recommendation: 'Train staff on procurement fundamentals', resource: 'LEA Entrepreneurship Training' },
      { priority: 3, recommendation: 'Document supplier evaluation criteria', resource: 'BSCRI Supplier Evaluation Template' },
      { priority: 4, recommendation: 'Create a supplier code of conduct', resource: 'SCC Ethical Procurement Toolkit' }
    ],
    gap: [
      { priority: 1, recommendation: 'Implement strategic sourcing', resource: 'CEDA Business Training' },
      { priority: 2, recommendation: 'Formalize contract management', resource: 'BITC Contract Management Workshop' },
      { priority: 3, recommendation: 'Develop supplier scorecards', resource: 'BSCRI Supplier Scorecard Template' },
      { priority: 4, recommendation: 'Adopt e-procurement tools', resource: 'SCC Digital Procurement Guide' }
    ],
    good: [
      { priority: 1, recommendation: 'Optimize category management', resource: 'Advanced Procurement Training' },
      { priority: 2, recommendation: 'Benchmark against industry leaders', resource: 'SADC Procurement Network' },
      { priority: 3, recommendation: 'Achieve ISO 20400 certification', resource: 'Botswana Bureau of Standards (BOBS)' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Mentor other organizations', resource: 'SCC Mentorship Program' },
      { priority: 2, recommendation: 'Contribute to policy development', resource: 'BSCS Procurement Policy Roundtable' },
      { priority: 3, recommendation: 'Share best practices', resource: 'SCC Knowledge Sharing Platform' }
    ]
  },
  logistics: {
    critical: [
      { priority: 1, recommendation: 'Assess current logistics capabilities', resource: 'BSCRI Logistics Self-Assessment' },
      { priority: 2, recommendation: 'Develop basic transport arrangements', resource: 'BITC Logistics Fundamentals' },
      { priority: 3, recommendation: 'Implement basic inventory tracking', resource: 'Inventory Management Guide (SCC)' },
      { priority: 4, recommendation: 'Identify logistics partners', resource: 'Botswana Transport Association' }
    ],
    gap: [
      { priority: 1, recommendation: 'Implement warehouse management', resource: 'CEDA Warehouse Efficiency Training' },
      { priority: 2, recommendation: 'Optimize delivery routes', resource: 'Logistics Optimization Workshop' },
      { priority: 3, recommendation: 'Adopt inventory forecasting', resource: 'SCC Demand Forecasting Guide' },
      { priority: 4, recommendation: 'Improve last-mile delivery', resource: 'Last-Mile Delivery Best Practices' }
    ],
    good: [
      { priority: 1, recommendation: 'Implement logistics software', resource: 'Digital Logistics Platform Guide' },
      { priority: 2, recommendation: 'Develop logistics KPIs', resource: 'BSCRI Logistics Performance Toolkit' },
      { priority: 3, recommendation: 'Pursue logistics certification', resource: 'Chartered Institute of Logistics (CILT)' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Optimize supply chain network', resource: 'Network Optimization Workshop' },
      { priority: 2, recommendation: 'Adopt IoT for logistics', resource: 'Smart Logistics Guide' },
      { priority: 3, recommendation: 'Share logistics excellence', resource: 'SCC Logistics Forum' }
    ]
  },
  compliance: {
    critical: [
      { priority: 1, recommendation: 'Register with BURS', resource: 'BURS Taxpayer Registration' },
      { priority: 2, recommendation: 'Understand procurement regulations', resource: 'BQA Procurement Guidelines' },
      { priority: 3, recommendation: 'Implement basic compliance procedures', resource: 'SCC Compliance Checklist' },
      { priority: 4, recommendation: 'Conduct compliance audit', resource: 'Internal Audit Guide' }
    ],
    gap: [
      { priority: 1, recommendation: 'Develop procurement policy', resource: 'BITC Policy Template' },
      { priority: 2, recommendation: 'Implement contract compliance', resource: 'Contract Management Training' },
      { priority: 3, recommendation: 'Establish governance structures', resource: 'BSCRI Governance Framework' },
      { priority: 4, recommendation: 'Create compliance register', resource: 'SCC Compliance Management Guide' }
    ],
    good: [
      { priority: 1, recommendation: 'Achieve ISO compliance', resource: 'BOBS ISO Certification Process' },
      { priority: 2, recommendation: 'Implement anti-corruption measures', resource: 'BOCA Anti-Corruption Guidelines' },
      { priority: 3, recommendation: 'Conduct regular compliance reviews', resource: 'SCC Compliance Audit Service' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Lead industry compliance standards', resource: 'BSCS Compliance Committee' },
      { priority: 2, recommendation: 'Mentor on governance', resource: 'SCC Governance Mentorship' },
      { priority: 3, recommendation: 'Contribute to policy reform', resource: 'Policy Advocacy Guide' }
    ]
  },
  digital: {
    critical: [
      { priority: 1, recommendation: 'Assess current digital tools', resource: 'BSCRI Digital Readiness Checklist' },
      { priority: 2, recommendation: 'Implement basic inventory software', resource: 'BITC Digital Literacy Program' },
      { priority: 3, recommendation: 'Create digital presence', resource: 'SME Digital Transformation Guide' },
      { priority: 4, recommendation: 'Basic supplier communication', resource: 'CEDA Digital Business Training' }
    ],
    gap: [
      { priority: 1, recommendation: 'Adopt supply chain software', resource: 'ICT Supply Chain Solutions Guide' },
      { priority: 2, recommendation: 'Implement e-procurement', resource: 'Botswana e-Procurement Platform' },
      { priority: 3, recommendation: 'Train staff on digital tools', resource: 'Digital Skills Training Program' },
      { priority: 4, recommendation: 'Improve data collection', resource: 'SCC Data Management Guide' }
    ],
    good: [
      { priority: 1, recommendation: 'Integrate supply chain systems', resource: 'Systems Integration Workshop' },
      { priority: 2, recommendation: 'Implement data analytics', resource: 'Business Intelligence Training' },
      { priority: 3, recommendation: 'Enhance cybersecurity', resource: 'Cybersecurity Awareness Program' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Adopt AI and advanced analytics', resource: 'AI in Supply Chain Guide' },
      { priority: 2, recommendation: 'Lead digital innovation', resource: 'SCC Digital Innovation Forum' },
      { priority: 3, recommendation: 'Share digital excellence', resource: 'Digital Transformation Case Studies' }
    ]
  },
  supplier: {
    critical: [
      { priority: 1, recommendation: 'Identify potential suppliers', resource: 'Botswana Supplier Database' },
      { priority: 2, recommendation: 'Build supplier relationships', resource: 'Relationship Management Guide' },
      { priority: 3, recommendation: 'Develop supplier onboarding', resource: 'SCC Supplier Onboarding Template' },
      { priority: 4, recommendation: 'Communicate with suppliers', resource: 'Communication Framework Guide' }
    ],
    gap: [
      { priority: 1, recommendation: 'Implement supplier evaluation', resource: 'BSCRI Supplier Scorecard' },
      { priority: 2, recommendation: 'Develop local suppliers', resource: 'LEA Supplier Development Program' },
      { priority: 3, recommendation: 'Formalize supplier partnerships', resource: 'Partnership Framework Guide' },
      { priority: 4, recommendation: 'Conduct supplier audits', resource: 'Auditing Best Practices' }
    ],
    good: [
      { priority: 1, recommendation: 'Expand supplier diversity', resource: 'Diversity Sourcing Guide' },
      { priority: 2, recommendation: 'Develop strategic partnerships', resource: 'CEDA Partnership Support' },
      { priority: 3, recommendation: 'Implement collaborative planning', resource: 'Collaboration Framework' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Develop industry partnerships', resource: 'SCC Industry Collaboration' },
      { priority: 2, recommendation: 'Lead supplier innovation', resource: 'Innovation Partnership Program' },
      { priority: 3, recommendation: 'Share partnership excellence', resource: 'SCC Ecosystem Forum' }
    ]
  },
  resilience: {
    critical: [
      { priority: 1, recommendation: 'Identify key risks', resource: 'BSCRI Risk Assessment Template' },
      { priority: 2, recommendation: 'Diversify suppliers', resource: 'Sourcing Diversification Guide' },
      { priority: 3, recommendation: 'Create business continuity plan', resource: 'LEA Business Continuity Guide' },
      { priority: 4, recommendation: 'Map supply chain dependencies', resource: 'Dependency Mapping Tool' }
    ],
    gap: [
      { priority: 1, recommendation: 'Implement risk management', resource: 'BSCRI Risk Management Framework' },
      { priority: 2, recommendation: 'Test business continuity plan', resource: 'Continuity Testing Guide' },
      { priority: 3, recommendation: 'Develop contingency plans', resource: 'Contingency Planning Workshop' },
      { priority: 4, recommendation: 'Monitor currency risk', resource: 'Financial Risk Management Guide' }
    ],
    good: [
      { priority: 1, recommendation: 'Build resilience culture', resource: 'Resilience Training Program' },
      { priority: 2, recommendation: 'Implement supply chain mapping', resource: 'End-to-End Visibility Guide' },
      { priority: 3, recommendation: 'Develop early warning systems', resource: 'Risk Monitoring Framework' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Lead industry resilience', resource: 'SCC Resilience Roundtable' },
      { priority: 2, recommendation: 'Develop resilience standards', resource: 'Industry Resilience Framework' },
      { priority: 3, recommendation: 'Share resilience best practices', resource: 'Resilience Case Studies' }
    ]
  },
  trade: {
    critical: [
      { priority: 1, recommendation: 'Learn about AfCFTA', resource: 'AfCFTA Botswana Guide' },
      { priority: 2, recommendation: 'Understand export procedures', resource: 'BITC Export Guide' },
      { priority: 3, recommendation: 'Register for trade facilitation', resource: 'BURS Customs Registration' },
      { priority: 4, recommendation: 'Explore regional markets', resource: 'SADC Trade Guide' }
    ],
    gap: [
      { priority: 1, recommendation: 'Develop export readiness', resource: 'CEDA Export Training' },
      { priority: 2, recommendation: 'Implement cross-border logistics', resource: 'Cross-Border Logistics Guide' },
      { priority: 3, recommendation: 'Understand trade agreements', resource: 'AfCFTA/SADC Workshop' },
      { priority: 4, recommendation: 'Explore financing options', resource: 'Trade Finance Guide' }
    ],
    good: [
      { priority: 1, recommendation: 'Pursue international certification', resource: 'ISO/International Standards' },
      { priority: 2, recommendation: 'Expand regional presence', resource: 'Regional Expansion Strategy' },
      { priority: 3, recommendation: 'Develop export partnerships', resource: 'Export Partnership Program' }
    ],
    excellent: [
      { priority: 1, recommendation: 'Lead regional trade advocacy', resource: 'BSCS Trade Forum' },
      { priority: 2, recommendation: 'Mentor on trade readiness', resource: 'SCC Trade Mentorship' },
      { priority: 3, recommendation: 'Share regional market insights', resource: 'Regional Intelligence Sharing' }
    ]
  }
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validate assessment submission data
 * @param {Object} body - Request body
 * @returns {Object} Validation result
 */
const validateSubmission = (body) => {
  const { responses, sector, region, companySize } = body;

  // Check required fields
  if (!responses) {
    return { valid: false, error: 'Responses are required' };
  }

  if (typeof responses !== 'object') {
    return { valid: false, error: 'Responses must be an object' };
  }

  // Check question count
  const questionIds = Object.keys(responses);
  const validQuestionIds = questionIds.filter(id => QUESTION_PATTERN.test(id));

  if (validQuestionIds.length !== TOTAL_QUESTIONS) {
    return { 
      valid: false, 
      error: `Expected ${TOTAL_QUESTIONS} questions, received ${validQuestionIds.length}`
    };
  }

  // Check each response value
  for (const [id, score] of Object.entries(responses)) {
    if (!Number.isInteger(score) || score < 0 || score > 3) {
      return { 
        valid: false, 
        error: `Invalid score for question ${id}: must be integer 0-3` 
      };
    }
  }

  // Check metadata
  if (!sector) {
    return { valid: false, error: 'Sector is required' };
  }

  if (!region) {
    return { valid: false, error: 'Region is required' };
  }

  if (!companySize) {
    return { valid: false, error: 'Company size is required' };
  }

  return { valid: true };
};

/**
 * Generate recommendations based on dimension scores
 * @param {Object} scores - Dimension scores
 * @returns {Object} Recommendations by dimension
 */
const generateRecommendations = (scores) => {
  const recommendations = {};

  for (const [dimension, score] of Object.entries(scores)) {
    if (dimension === 'overall') continue;

    let category;
    if (score <= 40) category = 'critical';
    else if (score <= 59) category = 'gap';
    else if (score <= 79) category = 'good';
    else category = 'excellent';

    recommendations[dimension] = {
      score,
      category,
      items: RECOMMENDATIONS[dimension]?.[category] || []
    };
  }

  return recommendations;
};

/**
 * Generate a summary action plan with top priorities
 * @param {Object} recommendations - Recommendations by dimension
 * @param {Object} scores - Dimension scores
 * @returns {Array} Prioritized action items
 */
const generateActionPlan = (recommendations, scores) => {
  const actionPlan = [];

  for (const [dimension, data] of Object.entries(recommendations)) {
    const score = scores[dimension];
    const gapFactor = score <= 40 ? 3 : score <= 59 ? 2 : score <= 79 ? 1 : 0;

    for (const item of data.items) {
      const priorityScore = item.priority * gapFactor;
      actionPlan.push({
        dimension,
        score,
        priority: priorityScore,
        priorityLevel: priorityScore >= 20 ? 'Critical' : 
                      priorityScore >= 15 ? 'High' : 
                      priorityScore >= 10 ? 'Medium' : 'Low',
        ...item
      });
    }
  }

  // Sort by priority score (descending)
  actionPlan.sort((a, b) => b.priority - a.priority);

  // Return top 10 recommendations
  return actionPlan.slice(0, 10);
};

// ============================================================
// Controller Functions
// ============================================================

/**
 * Submit a new assessment
 * POST /api/assessment/submit
 */
const submitAssessment = async (req, res, next) => {
  try {
    console.log('📥 Submission received');
    console.log('📦 Request body keys:', Object.keys(req.body));
    console.log('📊 Responses received:', Object.keys(req.body.responses || {}).length);

    // Log the actual responses
    console.log('🔍 Full responses object:', JSON.stringify(req.body.responses));
    console.log('🔍 Responses type:', typeof req.body.responses);

    // Check if responses is an object with keys
    const responseKeys = Object.keys(req.body.responses || {});
    console.log('🔍 Response keys:', responseKeys);

    // If no responses, return early with clear error
    if (!req.body.responses || responseKeys.length === 0) {
      const error = new Error('No answers provided. Please complete all 25 questions.');
      error.statusCode = 400;
      return next(error);
    }

    // Count valid answers (values 0-3)
    let validCount = 0;
    for (const [key, value] of Object.entries(req.body.responses)) {
      if (value >= 0 && value <= 3) validCount++;
    }
    console.log('✅ Valid answers count:', validCount);

    // Validate the submission using the helper
    const validation = validateSubmission(req.body);
    console.log('🔍 Validation result:', validation);
    
    if (!validation.valid) {
      const error = new Error(validation.error);
      error.statusCode = 400;
      return next(error);
    }

    const { responses, sector, region, companySize, organizationName, contactEmail } = req.body;

    // Calculate scores using model static method
    const scores = Assessment.calculateScores(responses);
    console.log('📊 Calculated scores:', scores);
    
    const maturityLevel = Assessment.getMaturityLevel(scores.overall);
    console.log('🏷️ Maturity level:', maturityLevel);

    // Create assessment document
    const assessment = new Assessment({
      responses,
      scores,
      maturityLevel,
      sector,
      region,
      companySize,
      organizationName: organizationName || null,
      contactEmail: contactEmail || null,
      submittedAt: new Date()
    });

    // Save to database
    await assessment.save();
    console.log('✅ Assessment saved successfully, ID:', assessment._id);

    // Generate recommendations
    const recommendations = generateRecommendations(scores);
    const actionPlan = generateActionPlan(recommendations, scores);

    // Prepare response
    const response = {
      success: true,
      id: assessment._id.toString(),
      scores: assessment.scores,
      maturityLevel: assessment.maturityLevel,
      maturityDetails: assessment.getMaturityDetails(),
      gapAnalysis: assessment.getGapAnalysis(),
      recommendations,
      actionPlan,
      submittedAt: assessment.submittedAt,
      metadata: {
        sector,
        region,
        companySize
      }
    };

    res.status(201).json(response);

  } catch (error) {
    // Handle duplicate or validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      const err = new Error(`Validation error: ${errors.join(', ')}`);
      err.statusCode = 400;
      return next(err);
    }

    if (error.code === 11000) {
      const err = new Error('Duplicate submission detected');
      err.statusCode = 409;
      return next(err);
    }

    console.error('❌ Submission error:', error);
    next(error);
  }
};

/**
 * Get assessment results by ID
 * GET /api/assessment/result/:id
 */
const getAssessmentResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      const error = new Error('Invalid assessment ID');
      error.statusCode = 400;
      return next(error);
    }

    const assessment = await Assessment.findById(id);

    if (!assessment) {
      const error = new Error('Assessment not found');
      error.statusCode = 404;
      return next(error);
    }

    // Generate recommendations (same as submission)
    const recommendations = generateRecommendations(assessment.scores);
    const actionPlan = generateActionPlan(recommendations, assessment.scores);

    const response = {
      success: true,
      id: assessment._id.toString(),
      scores: assessment.scores,
      maturityLevel: assessment.maturityLevel,
      maturityDetails: assessment.getMaturityDetails(),
      gapAnalysis: assessment.getGapAnalysis(),
      recommendations,
      actionPlan,
      submittedAt: assessment.submittedAt,
      metadata: {
        sector: assessment.sector,
        region: assessment.region,
        companySize: assessment.companySize
      }
    };

    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
};

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  submitAssessment,
  getAssessmentResult,
  generateRecommendations,
  generateActionPlan,
  validateSubmission,
  RECOMMENDATIONS
};