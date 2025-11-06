// services/resendService.js
import { Resend } from 'resend';

// Use environment variable - will work when you add real API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_hWZZGGae_77J9eBczAvXifrfocuwKdMEu');

export const sendBulkEmails = async (users, emailType, customData = {}) => {
  try {
    console.log(`Attempting to send ${emailType} emails to ${users.length} users`);
    
    // Check if we have a valid API key (not the placeholder)
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_hWZZGGae_77J9eBczAvXifrfocuwKdMEu') {
      throw new Error('Resend API key not configured. Please add your RESEND_API_KEY in environment variables.');
    }

    const emailPromises = users.map(user => {
      let emailConfig;

      if (emailType === 'launch') {
        emailConfig = getLaunchEmailConfig(user);
      } else if (emailType === 'custom') {
        emailConfig = getCustomEmailConfig(user, customData);
      }

      return resend.emails.send(emailConfig);
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Email sending completed: ${successful} successful, ${failed} failed`);
    
    return { 
      successful, 
      failed, 
      total: users.length,
      results 
    };
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Launch announcement template
const getLaunchEmailConfig = (user) => ({
  from: 'DrumLatch <onboarding@resend.dev>',
  to: user.email,
  subject: '🎉 DrumLatch is Now Live!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DrumLatch is Live! 🎉</h1>
      </div>
      <div class="content">
        <h2>Hi ${user.name || 'there'},</h2>
        <p>Great news! DrumLatch is now officially live and ready for you to use.</p>
        <p>You can now access all the features you signed up for and start creating amazing content.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://drumlatch.vercel.app" class="button">
            Get Started with DrumLatch
          </a>
        </div>
        
        <p>Thank you for your early interest and support. We're excited to see what you create!</p>
        
        <p><strong>The DrumLatch Team</strong></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>If you have any questions, just reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
});

// Custom message template
const getCustomEmailConfig = (user, customData) => ({
  from: 'DrumLatch <onboarding@resend.dev>',
  to: user.email,
  subject: customData.subject,
  html: `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white;">
        <h1>${customData.subject}</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hi ${user.name || 'there'},</h2>
        <div style="white-space: pre-line; line-height: 1.6;">
          ${customData.message.replace(/\n/g, '<br>')}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://drumlatch.vercel.app" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
             Visit DrumLatch
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>Best regards,<br><strong>The DrumLatch Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `
});