#!/usr/bin/env node

/**
 * Quick script to check if test mode is properly configured
 */

require('dotenv').config();
const { env } = require('./src/config/env');

console.log('🔍 Test Mode Diagnostic\n');
console.log('Environment Variables:');
console.log('  TEST_MODE:', process.env.TEST_MODE);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('');
console.log('Config Values:');
console.log('  env.testMode:', env.testMode);
console.log('  env.testUserId:', env.testUserId);
console.log('  env.testUserEmail:', env.testUserEmail);
console.log('');

if (env.testMode) {
  console.log('✅ Test mode is ACTIVE');
  console.log('');
  console.log('You can use these tokens:');
  console.log('  - test-token');
  console.log('  - test');
  console.log('  - (no token at all)');
  console.log('');
  console.log('⚠️  Make sure your server is restarted!');
  console.log('   Run: yarn dev');
} else {
  console.log('❌ Test mode is NOT ACTIVE');
  console.log('');
  console.log('To enable:');
  console.log('  1. Add TEST_MODE=true to .env file');
  console.log('  2. Restart your server');
  console.log('');
  console.log('Or set it when starting:');
  console.log('  TEST_MODE=true yarn dev');
}

