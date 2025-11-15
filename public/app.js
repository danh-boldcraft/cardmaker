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

// Validate API configuration on page load
window.addEventListener('DOMContentLoaded', () => {
    if (API_CONFIG.endpoint.includes('YOUR_API_ENDPOINT_HERE')) {
        showError('⚠️ API endpoint not configured! Please update the endpoint in config.js with your actual API Gateway URL.');
        submitBtn.disabled = true;
    }
});
