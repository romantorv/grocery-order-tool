# Grocery Order App - Vercel Deployment Guide

This guide covers deploying your grocery ordering application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up your database at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Node.js**: Version 18+ installed locally
4. **Git**: Your project should be in a Git repository

## Quick Deploy

### Option 1: Using Automated Scripts

```bash
# Deploy to preview environment
npm run deploy

# Deploy to production
npm run deploy:prod

# Using bash script (Unix/macOS/Linux)
npm run deploy:bash
npm run deploy:bash:prod
```

### Option 2: Manual Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Build and deploy to preview
npm run build
vercel

# Deploy to production
vercel --prod
```

### Option 3: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/grocery-orders` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-here` |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | `https://your-app.vercel.app` |

### Setting Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the appropriate value
5. Set the environment (Production, Preview, Development)

## MongoDB Setup

### 1. Create MongoDB Atlas Cluster

1. Sign up/login to [MongoDB Atlas](https://mongodb.com/atlas)
2. Create a new cluster (free tier is sufficient)
3. Create a database user with read/write permissions
4. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)

### 2. Get Connection String

1. In Atlas, click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with your database name (e.g., `grocery-orders`)

### 3. Initialize Database

After deployment, initialize your database:

```bash
# Set your environment variables locally
export MONGODB_URI="your-mongodb-connection-string"
export JWT_SECRET="your-jwt-secret"

# Run the database initialization
npm run init-db
```

## Deployment Configuration

### vercel.json

The project includes a `vercel.json` configuration file with:

- **Framework Detection**: Automatically detected as Next.js
- **Build Settings**: Optimized for Next.js builds
- **Function Timeout**: 30 seconds for API routes
- **Environment Variables**: Properly configured for build and runtime

### Build Configuration

- **Framework**: Next.js 15.3.3
- **Node Version**: 18+ (automatically detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Deployment Process

### Automated Script Process

The deployment scripts (`scripts/deploy.sh` and `scripts/deploy.mjs`) perform:

1. ✅ **Environment Check**: Verify Vercel CLI installation
2. 🧹 **Cleanup**: Remove previous builds and cache
3. 📦 **Dependencies**: Install production dependencies
4. 🔍 **Linting**: Run ESLint checks
5. 🏗️ **Build**: Create production build
6. 🚀 **Deploy**: Deploy to Vercel (preview or production)

### Manual Process

```bash
# 1. Clean previous builds
rm -rf .next node_modules/.cache

# 2. Install dependencies
npm ci

# 3. Run linting
npm run lint

# 4. Build application
npm run build

# 5. Deploy
vercel --prod  # for production
# or
vercel         # for preview
```

## Domain Configuration

### Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS records as instructed
5. Update `NEXT_PUBLIC_APP_URL` environment variable

## Monitoring and Logs

### Vercel Dashboard

- **Functions**: Monitor API route performance
- **Analytics**: Track usage and performance
- **Logs**: View real-time deployment and runtime logs

### Health Check

After deployment, verify these endpoints:

- `GET /api/items` - Should return 200 with items array
- `POST /api/auth/access` - Authentication endpoint
- `GET /admin` - Admin interface (requires authentication)

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run lint --fix
npm run build  # Test locally first
```

#### Environment Variables Not Loading

1. Verify variables are set in Vercel dashboard
2. Check variable names match exactly
3. Redeploy after adding variables

#### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist
2. Check connection string format
3. Test connection locally first:

```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
"
```

#### API Routes Not Working

1. Check function logs in Vercel dashboard
2. Verify API routes in `src/app/api/` directory
3. Check for CORS issues with frontend requests

### Performance Optimization

1. **Enable Edge Functions**: For better global performance
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Configure appropriate cache headers
4. **Bundle Analysis**: Use `@next/bundle-analyzer`

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **JWT Secret**: Use a strong, random secret key
3. **MongoDB**: Use strong passwords and IP restrictions
4. **HTTPS**: Always use HTTPS in production (Vercel provides this)

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run deploy` | Deploy to preview environment |
| `npm run deploy:prod` | Deploy to production |
| `npm run deploy:preview` | Deploy to preview (same as deploy) |
| `npm run deploy:bash` | Use bash deployment script |
| `npm run deploy:bash:prod` | Use bash script for production |

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

🎉 **Your grocery ordering app is ready for production!**