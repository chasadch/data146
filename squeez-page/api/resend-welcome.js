require('dotenv').config();
const { Resend } = require('resend');
const { neon } = require('@neondatabase/serverless');

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.MAIL_FROM || 'updates@drumlatch.co';
const RESEND_TEST_MODE = (process.env.RESEND_TEST_MODE || 'false').toLowerCase() === 'true';

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

module.exports = async (req, res) => {
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
    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not set, cannot resend welcome email');
      return res.status(500).json({ success: false, error: 'Email service not configured' });
    }

    const rows = await sql`SELECT name FROM early_access_signups WHERE email = ${email} LIMIT 1`;
    const dbName = rows[0]?.name;
    const displayName = name || dbName || 'there';

    const to = RESEND_TEST_MODE ? 'delivered@resend.dev' : email;
    const subject = 'Welcome to DrumLatch Early Access';
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to DrumLatch</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to DrumLatch, ${displayName}!</h1>
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

    console.log('📧 Resending welcome email via Resend to', to, 'for', email);

    let emailStatus = { sent: false, error: null };

    try {
      const emailResult = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject,
        html
      });
      console.log('✅ Resend welcome email result:', JSON.stringify(emailResult));
      emailStatus.sent = true;
    } catch (err) {
      console.error('❌ Resend welcome email error:', err);
      emailStatus.error = err.message || 'Failed to resend welcome email';
    }

    return res.status(emailStatus.sent ? 200 : 500).json({
      success: emailStatus.sent,
      emailStatus
    });
  } catch (err) {
    console.error('❌ Unexpected error in resend-welcome:', err);
    return res.status(500).json({ success: false, error: 'Unexpected server error' });
  }
};
