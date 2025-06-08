#!/usr/bin/env node

/**
 * Grocery Order App - Vercel Deployment Script (Node.js)
 * Cross-platform deployment script for Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch {
    log(`❌ Command failed: ${command}`, 'red');
    process.exit(1);
  }
}

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function deploy() {
  log('🚀 Starting deployment to Vercel...', 'green');

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ Not in the project root directory', 'red');
    process.exit(1);
  }

  // Check if Vercel CLI is installed
  if (!checkCommand('vercel')) {
    log('❌ Vercel CLI is not installed', 'red');
    log('Installing Vercel CLI...', 'yellow');
    exec('npm install -g vercel');
  }

  // Check environment variables
  log('📋 Checking environment variables...', 'yellow');
  const envLocal = path.join(process.cwd(), '.env.local');

  if (!process.env.MONGODB_URI && !fs.existsSync(envLocal)) {
    log('⚠️  MONGODB_URI not found in environment or .env.local', 'yellow');
    log('Make sure to set environment variables in Vercel dashboard:');
    log('- MONGODB_URI');
    log('- JWT_SECRET');
    log('- NEXT_PUBLIC_APP_URL');
  }

  // Clean previous builds
  log('🧹 Cleaning previous builds...', 'yellow');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
  }

  // Install dependencies
  log('📦 Installing dependencies...', 'yellow');
  exec('npm ci');

  // Run linting
  log('🔍 Running linter...', 'yellow');
  exec('npm run lint');

  // Build the application
  log('🏗️  Building application...', 'yellow');
  exec('npm run build');

  // Deploy to Vercel
  log('🚀 Deploying to Vercel...', 'yellow');

  const isProduction = process.argv.includes('--production') || process.argv.includes('-p');

  if (isProduction) {
    log('🌟 Deploying to PRODUCTION...', 'green');
    exec('vercel --prod');
  } else {
    log('🔄 Deploying to PREVIEW...', 'green');
    exec('vercel');
  }

  log('✅ Deployment completed successfully!', 'green');

  // Show deployment info
  log('📊 Deployment Information:', 'yellow');
  console.log('• Framework: Next.js');
  console.log(`• Node Version: ${process.version}`);
  console.log('• Build Command: npm run build');
  console.log('• Output Directory: .next');

  log('🎉 Your grocery ordering app is now live!', 'green');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});

// Run deployment
deploy().catch((error) => {
  log(`❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});