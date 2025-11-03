const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT id, name, email, ip, city, region, country, country_code, latitude, longitude, timezone, created_at
      FROM early_access_signups
      ORDER BY created_at DESC
    `;
    res.status(200).json(result);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to load signups' });
  }
};
