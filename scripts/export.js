/**
 * BSCRI Data Export Script
 * Botswana Supply Chain Readiness Index
 *
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 *
 * This script exports all assessment data to a JSON file
 * for offline analysis or backup.
 *
 * Usage: node scripts/export.js
 *
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================================
// Model Imports
// ============================================================

const Assessment = require('../models/Assessment');

// ============================================================
// Export Function
// ============================================================

async function exportData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fetch all assessments
    const assessments = await Assessment.find()
      .sort({ submittedAt: -1 })
      .lean();

    console.log(`Found ${assessments.length} assessments`);

    // Format data
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
      updatedAt: doc.updatedAt,
      responses: doc.responses
    }));

    // Create export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      count: data.length,
      data
    };

    // Write to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bscri_export_${timestamp}.json`;
    const filePath = path.join(__dirname, '../exports', filename);

    // Ensure exports directory exists
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(`Export saved to: ${filePath}`);
    console.log(`Total records: ${data.length}`);

    // Show summary statistics
    const avgOverall = data.reduce((sum, d) => sum + (d.scores?.overall || 0), 0) / data.length;
    console.log(`\n=== Export Summary ===`);
    console.log(`Average overall score: ${Math.round(avgOverall)}%`);

    const bySector = {};
    data.forEach(d => {
      const sector = d.sector || 'unknown';
      bySector[sector] = (bySector[sector] || 0) + 1;
    });
    console.log('\nBreakdown by sector:');
    Object.entries(bySector).forEach(([sector, count]) => {
      console.log(`  ${sector}: ${count}`);
    });

  } catch (error) {
    console.error('Export failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// ============================================================
// Run Export
// ============================================================

exportData();
