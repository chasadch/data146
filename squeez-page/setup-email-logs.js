const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

async function setupEmailLogs() {
  console.log('🔧 Setting up email logs table...');
  
  try {
    // Create email_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        email_type VARCHAR(50) NOT NULL,
        subject TEXT,
        status VARCHAR(20) NOT NULL,
        resend_email_id TEXT,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ email_logs table created successfully');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status)`;
    console.log('✅ Indexes created successfully');

    // Check if table has data
    const result = await sql`SELECT COUNT(*) as count FROM email_logs`;
    console.log(`📊 Current email logs in database: ${result[0].count}`);

    console.log('\n✨ Email logs setup complete!');
  } catch (error) {
    console.error('❌ Error setting up email logs:', error);
    process.exit(1);
  }
}

setupEmailLogs();

