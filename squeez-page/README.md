# DrumLatch React App

React version of the DrumLatch early access signup application.

## Features

- **Landing Page**: Early access signup form with IP-based location tracking
- **Automatic Welcome Emails**: Sends promotional welcome email immediately after signup using Resend API
- **Email Resend**: Users can resend welcome emails if delivery fails
- **Email Event Logging**: All email events tracked in database with status and error details
- **Admin Dashboard**: Login-protected dashboard to view and manage signups
- **Email Logs Dashboard**: View all email events, statuses, and delivery tracking
- **CSV Export**: Export signup data to CSV
- **Search & Filter**: Search signups by name or email
- **Stats**: View total signups, today's signups, and this week's signups

## Tech Stack

- React 18
- React Router for navigation
- Vite for development and building
- Axios for API calls
- Tailwind CSS for styling
- Neon PostgreSQL backend

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will run at `http://localhost:3000`

3. **Start the backend server**:
   In a separate terminal, go to the parent directory and run:
   ```bash
   cd ..
   node server.js
   ```

   The backend will run at `http://localhost:3001`

## Environment

The app automatically detects whether it's running in development or production:
- **Development**: Uses local API at `/api` (proxied to `http://localhost:3001`)
- **Production**: Uses deployed API at `https://data12-nu.vercel.app/api`

## Admin Access

- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@drumlatch.com`
- **Password**: `admin123`

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## Project Structure

```
react-app/
├── public/
│   └── image/              # Logo and background images
├── src/
│   ├── pages/
│   │   ├── Landing.jsx     # Main signup page
│   │   └── Admin.jsx       # Admin dashboard
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── App.jsx             # Main app with routing
│   ├── App.css             # Styles
│   └── main.jsx            # Entry point
├── index.html              # HTML template
├── package.json
└── vite.config.js          # Vite configuration
```

## API Endpoints

- `POST /api/signup` - Submit early access signup (automatically sends welcome email)
- `POST /api/resend-welcome` - Resend welcome email to a user
- `GET /api/signups` - Get all signups (admin)
- `GET /api/email-logs` - Get email event logs (admin)
- `POST /api/send-broadcast` - Send broadcast email to all signups (admin)

## Email Features

See [EMAIL_FEATURES.md](./EMAIL_FEATURES.md) for detailed documentation on:
- Automatic welcome email system
- Email resend functionality
- Email event logging and tracking
- Admin email logs dashboard
- Configuration and setup
- Testing procedures
