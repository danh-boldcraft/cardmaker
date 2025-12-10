// Import Memberstack DOM package
import memberstackDOM from 'https://cdn.jsdelivr.net/npm/@memberstack/dom/+esm';

// DOM Elements
const form = document.getElementById('multiplyForm');
const numberInput = document.getElementById('numberInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const resultDiv = document.getElementById('result');
const resultValue = document.getElementById('resultValue');
const calculation = document.getElementById('calculation');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// Auth DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loggedOutButtons = document.getElementById('loggedOutButtons');
const loggedInButtons = document.getElementById('loggedInButtons');
const userEmail = document.getElementById('userEmail');
const proBanner = document.getElementById('proBanner');
const getInfoBtn = document.getElementById('getInfoBtn');
const memberInfoDiv = document.getElementById('memberInfo');
const memberInfoContent = document.getElementById('memberInfoContent');

// Memberstack instance
let memberstack = null;

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const number = parseFloat(numberInput.value);

    // Hide previous results/errors
    hideResult();
    hideError();

    // Show loading state
    setLoading(true);

    try {
        // Make API call
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number })
        });

        // Handle rate limiting (429 Too Many Requests)
        if (response.status === 429) {
            showError('⏱️ Rate limit exceeded. Please wait a moment and try again. (Limit: 10 requests per second)');
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            // Handle error response
            throw new Error(data.error || `API returned status ${response.status}`);
        }

        // Display success result
        showResult(data.input, data.result);

    } catch (error) {
        console.error('Error:', error);

        // Check if it's a network error
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Network error: Unable to connect to the API. Please check your API endpoint configuration.');
        } else {
            showError(error.message);
        }
    } finally {
        setLoading(false);
    }
});

// Show loading state
function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        numberInput.disabled = true;
    } else {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        numberInput.disabled = false;
    }
}

// Show result
function showResult(input, result) {
    resultValue.textContent = result;
    calculation.textContent = `${input} × 3 = ${result}`;
    resultDiv.classList.remove('hidden');

    // Add animation
    resultDiv.classList.add('fade-in');
    setTimeout(() => resultDiv.classList.remove('fade-in'), 300);
}

// Hide result
function hideResult() {
    resultDiv.classList.add('hidden');
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorDiv.classList.remove('hidden');

    // Add animation
    errorDiv.classList.add('fade-in');
    setTimeout(() => errorDiv.classList.remove('fade-in'), 300);
}

// Hide error
function hideError() {
    errorDiv.classList.add('hidden');
}

// Clear input on focus (optional UX enhancement)
numberInput.addEventListener('focus', () => {
    hideResult();
    hideError();
});

// Display environment banner and validate configuration on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Display environment banner
    const environmentBanner = document.getElementById('environmentBanner');
    const environmentLabel = document.getElementById('environmentLabel');
    const environment = API_CONFIG.environment.toUpperCase();

    environmentLabel.textContent = `🔷 ${environment} ENVIRONMENT`;
    environmentBanner.classList.add(API_CONFIG.environment);

    // Validate API configuration
    if (API_CONFIG.endpoint.includes('REPLACE_WITH') || API_CONFIG.endpoint.includes('YOUR_API_ENDPOINT_HERE')) {
        showError('⚠️ API endpoint not configured! Please update the endpoint in config.js with your actual API Gateway URL.');
        submitBtn.disabled = true;
    }

    // Initialize Memberstack
    await initMemberstack();
});

// Initialize Memberstack
async function initMemberstack() {
    try {
        // Validate public key is configured
        if (!API_CONFIG.memberstackPublicKey || API_CONFIG.memberstackPublicKey.includes('PLACEHOLDER')) {
            console.error('Memberstack public key not configured for', API_CONFIG.environment, 'environment');
            console.error('For local development, ensure CT_MEMBERSTACK_LOCAL_PUBLIC_KEY is set in .env');
            return;
        }

        // Initialize Memberstack with environment-specific public key
        memberstack = memberstackDOM.init({
            publicKey: API_CONFIG.memberstackPublicKey
        });

        // Check current auth state
        const member = await memberstack.getCurrentMember();
        updateAuthUI(member.data);

        // Wire up auth buttons
        loginBtn.addEventListener('click', async () => {
            try {
                const result = await memberstack.openModal('LOGIN');
                if (result.data) {
                    updateAuthUI(result.data);
                }
            } catch (error) {
                console.log('Login cancelled or failed:', error);
            }
        });

        signupBtn.addEventListener('click', async () => {
            try {
                const result = await memberstack.openModal('SIGNUP');
                if (result.data) {
                    updateAuthUI(result.data);
                }
            } catch (error) {
                console.log('Signup cancelled or failed:', error);
            }
        });

        logoutBtn.addEventListener('click', async () => {
            try {
                await memberstack.logout();
                updateAuthUI(null);
                if (API_CONFIG.debug) {
                    console.log('🚪 Logged out successfully');
                }
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });

        // Get My Info button handler
        getInfoBtn.addEventListener('click', async () => {
            // Hide previous results
            memberInfoDiv.classList.add('hidden');
            hideError();

            try {
                // Get the JWT token from Memberstack
                const token = memberstack.getMemberCookie();
                if (!token) {
                    showError('Not logged in or no session token available');
                    return;
                }

                // Build endpoint URL (replace /multiply with /member-info)
                const memberInfoEndpoint = API_CONFIG.endpoint.replace('/multiply', '/member-info');

                // Make authenticated request
                const response = await fetch(memberInfoEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Request failed with status ${response.status}`);
                }

                const data = await response.json();

                // Display the info
                memberInfoContent.innerHTML = `
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Name:</strong> ${data.name || 'Not set'}</p>
                    <p><strong>Plans:</strong> ${data.plans.length > 0
                        ? data.plans.map(p => `${p.planName} (${p.status})`).join(', ')
                        : 'No plans'}</p>
                `;
                memberInfoDiv.classList.remove('hidden');

                if (API_CONFIG.debug) {
                    console.log('Member info retrieved:', data);
                }
            } catch (error) {
                console.error('Error fetching member info:', error);
                showError(error.message);
            }
        });

        // Listen for auth state changes
        memberstack.onAuthChange((member) => {
            updateAuthUI(member);
        });

        if (API_CONFIG.debug) {
            console.log('🔐 Memberstack initialized');
        }
    } catch (error) {
        console.error('Failed to initialize Memberstack:', error);
    }
}

// Update UI based on auth state
function updateAuthUI(member) {
    if (member) {
        // User is logged in
        loggedOutButtons.classList.add('hidden');
        loggedInButtons.classList.remove('hidden');
        userEmail.textContent = member.auth.email;

        // Check if user has Pro plan
        const hasPro = member.planConnections &&
            member.planConnections.some(plan => plan.planName === 'Pro' && plan.status === 'ACTIVE');

        if (hasPro) {
            proBanner.classList.remove('hidden');
        } else {
            proBanner.classList.add('hidden');
        }

        if (API_CONFIG.debug) {
            console.log('👤 Logged in as:', member.auth.email);
            console.log('📋 Plans:', member.planConnections);
        }
    } else {
        // User is logged out
        loggedOutButtons.classList.remove('hidden');
        loggedInButtons.classList.add('hidden');
        userEmail.textContent = '';
        proBanner.classList.add('hidden');
    }
}
