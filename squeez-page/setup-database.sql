-- DrumLatch Database Setup
-- Run this in your Neon PostgreSQL console

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
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email ON early_access_signups(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_created_at ON early_access_signups(created_at DESC);
