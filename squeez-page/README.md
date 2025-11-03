# DrumLatch - Early Access Signup

React-based early access signup application with Neon PostgreSQL backend and IP-based geolocation.

## Project Structure

- **`/react-app/`** - React frontend application (Vite)
- **`/api/`** - Vercel serverless API functions
- **`/image/`** - Static images and logos
- **`server.js`** - Local development backend server

## Features

- ✅ React 18 with Vite
- ✅ Landing page with early access signup form
- ✅ Admin dashboard with authentication
- ✅ IP-based geolocation tracking
- ✅ Neon PostgreSQL database
- ✅ CSV export functionality
- ✅ Search and filter signups
- ✅ Responsive design with Tailwind CSS

## Local Development

### Backend Server

```bash
node server.js
```

Runs on http://localhost:3001

### React App

```bash
cd react-app
npm install
npm run dev
```

Runs on http://localhost:3000

## Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Vercel will automatically:
   - Build the React app
   - Deploy serverless API functions
   - Serve the static frontend

## Admin Access

- **URL**: `/admin`
- **Email**: `admin@drumlatch.com`
- **Password**: `admin123`

## Environment Variables

The Neon database connection string is hardcoded in the API files. For production, move it to environment variables.

## Tech Stack

- **Frontend**: React 18, React Router, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Neon PostgreSQL
- **Deployment**: Vercel (Serverless Functions + Static Hosting)
- **Geolocation**: ip-api.com, geojs.io, ipapi.co
