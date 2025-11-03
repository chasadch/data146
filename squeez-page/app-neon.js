// Neon DB backend API configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Form submission handler
document.getElementById('earlyAccessForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get form values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    // Validate inputs
    if (!name || !email) {
        showMessage(errorMessage, 'Please fill in all fields.');
        return;
    }
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Hide previous messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Submission failed');
        }
        
        // Show success message
        showMessage(successMessage, 'Thank you! Your early access request has been submitted.');
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showMessage(errorMessage, error.message || 'Something went wrong. Please try again.');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Claim Early Access';
    }
});

// Helper function to show messages
function showMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
