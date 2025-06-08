#!/bin/bash

# Grocery Order App - Vercel Deployment Script
set -e

echo "🚀 Starting deployment to Vercel..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in the project root directory${NC}"
    exit 1
fi

# Check environment variables
echo -e "${YELLOW}📋 Checking environment variables...${NC}"

if [ -z "$MONGODB_URI" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  MONGODB_URI not found in environment or .env.local${NC}"
    echo "Make sure to set environment variables in Vercel dashboard:"
    echo "- MONGODB_URI"
    echo "- JWT_SECRET"
    echo "- NEXT_PUBLIC_APP_URL"
fi

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Deploy to Vercel
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"

if [ "$1" == "--production" ] || [ "$1" == "-p" ]; then
    echo -e "${GREEN}🌟 Deploying to PRODUCTION...${NC}"
    vercel --prod
else
    echo -e "${GREEN}🔄 Deploying to PREVIEW...${NC}"
    vercel
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Show deployment info
echo -e "${YELLOW}📊 Deployment Information:${NC}"
echo "• Framework: Next.js"
echo "• Node Version: $(node --version)"
echo "• Build Command: npm run build"
echo "• Output Directory: .next"

echo -e "${GREEN}🎉 Your grocery ordering app is now live!${NC}"