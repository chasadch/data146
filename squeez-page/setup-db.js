const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

async function setupDatabase() {
  console.log('🔧 Setting up database...');
  
  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS early_access_signups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        demo_request BOOLEAN DEFAULT FALSE,
        ip VARCHAR(50),
        city VARCHAR(100),
        region VARCHAR(100),
        country VARCHAR(100),
        country_code VARCHAR(10),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timezone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table created successfully');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_email ON early_access_signups(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON early_access_signups(created_at DESC)`;
    console.log('✅ Indexes created successfully');

    // Check if table has data
    const result = await sql`SELECT COUNT(*) as count FROM early_access_signups`;
    console.log(`📊 Current signups in database: ${result[0].count}`);

    console.log('\n✨ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
