const { Resend } = require('resend');
const { neon } = require('@neondatabase/serverless');

const resend = new Resend('re_MBC7UZhh_4mZJYYuZ1WMPMd4mVaVwfhXo');
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

    const from = fromEmail || 'onboarding@resend.dev';
    
    // Email HTML template
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
    const batchEmails = signups.map(signup => ({
      from: from,
      to: [signup.email],
      subject: subject,
      html: getEmailHTML(signup.name)
    }));
    
    console.log(`📧 Sending batch emails to ${signups.length} recipients...`);

    try {
      console.log('📤 Attempting to send batch emails...');
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('Recipients:', signups.length);
      
      // Send using Resend batch API
      const result = await resend.batch.send(batchEmails);
      
      console.log('📨 Resend response:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.error('❌ Batch send error:', result.error);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to send emails',
          details: typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
        });
      }

      console.log('✅ Batch send successful!');
      console.log('Email IDs:', result.data?.data);
      
      res.status(200).json({ 
        success: true, 
        message: `Email sent successfully to ${signups.length} recipients!`,
        recipientCount: signups.length,
        emailIds: result.data?.data || result.data
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
