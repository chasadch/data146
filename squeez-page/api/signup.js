const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = 'updates@drumlatch.co'; // Your verified domain
const RESEND_TEST_MODE = (process.env.RESEND_TEST_MODE || 'false').toLowerCase() === 'true';

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

// Helper function to log email events - with error handling
async function logEmailEvent(email, recipientName, emailType, subject, status, resendEmailId = null, errorMessage = null, metadata = {}) {
  try {
    // Check if email_logs table exists, if not, skip logging
    await sql`
      INSERT INTO email_logs (
        email, recipient_name, email_type, subject, status, resend_email_id, error_message, metadata, created_at
      ) VALUES (
        ${email},
        ${recipientName},
        ${emailType},
        ${subject},
        ${status},
        ${resendEmailId},
        ${errorMessage},
        ${JSON.stringify(metadata)},
        NOW()
      )
    `;
    console.log(`📝 Email event logged: ${emailType} to ${email} - ${status}`);
  } catch (err) {
    // Silently fail if table doesn't exist - don't break signup
    console.log('⚠️ Email logging skipped (table may not exist):', err.message);
  }
}

// Geolocation helper
async function fetchGeoData(clientIP) {
  const withTimeout = (promise, ms = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
  };

  if (!clientIP || clientIP === 'auto-detect') {
    try {
      const ipRes = await withTimeout(fetch('https://api.ipify.org?format=json'));
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        clientIP = ipData.ip;
      }
    } catch (err) {
      return null;
    }
  }

  // Try ip-api.com
  try {
    const url = `http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query`;
    const res = await withTimeout(fetch(url));
    if (res.ok) {
      const j = await res.json();
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
  } catch (err) { /* noop */ }

  return null;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Get client IP
    let clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || null;

    if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP?.startsWith('::ffff:127.')) {
      clientIP = 'auto-detect';
    }

    // Fetch geo data
    let geo = null;
    try {
      geo = await fetchGeoData(clientIP);
    } catch (err) { /* noop */ }

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
    const saved = result[0];
    let emailStatus = { sent: false, error: null };

    // Send welcome email automatically
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'undefined' && process.env.RESEND_API_KEY.length > 10) {
      try {
        const to = RESEND_TEST_MODE ? 'delivered@resend.dev' : email;
        const subject = 'Welcome to DrumLatch Early Access';
        const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to DrumLatch</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to DrumLatch, ${name}!</h1>
    <p>Thanks for joining the DrumLatch early access list. You're now on the list to receive updates about:</p>
    <ul>
      <li>Private beta invitations</li>
      <li>New feature drops</li>
      <li>Launch announcements and promos</li>
    </ul>
    <p>We'll reach out soon with more details about how DrumLatch can help you share secure, QR-powered access.</p>
    <p style="margin-top: 24px;">– DrumLatch Team</p>
  </body>
</html>`;

        console.log('📧 Sending welcome email via Resend to', to);
        const emailResult = await resend.emails.send({
          from: DEFAULT_FROM,
          to,
          subject,
          html
        });

        console.log('✅ Welcome email sent result:', JSON.stringify(emailResult));
        
        if (emailResult.error) {
          emailStatus.sent = false;
          emailStatus.error = emailResult.error.message || 'Failed to send welcome email';
          await logEmailEvent(email, name, 'welcome', subject, 'failed', null, emailStatus.error, { ip: geo?.ip || clientIP });
        } else {
          emailStatus.sent = true;
          await logEmailEvent(email, name, 'welcome', subject, 'sent', emailResult.data?.id, null, { ip: geo?.ip || clientIP });
        }
      } catch (emailErr) {
        console.error('❌ Promotional email send error:', emailErr);
        emailStatus.error = emailErr.message || 'Failed to send welcome email';
        await logEmailEvent(email, name, 'welcome', 'Welcome to DrumLatch Early Access', 'failed', null, emailStatus.error, { ip: geo?.ip || clientIP });
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not set or invalid, skipping welcome email send');
      emailStatus.error = 'API key is invalid - Please update your Resend API key';
      await logEmailEvent(email, name, 'welcome', 'Welcome to DrumLatch Early Access', 'failed', null, 'API key is invalid', { ip: geo?.ip || clientIP });
    }

    res.status(200).json({ success: true, data: saved, emailStatus });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
