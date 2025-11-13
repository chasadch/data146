require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;

// Neon database connection
const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

// Resend email service (env-driven)
const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.MAIL_FROM || 'updates@drumlatch.co';
const RESEND_TEST_MODE = (process.env.RESEND_TEST_MODE || 'false').toLowerCase() === 'true';

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Create table if it doesn't exist
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS early_access_signups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        ip TEXT,
        city TEXT,
        region TEXT,
        country TEXT,
        country_code TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        timezone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}

// Geolocation helper (server-side) with multiple fallbacks
async function fetchGeoData(clientIP) {
  const withTimeout = (promise, ms = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
  };

  // API 1: ip-api.com (no auth required, generous limits)
  if (!clientIP || clientIP === 'auto-detect') {
    // For localhost, get server's public IP first
    try {
      console.log('🔍 Getting public IP from api.ipify.org...');
      const ipRes = await withTimeout(fetch('https://api.ipify.org?format=json'));
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        clientIP = ipData.ip;
        console.log('✅ Public IP detected:', clientIP);
      }
    } catch (err) {
      console.log('⚠️ Could not detect public IP:', err.message);
      return null;
    }
  }

  // Try ip-api.com (free, no key, 45 req/min)
  try {
    const url = `http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query`;
    console.log('🔗 Fetching from ip-api.com:', url);
    const res = await withTimeout(fetch(url));
    console.log('📡 Response status:', res.status);
    if (res.ok) {
      const j = await res.json();
      console.log('📦 Raw API response:', j);
      if (j.status === 'success') {
        return {
          ip: j.query,
          city: j.city,
          region: j.regionName,
          country: j.country,
          country_code: j.countryCode,
          latitude: j.lat,
          longitude: j.lon,
          timezone: j.timezone
        };
      }
    }
  } catch (err) {
    console.error('❌ ip-api.com error:', err.message);
  }

  // Fallback 2: geojs.io
  try {
    const url = `https://get.geojs.io/v1/ip/geo/${clientIP}.json`;
    console.log('🔗 Fallback: geojs.io:', url);
    const res = await withTimeout(fetch(url));
    if (res.ok) {
      const j = await res.json();
      console.log('📦 geojs.io response:', j);
      return {
        ip: j.ip,
        city: j.city,
        region: j.region,
        country: j.country,
        country_code: j.country_code,
        latitude: parseFloat(j.latitude),
        longitude: parseFloat(j.longitude),
        timezone: j.timezone
      };
    }
  } catch (err) {
    console.error('❌ geojs.io error:', err.message);
  }

  // Fallback 3: ipapi.co (sometimes rate-limited)
  try {
    const url = `https://ipapi.co/${clientIP}/json/`;
    console.log('🔗 Final fallback: ipapi.co:', url);
    const res = await withTimeout(fetch(url));
    if (res.ok) {
      const j = await res.json();
      if (!j.error) {
        console.log('📦 ipapi.co response:', j);
        return {
          ip: j.ip,
          city: j.city,
          region: j.region,
          country: j.country_name || j.country,
          country_code: j.country_code,
          latitude: typeof j.latitude === 'number' ? j.latitude : parseFloat(j.latitude),
          longitude: typeof j.longitude === 'number' ? j.longitude : parseFloat(j.longitude),
          timezone: j.timezone
        };
      }
    }
  } catch (err) {
    console.error('❌ ipapi.co error:', err.message);
  }

  console.log('❌ All geo APIs failed');
  return null;
}

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Get client IP
    let clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;
    console.log('📍 Original client IP:', clientIP);
    
    // For local testing: detect public IP
    if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP?.startsWith('::ffff:127.')) {
      clientIP = 'auto-detect';
      console.log('🔄 Localhost detected, will auto-detect public IP');
    }
    
    // Fetch geo data
    let geo = null;
    try {
      console.log('🌍 Fetching geo for IP:', clientIP);
      geo = await fetchGeoData(clientIP);
      if (geo) {
        console.log('✅ Geo data received:', geo);
      } else {
        console.log('⚠️ No geo data returned');
      }
    } catch (err) {
      console.error('❌ Geo fetch error:', err);
    }

    // Insert or update (upsert)
    const result = await sql`
      INSERT INTO early_access_signups (
        name, email, ip, city, region, country, country_code, latitude, longitude, timezone, created_at
      ) VALUES (
        ${name}, 
        ${email}, 
        ${geo?.ip || clientIP || null}, 
        ${geo?.city || null}, 
        ${geo?.region || null}, 
        ${geo?.country || null}, 
        ${geo?.country_code || null}, 
        ${geo?.latitude || null}, 
        ${geo?.longitude || null}, 
        ${geo?.timezone || null},
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        ip = COALESCE(EXCLUDED.ip, early_access_signups.ip),
        city = COALESCE(EXCLUDED.city, early_access_signups.city),
        region = COALESCE(EXCLUDED.region, early_access_signups.region),
        country = COALESCE(EXCLUDED.country, early_access_signups.country),
        country_code = COALESCE(EXCLUDED.country_code, early_access_signups.country_code),
        latitude = COALESCE(EXCLUDED.latitude, early_access_signups.latitude),
        longitude = COALESCE(EXCLUDED.longitude, early_access_signups.longitude),
        timezone = COALESCE(EXCLUDED.timezone, early_access_signups.timezone)
      RETURNING *
    `;

    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/signups - List all signups (for admin)
app.get('/api/signups', async (req, res) => {
  try {
    const result = await sql`
      SELECT id, name, email, ip, city, region, country, country_code, latitude, longitude, timezone, created_at
      FROM early_access_signups
      ORDER BY created_at DESC
    `;
    res.json(result);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to load signups' });
  }
});

// POST /api/send-broadcast - Send email to all signups
app.post('/api/send-broadcast', async (req, res) => {
  try {
    const { subject, message, fromEmail } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Get all signups from database
    const signups = await sql`
      SELECT email, name FROM early_access_signups
      ORDER BY created_at DESC
    `;

    if (signups.length === 0) {
      return res.status(400).json({ error: 'No signups found' });
    }

    const from = fromEmail || DEFAULT_FROM;

    // Helpers: basic validation and filtering of test/disposable domains
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isBlockedDomain = (email) => {
      const domain = String(email).split('@')[1]?.toLowerCase() || '';
      const blocked = [
        'example.com','example.org','example.net','test.com','test.org','test.net',
        'invalid','localhost','localdomain','mailinator.com','yopmail.com','tempmail.com'
      ];
      return blocked.includes(domain) || domain.endsWith('.test');
    };

    // Build unique, valid recipient list
    const unique = new Set();
    const validRecipients = signups
      .map((s) => s.email)
      .filter((e) => !!e)
      .filter((e) => isValidEmail(e))
      .filter((e) => !isBlockedDomain(e))
      .filter((e) => (unique.has(e) ? false : (unique.add(e), true)));

    if (validRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients to send' });
    }

    const toList = RESEND_TEST_MODE ? validRecipients.map(() => 'delivered@resend.dev') : validRecipients;
    
    // Email HTML template function
    const getEmailHTML = (recipientName) =>
 `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #f0f0f0;
          }
          .content {
            padding: 30px 0;
          }
          .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 2px solid #f0f0f0;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>DrumLatch</h2>
        </div>
        <div class="content">
          ${message}
        </div>
        <div class="footer">
          <p>© 2025 Quotaquom LLC. All rights reserved.</p>
          <p>You're receiving this because you signed up for DrumLatch early access.</p>
        </div>
      </body>
      </html>
    `;

    // Prepare batch emails - Resend supports up to 100 emails per batch
    const makeBatchPayload = (chunk) => chunk.map((email, idx) => ({
      from: from,
      to: [email],
      subject: subject,
      html: getEmailHTML(`Recipient ${idx + 1}`)
    }));

    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < toList.length; i += chunkSize) {
      chunks.push(toList.slice(i, i + chunkSize));
    }

    console.log(`📧 Sending batch emails to ${toList.length} valid recipients... (chunks: ${chunks.length})`);

    const emailIds = [];
    let sentCount = 0;

    try {
      for (const c of chunks) {
        const payload = makeBatchPayload(c);
        const result = await resend.batch.send(payload);
        if (result.error) {
          console.error('❌ Batch send error:', result.error);
          return res.status(500).json({
            success: false,
            error: 'Failed to send emails',
            details: typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          });
        }
        const ids = result.data?.data || result.data || [];
        emailIds.push(...ids);
        sentCount += c.length;
      }

      console.log('✅ Batch send successful!');
      res.status(200).json({
        success: true,
        message: `Email sent successfully to ${sentCount} recipients!`,
        recipientCount: sentCount,
        skipped: signups.length - validRecipients.length,
        emailIds
      });
    } catch (error) {
      console.error('❌ Batch send exception:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send batch emails',
        details: error.message
      });
    }

  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ 
      error: 'Failed to send broadcast email',
      details: err.message 
    });
  }
});

// Initialize DB and start server (or export for Vercel)
if (process.env.VERCEL) {
  // Vercel serverless mode - export app
  initDB();
  module.exports = app;
} else {
  // Local development mode - start server
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  });
}
