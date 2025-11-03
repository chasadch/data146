# Vercel Deployment Guide

## Automatic Deployment

Vercel will automatically detect and deploy your React app when you push to GitHub.

### Configuration

The `vercel.json` file is configured to:
- Build the React app from the `react-app` folder
- Deploy serverless API functions from the `api` folder
- Serve the built React app as static files
- Handle SPA routing (all routes go to index.html)

## Deployment Steps

1. **Push to GitHub** (Already done!)
   ```bash
   git push origin main
   ```

2. **Vercel will automatically**:
   - Detect the changes
   - Run `cd react-app && npm install && npm run build`
   - Deploy the built files from `react-app/dist`
   - Deploy API functions from `/api`

3. **Wait for deployment** (usually 1-2 minutes)

4. **Access your app**:
   - Frontend: `https://data12-nu.vercel.app`
   - Admin: `https://data12-nu.vercel.app/admin`
   - API: `https://data12-nu.vercel.app/api/signup`

## What Changed

### ✅ Removed
- Old HTML files (index.html, admin.html)
- Old JavaScript files (app.js, admin.js, etc.)
- Old CSS file (style.css)

### ✅ Added
- React app in `/react-app` folder
- Vite build configuration
- React Router for SPA navigation
- Updated API service for production/development

### ✅ Updated
- `vercel.json` - Now builds and deploys React app
- `.vercelignore` - Ignores unnecessary files
- `README.md` - Updated documentation
- `.gitignore` - Excludes node_modules and build files

## Troubleshooting

### If deployment fails:

1. Check Vercel deployment logs
2. Verify build command works locally:
   ```bash
   cd react-app
   npm install
   npm run build
   ```
3. Check that all dependencies are in `package.json`

### If API endpoints don't work:

1. Verify serverless functions in `/api` folder
2. Check that `vercel.json` rewrites are correct
3. Test API endpoints directly: `https://your-app.vercel.app/api/signup`

## Environment Variables

For production security, consider moving the Neon database connection string to Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `DATABASE_URL` = `your-neon-connection-string`
3. Update `/api/signup.js` and `/api/signups.js` to use `process.env.DATABASE_URL`

## Local vs Production

- **Local**: Uses `http://localhost:3001/api` for backend
- **Production**: Uses `https://data12-nu.vercel.app/api` for backend

This is automatically handled by the API service based on `import.meta.env.PROD`.
