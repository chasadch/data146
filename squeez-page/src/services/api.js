import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? '/api'
  : 'http://localhost:3001/api';

// Submit early access signup
export const submitSignup = async (name, email, demoRequest) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, {
      name,
      email,
      demo_request: demoRequest
    });
    const { success, data, emailStatus } = response.data || {};
    return { success, data, emailStatus };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to submit signup' 
    };
  }
};

// Resend welcome email for a given address
export const resendWelcomeEmail = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/resend-welcome`, { email });
    const { success, emailStatus, error } = response.data || {};
    return { success, emailStatus, error };
  } catch (err) {
    console.error('Resend welcome email error:', err);
    return {
      success: false,
      error: err.response?.data?.error || 'Failed to resend welcome email'
    };
  }
};

// Get all signups (admin)
export const getSignups = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/signups`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get signups error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to fetch signups' 
    };
  }
};

// Admin login with localStorage-stored password (fallback to default)
export const adminLogin = (email, password) => {
  const ADMIN_EMAIL = 'admin@drumlatch.com';
  const ADMIN_PASSWORD_DEFAULT = 'admin123';
  const storedPassword = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null;
  const currentPassword = storedPassword || ADMIN_PASSWORD_DEFAULT;

  if (email === ADMIN_EMAIL && password === currentPassword) {
    sessionStorage.setItem('admin_logged_in', 'true');
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
};

// Reset admin password using old password verification (client-side storage only)
export const resetAdminPassword = (oldPassword, newPassword) => {
  const ADMIN_PASSWORD_DEFAULT = 'admin123';
  const storedPassword = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null;
  const currentPassword = storedPassword || ADMIN_PASSWORD_DEFAULT;

  if (!oldPassword || !newPassword) {
    return { success: false, error: 'Both old and new passwords are required' };
  }
  if (oldPassword !== currentPassword) {
    return { success: false, error: 'Old password is incorrect' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_password', newPassword);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to store new password' };
  }
};

// Check if admin is logged in
export const isAdminLoggedIn = () => {
  return sessionStorage.getItem('admin_logged_in') === 'true';
};

// Admin logout
export const adminLogout = () => {
  sessionStorage.removeItem('admin_logged_in');
};

// Get user's public IP
export const getUserIP = async () => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return null;
  }
};

// Get location from IP
export const getLocationFromIP = async (ip) => {
  const apis = [
    { url: `http://ip-api.com/json/${ip}`, parser: (data) => `${data.city}, ${data.regionName}, ${data.country}` },
    { url: `https://get.geojs.io/v1/ip/geo/${ip}.json`, parser: (data) => `${data.city}, ${data.region}, ${data.country}` },
    { url: `https://ipapi.co/${ip}/json/`, parser: (data) => `${data.city}, ${data.region}, ${data.country_name}` }
  ];

  for (const api of apis) {
    try {
      const response = await axios.get(api.url, { timeout: 3000 });
      return api.parser(response.data);
    } catch (error) {
      console.log(`Failed to fetch from ${api.url}:`, error.message);
      continue;
    }
  }
  
  return 'Unknown';
};

// Send broadcast email to all signups
export const sendBroadcast = async (subject, message, fromEmail) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-broadcast`, {
      subject,
      message,
      fromEmail
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Broadcast error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to send broadcast email' 
    };
  }
};
