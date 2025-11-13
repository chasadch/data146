require('dotenv').config();
const { Resend } = require('resend');
const { neon } = require('@neondatabase/serverless');

// Use environment variables for production safety
const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.MAIL_FROM || 'updates@drumlatch.co';
const RESEND_TEST_MODE = (process.env.RESEND_TEST_MODE || 'false').toLowerCase() === 'true';

const sql = neon('postgresql://neondb_owner:npg_r8LO5uIJjWMK@ep-shiny-truth-a8ee4js3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

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
    // Basic validations
    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { subject, message, fromEmail } = req.body;

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

    // Helpers: basic validation and blocking of test domains
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isBlockedDomain = (email) => {
      const domain = String(email).split('@')[1]?.toLowerCase() || '';
      const blocked = [
        'example.com','example.org','example.net','test.com','test.org','test.net',
        'invalid','localhost','localdomain','mailinator.com','yopmail.com','tempmail.com'
      ];
      return blocked.includes(domain) || domain.endsWith('.test');
    };

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
    const getEmailHTML = (recipientName) => `
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

    try {
      console.log('📤 Attempting to send batch emails...');
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('Recipients:', toList.length);

      let sentCount = 0;
      const emailIds = [];

      for (const c of chunks) {
        const result = await resend.batch.send(makeBatchPayload(c));
        console.log('📨 Resend response:', JSON.stringify(result, null, 2));
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
        emailIds
      });
    } catch (error) {
      console.error('❌ Batch send exception:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to send batch emails',
        details: error.message || String(error)
      });
    }

  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ 
      error: 'Failed to send broadcast email',
      details: err.message 
    });
  }
};
