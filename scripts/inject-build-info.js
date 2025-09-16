#!/usr/bin/env node

/**
 * Script to inject build information into app.json
 * This script can be run as a prebuild step to add real build metadata
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Could not get git commit:', error.message);
    return 'unknown';
  }
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function injectBuildInfo() {
  const appJsonPath = path.join(__dirname, '../app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.error('app.json not found');
    process.exit(1);
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Get build profile from environment or default to 'unknown'
  const buildProfile = process.env.EXPO_PUBLIC_BUILD_PROFILE || 'unknown';
  const buildTime = getCurrentTimestamp();
  const gitCommit = getGitCommit();

  // Update build info in app.json
  if (!appJson.expo.extra) {
    appJson.expo.extra = {};
  }
  
  if (!appJson.expo.extra.buildInfo) {
    appJson.expo.extra.buildInfo = {};
  }

  appJson.expo.extra.buildInfo.buildTime = buildTime;
  appJson.expo.extra.buildInfo.gitCommit = gitCommit;
  appJson.expo.extra.buildInfo.buildProfile = buildProfile;

  // Write back to app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  console.log('✅ Build info injected:');
  console.log(`  Build Profile: ${buildProfile}`);
  console.log(`  Build Time: ${buildTime}`);
  console.log(`  Git Commit: ${gitCommit}`);
}

// Run if called directly
if (require.main === module) {
  injectBuildInfo();
}

module.exports = { injectBuildInfo };
