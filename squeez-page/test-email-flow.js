/**
 * Email Flow Test Script
 * Tests the complete email functionality including signup, welcome email, and resend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_NAME = 'Test User';

console.log('🧪 Testing Email Flow\n');
console.log('=' .repeat(60));

async function testSignup() {
  console.log('\n1️⃣ Testing Signup with Automatic Welcome Email...');
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, {
      name: TEST_NAME,
      email: TEST_EMAIL,
      demo_request: false
    });

    console.log('✅ Signup Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Signup successful!');
      
      if (response.data.emailStatus) {
        if (response.data.emailStatus.sent) {
          console.log('✅ Welcome email sent successfully!');
        } else {
          console.log('⚠️ Welcome email failed:', response.data.emailStatus.error);
        }
      }
    } else {
      console.log('❌ Signup failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Signup error:', error.response?.data || error.message);
    throw error;
  }
}

async function testResendWelcome() {
  console.log('\n2️⃣ Testing Resend Welcome Email...');
  try {
    const response = await axios.post(`${API_BASE_URL}/resend-welcome`, {
      email: TEST_EMAIL,
      name: TEST_NAME
    });

    console.log('✅ Resend Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.emailStatus?.sent) {
      console.log('✅ Welcome email resent successfully!');
    } else {
      console.log('⚠️ Resend failed:', response.data.emailStatus?.error || response.data.error);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Resend error:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetSignups() {
  console.log('\n3️⃣ Testing Get Signups...');
  try {
    const response = await axios.get(`${API_BASE_URL}/signups`);
    
    const testSignup = response.data.find(s => s.email === TEST_EMAIL);
    if (testSignup) {
      console.log('✅ Test signup found in database:', testSignup.name, testSignup.email);
    } else {
      console.log('⚠️ Test signup not found in database');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Get signups error:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetEmailLogs() {
  console.log('\n4️⃣ Testing Get Email Logs...');
  try {
    const response = await axios.get(`${API_BASE_URL}/email-logs`);
    
    const testLogs = response.data.filter(log => log.email === TEST_EMAIL);
    console.log(`✅ Found ${testLogs.length} email log(s) for test user:`);
    
    testLogs.forEach((log, index) => {
      console.log(`\n   Log ${index + 1}:`);
      console.log(`   - Type: ${log.email_type}`);
      console.log(`   - Status: ${log.status}`);
      console.log(`   - Subject: ${log.subject}`);
      console.log(`   - Time: ${new Date(log.created_at).toLocaleString()}`);
      if (log.error_message) {
        console.log(`   - Error: ${log.error_message}`);
      }
      if (log.resend_email_id) {
        console.log(`   - Resend ID: ${log.resend_email_id}`);
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Get email logs error:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log(`\n📧 Test Email: ${TEST_EMAIL}`);
  console.log(`👤 Test Name: ${TEST_NAME}`);
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Signup with automatic welcome email
    await testSignup();
    
    // Wait a bit for email to process
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Resend welcome email
    await testResendWelcome();
    
    // Wait a bit for email to process
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Verify signup in database
    await testGetSignups();
    
    // Test 4: Check email logs
    await testGetEmailLogs();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.log('\n' + '=' .repeat(60));
    console.log('❌ Tests failed with errors');
    console.log('=' .repeat(60));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

