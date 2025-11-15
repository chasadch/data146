-- Email Event Logging Table
-- Run this in your Neon PostgreSQL console to add email tracking

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  email_type VARCHAR(50) NOT NULL, -- 'welcome', 'broadcast', 'resend_welcome'
  subject TEXT,
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'queued'
  resend_email_id TEXT, -- ID returned by Resend API
  error_message TEXT,
  metadata JSONB, -- Additional data like IP, user agent, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

