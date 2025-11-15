const { Resend } = require('resend');

const resend = new Resend('re_b2VX1mTE_EM6xnHfG6YDeAR7nqEucX7qL');

async function testResend() {
  console.log('🧪 Testing Resend API...\n');
  
  try {
    console.log('1️⃣ Testing single email send...');
    const singleResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['asadarshadf21@nutech.edu.pk'],
      subject: 'Test Email',
      html: '<p>This is a test email</p>'
    });
    
    console.log('✅ Single email result:', JSON.stringify(singleResult, null, 2));
    
    console.log('\n2️⃣ Testing batch send...');
    const batchResult = await resend.batch.send([
      {
        from: 'onboarding@resend.dev',
        to: ['asadarshadf21@nutech.edu.pk'],
        subject: 'Batch Test 1',
        html: '<p>Batch test email 1</p>'
      },
      {
        from: 'onboarding@resend.dev',
        to: ['asadarshadf21@nutech.edu.pk'],
        subject: 'Batch Test 2',
        html: '<p>Batch test email 2</p>'
      }
    ]);
    
    console.log('✅ Batch email result:', JSON.stringify(batchResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testResend();
