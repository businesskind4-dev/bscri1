/**
 * BSCRI Assessment Model
 * Botswana Supply Chain Readiness Index
 * 
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 * 
 * This module defines the Mongoose schema and model for BSCRI assessment data.
 * It stores all 25 question responses, calculated scores, and respondent metadata.
 * 
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const mongoose = require('mongoose');

// ============================================================
// Constants
// ============================================================

const DIMENSIONS = {
  PROCUREMENT: 'procurement',
  LOGISTICS: 'logistics',
  COMPLIANCE: 'compliance',
  DIGITAL: 'digital',
  SUPPLIER: 'supplier',
  RESILIENCE: 'resilience',
  TRADE: 'trade'
};

const DIMENSION_QUESTIONS = {
  procurement: ['q1', 'q2', 'q3', 'q4'],
  logistics: ['q5', 'q6', 'q7', 'q8'],
  compliance: ['q9', 'q10', 'q11', 'q12'],
  digital: ['q13', 'q14', 'q15'],
  supplier: ['q16', 'q17', 'q18', 'q19'],
  resilience: ['q20', 'q21', 'q22'],
  trade: ['q23', 'q24', 'q25']
};

const DIMENSION_MAX_SCORES = {
  procurement: 12,
  logistics: 12,
  compliance: 12,
  digital: 9,
  supplier: 12,
  resilience: 9,
  trade: 9
};

const TOTAL_QUESTIONS = 25;
const MAX_RAW_SCORE = 75;

// ============================================================
// Validation Helpers
// ============================================================

const isValidSector = (value) => {
  const sectors = ['agriculture', 'mining', 'manufacturing', 'retail', 'services', 'government', 'nonprofit', 'other'];
  return sectors.includes(value);
};

const isValidRegion = (value) => {
  const regions = ['gaborone', 'francistown', 'maun', 'lobatse', 'selebi-phikwe', 'other'];
  return regions.includes(value);
};

const isValidCompanySize = (value) => {
  const sizes = ['micro', 'small', 'medium', 'large', 'enterprise'];
  return sizes.includes(value);
};

// ============================================================
// Schema Definition
// ============================================================

const AssessmentSchema = new mongoose.Schema({
  // ============================================================
  // Responses Section - FIXED
  // ============================================================
  
  responses: {
    type: Object,
    required: [true, 'Responses are required'],
    validate: {
      validator: function(responses) {
        if (!responses || typeof responses !== 'object') return false;
        const keys = Object.keys(responses);
        // Check that all 25 questions are present
        for (let i = 1; i <= 25; i++) {
          if (!keys.includes(`q${i}`)) return false;
        }
        // Check each value is 0-3
        for (const [key, value] of Object.entries(responses)) {
          if (value < 0 || value > 3 || !Number.isInteger(value)) return false;
        }
        return true;
      },
      message: `Exactly ${TOTAL_QUESTIONS} question responses with scores 0-3 are required`
    }
  },

  // ============================================================
  // Scores Section
  // ============================================================

  scores: {
    procurement: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    logistics: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    compliance: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    digital: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    supplier: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    resilience: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    trade: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    overall: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    }
  },

  // ============================================================
  // Maturity Level
  // ============================================================

  maturityLevel: {
    type: String,
    enum: ['foundational', 'emerging', 'developing', 'established', 'advanced'],
    required: true
  },

  // ============================================================
  // Respondent Metadata
  // ============================================================

  sector: {
    type: String,
    required: [true, 'Sector is required'],
    validate: {
      validator: isValidSector,
      message: 'Invalid sector value'
    }
  },

  region: {
    type: String,
    required: [true, 'Region is required'],
    validate: {
      validator: isValidRegion,
      message: 'Invalid region value'
    }
  },

  companySize: {
    type: String,
    required: [true, 'Company size is required'],
    validate: {
      validator: isValidCompanySize,
      message: 'Invalid company size value'
    }
  },

  // ============================================================
  // Optional Fields
  // ============================================================

  organizationName: {
    type: String,
    trim: true,
    maxlength: 100
  },

  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },

  // ============================================================
  // Timestamps
  // ============================================================

  submittedAt: {
    type: Date,
    default: Date.now,
    required: true
  }

}, {
  // Enable timestamps for automatic createdAt/updatedAt
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// ============================================================
// Indexes
// ============================================================

// For querying by date
AssessmentSchema.index({ submittedAt: -1 });

// For aggregating by sector
AssessmentSchema.index({ sector: 1 });

// For aggregating by region
AssessmentSchema.index({ region: 1 });

// For aggregating by company size
AssessmentSchema.index({ companySize: 1 });

// For overall score range queries
AssessmentSchema.index({ 'scores.overall': 1 });

// For maturity level filtering
AssessmentSchema.index({ maturityLevel: 1 });

// Compound index for sector + region analysis
AssessmentSchema.index({ sector: 1, region: 1 });

// ============================================================
// Static Methods
// ============================================================

/**
 * Calculate dimension scores from responses
 * @param {Object} responses - Map of question ID to score (0-3)
 * @returns {Object} Dimension scores
 */
AssessmentSchema.statics.calculateScores = function(responses) {
  const scores = {};
  let rawTotal = 0;
  let totalPossible = 0;

  // Calculate each dimension score
  for (const [dimension, questions] of Object.entries(DIMENSION_QUESTIONS)) {
    let dimensionSum = 0;
    const maxScore = DIMENSION_MAX_SCORES[dimension];

    // Sum scores for questions in this dimension
    for (const questionId of questions) {
      const score = responses[questionId] || 0;
      dimensionSum += score;
      rawTotal += score;
      totalPossible += 3; // Max per question is 3
    }

    // Calculate percentage
    scores[dimension] = Math.round((dimensionSum / maxScore) * 100);
  }

  // Calculate overall score
  scores.overall = Math.round((rawTotal / MAX_RAW_SCORE) * 100);

  return scores;
};

/**
 * Determine maturity level from overall score
 * @param {number} score - Overall score (0-100)
 * @returns {string} Maturity level
 */
AssessmentSchema.statics.getMaturityLevel = function(score) {
  if (score <= 40) return 'foundational';
  if (score <= 55) return 'emerging';
  if (score <= 70) return 'developing';
  if (score <= 85) return 'established';
  return 'advanced';
};

/**
 * Get recommendation priority for a dimension
 * @param {number} score - Dimension score (0-100)
 * @returns {Object} Priority level and factor
 */
AssessmentSchema.statics.getGapPriority = function(score) {
  if (score <= 40) {
    return { level: 'critical', factor: 3, action: 'urgent action required' };
  }
  if (score <= 59) {
    return { level: 'gap', factor: 2, action: 'action recommended' };
  }
  if (score <= 79) {
    return { level: 'minor', factor: 1, action: 'continuous improvement' };
  }
  return { level: 'none', factor: 0, action: 'maintain excellence' };
};

// ============================================================
// Instance Methods
// ============================================================

/**
 * Get the maturity level description for this assessment
 * @returns {Object} Maturity level details
 */
AssessmentSchema.methods.getMaturityDetails = function() {
  const levels = {
    foundational: {
      label: 'Foundational',
      description: 'Critical gaps exist. Urgent action is needed.',
      color: '#DC3545'
    },
    emerging: {
      label: 'Emerging',
      description: 'Gaps exist. Action is required to advance.',
      color: '#FD7E14'
    },
    developing: {
      label: 'Developing',
      description: 'On track but room for improvement exists.',
      color: '#FFC107'
    },
    established: {
      label: 'Established',
      description: 'Strong capability. Positioned for regional competition.',
      color: '#0D6EFD'
    },
    advanced: {
      label: 'Advanced',
      description: 'World-class capability. Ready for international competition.',
      color: '#198754'
    }
  };

  return levels[this.maturityLevel] || levels.foundational;
};

/**
 * Get gap analysis for all dimensions
 * @returns {Object} Gap analysis by dimension
 */
AssessmentSchema.methods.getGapAnalysis = function() {
  const analysis = {};

  for (const [dimension, score] of Object.entries(this.scores)) {
    if (dimension === 'overall') continue;
    const priority = this.constructor.getGapPriority(score);
    analysis[dimension] = {
      score,
      priority,
      questions: DIMENSION_QUESTIONS[dimension] || []
    };
  }

  return analysis;
};

// ============================================================
// Pre-Save Middleware
// ============================================================

AssessmentSchema.pre('save', function(next) {
  // Ensure scores are recalculated if responses changed
  if (this.isModified('responses')) {
    const scores = this.constructor.calculateScores(this.responses);
    this.scores = scores;
    this.maturityLevel = this.constructor.getMaturityLevel(scores.overall);
  }

  next();
});

// ============================================================
// ToJSON Transformation
// ============================================================

AssessmentSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Remove MongoDB internal fields
    delete ret.__v;
    delete ret._id;
    return ret;
  },
  virtuals: true
});

// ============================================================
// Virtuals
// ============================================================

AssessmentSchema.virtual('id').get(function() {
  return this._id.toString();
});

AssessmentSchema.virtual('maturityLabel').get(function() {
  return this.getMaturityDetails().label;
});

AssessmentSchema.virtual('maturityColor').get(function() {
  return this.getMaturityDetails().color;
});

// ============================================================
// Export Model
// ============================================================

const Assessment = mongoose.model('Assessment', AssessmentSchema);

module.exports = Assessment;