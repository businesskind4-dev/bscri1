/**
 * BSCRI Password Utilities
 * Botswana Supply Chain Readiness Index
 *
 * Copyright © 2026 Supply Chain Circle (SCC)
 * All rights reserved.
 *
 * This module provides bcrypt password hashing and verification utilities
 * for admin authentication.
 *
 * @version 1.0.0
 * @author Supply Chain Circle (SCC)
 */

// ============================================================
// Dependencies
// ============================================================

const bcrypt = require('bcrypt');

// ============================================================
// Constants
// ============================================================

const SALT_ROUNDS = 10;

// ============================================================
// Functions
// ============================================================

/**
 * Hash a plaintext password
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password is required');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a plaintext password against a hash
 * @param {string} password - Plaintext password to check
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches hash
 */
const verifyPassword = async (password, hash) => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
};

/**
 * Check if a string is a valid bcrypt hash
 * @param {string} hash - String to check
 * @returns {boolean} True if valid bcrypt hash
 */
const isValidHash = (hash) => {
  if (!hash) return false;
  return hash.startsWith('$2b$') || hash.startsWith('$2a$');
};

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  hashPassword,
  verifyPassword,
  isValidHash,
  SALT_ROUNDS
};