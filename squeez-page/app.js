// Supabase Configuration
const SUPABASE_URL = 'https://biizukombyhrawczmcuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaXp1a29tYnlocmF3Y3ptY3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjgzNDksImV4cCI6MjA3NzYwNDM0OX0.uQbFtU6mgo1Q3sRTQ4-6H3ILL9B3zs7IL-lH2ThB-Bo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get geolocation from user's IP using public APIs (with graceful fallback)
async function fetchGeoData() {
    const withTimeout = (promise, ms = 3000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]);
    };

    // Try ipapi.co first
    try {
        const res = await withTimeout(fetch('https://ipapi.co/json/', { cache: 'no-store' }));
        if (res.ok) {
            const j = await res.json();
            return {
                ip: j.ip,
                city: j.city,
                region: j.region,
                country: j.country_name || j.country,
                country_code: j.country_code,
                latitude: typeof j.latitude === 'number' ? j.latitude : parseFloat(j.latitude),
                longitude: typeof j.longitude === 'number' ? j.longitude : parseFloat(j.longitude),
                timezone: j.timezone,
                source: 'ipapi.co'
            };
        }
    } catch (_) { /* noop */ }

    // Fallback: geojs.io
    try {
        const res = await withTimeout(fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' }));
        if (res.ok) {
            const j = await res.json();
            return {
                ip: j.ip,
                city: j.city,
                region: j.region,
                country: j.country,
                country_code: j.country_code,
                latitude: typeof j.latitude === 'number' ? j.latitude : parseFloat(j.latitude),
                longitude: typeof j.longitude === 'number' ? j.longitude : parseFloat(j.longitude),
                timezone: j.timezone,
                source: 'geojs.io'
            };
        }
    } catch (_) { /* noop */ }

    return null; // As a last resort, proceed without geo
}

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
        // Try to enrich with IP geolocation (non-blocking if it fails)
        let geo = null;
        try { geo = await fetchGeoData(); } catch (_) { geo = null; }

        const basePayload = {
            name: name,
            email: email,
            created_at: new Date().toISOString()
        };

        // Prefer inserting geo fields in the initial INSERT so no UPDATE permission is required
        const payloadWithGeo = geo ? {
            ...basePayload,
            ip: geo.ip || null,
            city: geo.city || null,
            region: geo.region || null,
            country: geo.country || null,
            country_code: geo.country_code || null,
            latitude: typeof geo.latitude === 'number' ? geo.latitude : null,
            longitude: typeof geo.longitude === 'number' ? geo.longitude : null,
            timezone: geo.timezone || null
        } : basePayload;

        // Upsert to gracefully handle duplicate emails and still update geo
        let writeErr = null;
        {
            const { error } = await supabase
                .from('early_access_signups')
                .upsert([payloadWithGeo], { onConflict: 'email' });
            writeErr = error || null;
        }
        if (writeErr) {
            const msg = String(writeErr.message || writeErr);
            const code = writeErr.code;
            const isUnknownColumn = code === '42703' || /column .* does not exist/i.test(msg);
            const isShapeMismatch = code === 'PGRST302' || /payload.*does not conform/i.test(msg);
            if (isUnknownColumn || isShapeMismatch) {
                const { error: retryErr } = await supabase
                    .from('early_access_signups')
                    .upsert([basePayload], { onConflict: 'email' });
                if (retryErr) throw retryErr;
            } else {
                throw writeErr;
            }
        }
        
        // Show success message
        showMessage(successMessage, 'Thank you! Your early access request has been submitted.');
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        
    } catch (error) {
        console.error('Error submitting form:', error);
        
        // Check if it's a duplicate email error
        if (error.code === '23505') {
            showMessage(errorMessage, 'This email is already registered.');
        } else {
            showMessage(errorMessage, 'Something went wrong. Please try again.');
        }
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
