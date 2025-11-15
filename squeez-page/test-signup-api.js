const axios = require('axios');

const API_URL = 'https://data146-2y558emmf-res-projects-e56cf0fa.vercel.app/api/signup';

async function testSignup() {
  console.log('🧪 Testing Signup API...\n');
  console.log('URL:', API_URL);
  
  const testData = {
    name: 'Test User ' + Date.now(),
    email: `test${Date.now()}@example.com`,
    demo_request: false
  };
  
  console.log('Sending:', testData);
  console.log('');
  
  try {
    const response = await axios.post(API_URL, testData);
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.emailStatus) {
      if (response.data.emailStatus.sent) {
        console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
      } else {
        console.log('\n❌ EMAIL FAILED:', response.data.emailStatus.error);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSignup();

