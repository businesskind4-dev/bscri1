/**
 * BSCRI Database Seed Script
 * Botswana Supply Chain Readiness Index
 *
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 *
 * Usage: node scripts/seed.js
 */

// ============================================================
// Dependencies
// ============================================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================================
// Model Imports
// ============================================================

const Assessment = require('../models/Assessment');

// ============================================================
// Sample Data
// ============================================================

const SECTORS = ['mining', 'manufacturing', 'retail', 'services', 'agriculture', 'government'];
const REGIONS = ['gaborone', 'francistown', 'maun', 'lobatse', 'selebi-phikwe', 'other'];
const COMPANY_SIZES = ['micro', 'small', 'medium', 'large', 'enterprise'];

function randomScore() {
  return Math.floor(Math.random() * 4);
}

function generateResponses() {
  const responses = {};
  for (let i = 1; i <= 25; i++) {
    responses[`q${i}`] = randomScore();
  }
  return responses;
}

function generateAssessment() {
  const responses = generateResponses();
  const scores = Assessment.calculateScores(responses);
  const maturityLevel = Assessment.getMaturityLevel(scores.overall);

  return {
    responses,
    scores,
    maturityLevel,
    sector: SECTORS[Math.floor(Math.random() * SECTORS.length)],
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    companySize: COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)],
    organizationName: `Sample Org ${Math.floor(Math.random() * 1000)}`,
    contactEmail: `sample${Math.floor(Math.random() * 1000)}@example.com`,
    submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  };
}

// ============================================================
// Seed Function
// ============================================================

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Assessment.deleteMany({});
    console.log('Cleared existing assessments');

    const sampleCount = 50;
    const assessments = [];

    for (let i = 0; i < sampleCount; i++) {
      assessments.push(generateAssessment());
    }

    await Assessment.insertMany(assessments);
    console.log(`Inserted ${sampleCount} sample assessments`);

    const total = await Assessment.countDocuments();
    const avgScore = await Assessment.aggregate([
      { $group: { _id: null, avg: { $avg: '$scores.overall' } } }
    ]);

    console.log('\n=== Seed Summary ===');
    console.log(`Total assessments: ${total}`);
    console.log(`Average score: ${avgScore.length > 0 ? Math.round(avgScore[0].avg) : 'N/A'}`);

    const bySector = await Assessment.aggregate([
      { $group: { _id: '$sector', count: { $sum: 1 } } }
    ]);
    console.log('\nBreakdown by sector:');
    bySector.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

seedDatabase();