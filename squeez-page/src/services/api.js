import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://data12-nu.vercel.app/api' 
  : 'http://localhost:3001/api';

// Submit early access signup
export const submitSignup = async (name, email, demoRequest) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, {
      name,
      email,
      demo_request: demoRequest
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to submit signup' 
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

// Admin login (simple hardcoded validation for now)
export const adminLogin = (email, password) => {
  // Hardcoded credentials - match with your existing setup
  const ADMIN_EMAIL = 'admin@drumlatch.com';
  const ADMIN_PASSWORD = 'admin123';
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_logged_in', 'true');
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
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
