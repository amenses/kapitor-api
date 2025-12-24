/**
 * Configuration barrel export
 */
const { connectDatabase, disconnectDatabase } = require('./database');
const { initializeFirebase, getAdmin } = require('./firebase');
const { config: digilockerConfig, validateConfig: validateDigilocker, isConfigured: isDigilockerConfigured } = require('./digilocker');
const { env, validateEnv } = require('./env');

module.exports = {
  // Database
  connectDatabase,
  disconnectDatabase,
  // Firebase
  initializeFirebase,
  getAdmin,
  // DigiLocker
  digilockerConfig,
  validateDigilocker,
  isDigilockerConfigured,
  // Environment
  env,
  validateEnv,
};

