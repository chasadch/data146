// Neon DB backend API configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Hardcoded Admin Credentials
const ADMIN_EMAIL = 'admin@drumlatch.com';
const ADMIN_PASSWORD = '|{admin@drumlatch12345}|';

// Global variables
let allSignups = [];
let filteredSignups = [];
let currentPage = 1;
const rowsPerPage = 20;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupLoginForm();
});

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
    }
}

// Setup login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
}

// Handle login
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Login successful
        sessionStorage.setItem('adminLoggedIn', 'true');
        errorDiv.style.display = 'none';
        showDashboard();
    } else {
        // Login failed
        errorDiv.style.display = 'block';
        document.getElementById('loginPassword').value = '';
    }
}

// Show dashboard and hide login
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    loadSignups();
    setupSearchListener();
}

// Logout function
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// Load all signups from backend
async function loadSignups() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${API_URL}/signups`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch signups');
        }
        
        const data = await response.json();
        
        allSignups = data || [];
        filteredSignups = [...allSignups];
        
        updateStats();
        displaySignups();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading signups:', error);
        showError('Failed to load signups. Please check your server connection.');
        showLoading(false);
    }
}

// Update statistics cards
function updateStats() {
    const total = allSignups.length;
    document.getElementById('totalSignups').textContent = total;
    
    // Calculate today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allSignups.filter(signup => {
        const signupDate = new Date(signup.created_at);
        signupDate.setHours(0, 0, 0, 0);
        return signupDate.getTime() === today.getTime();
    }).length;
    document.getElementById('todaySignups').textContent = todayCount;
    
    // Calculate this week's signups
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = allSignups.filter(signup => {
        const signupDate = new Date(signup.created_at);
        return signupDate >= weekAgo;
    }).length;
    document.getElementById('weekSignups').textContent = weekCount;
}

// Display signups in table
function displaySignups() {
    const tableBody = document.getElementById('signupsTable');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (filteredSignups.length === 0) {
        tableContainer.style.display = 'block';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredSignups.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredSignups.length);
    const pageSignups = filteredSignups.slice(startIndex, endIndex);
    
    // Populate table
    pageSignups.forEach((signup, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700/50 transition';
        
        const globalIndex = startIndex + index + 1;
        const formattedDate = new Date(signup.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const locationStr = [signup.city, signup.region, signup.country]
            .filter(Boolean)
            .join(', ');
        const ipStr = signup.ip || '';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${globalIndex}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${escapeHtml(signup.name)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${escapeHtml(signup.email)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${escapeHtml(locationStr || '-')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${escapeHtml(ipStr || '-')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                ${formattedDate}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update pagination
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = currentPage === totalPages;
    } else {
        pagination.style.display = 'none';
    }
}

// Search functionality
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredSignups = [...allSignups];
        } else {
            filteredSignups = allSignups.filter(signup => 
                (signup.name || '').toLowerCase().includes(searchTerm) ||
                (signup.email || '').toLowerCase().includes(searchTerm) ||
                [signup.city, signup.region, signup.country]
                    .filter(Boolean)
                    .join(', ')
                    .toLowerCase()
                    .includes(searchTerm) ||
                (signup.ip || '').toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1;
        displaySignups();
    });
}

// Pagination functions
function nextPage() {
    const totalPages = Math.ceil(filteredSignups.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displaySignups();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displaySignups();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Refresh data
async function refreshData() {
    currentPage = 1;
    document.getElementById('searchInput').value = '';
    await loadSignups();
}

// Export to CSV
function exportToCSV() {
    if (allSignups.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create CSV content
    const headers = ['#', 'Name', 'Email', 'Location', 'IP', 'Signup Date'];
    const csvRows = [headers.join(',')];
    
    allSignups.forEach((signup, index) => {
        const locationStr = [signup.city, signup.region, signup.country]
            .filter(Boolean)
            .join(', ');
        const row = [
            index + 1,
            `"${String(signup.name || '').replace(/"/g, '""')}"`,
            `"${String(signup.email || '').replace(/"/g, '""')}"`,
            `"${String(locationStr || '').replace(/"/g, '""')}"`,
            `"${String(signup.ip || '')}"`,
            `"${new Date(signup.created_at).toLocaleString()}"`
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drumlatch_signups_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
    document.getElementById('tableContainer').style.display = show ? 'none' : 'block';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
}

function hideError() {
    document.getElementById('errorState').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
