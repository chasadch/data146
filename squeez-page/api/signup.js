const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

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

    res.status(200).json({ success: true, data: result[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
