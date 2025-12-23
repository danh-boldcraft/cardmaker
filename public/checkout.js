/**
 * Checkout Frontend Module
 * Handles the shipping form and checkout flow
 */

// DOM Elements
let buyCardBtn, buyBtnText, buyBtnLoader;
let checkoutForm, cancelCheckoutBtn, proceedToPaymentBtn;
let proceedBtnText, proceedBtnLoader;
let firstNameInput, lastNameInput, emailInput;
let address1Input, address2Input, cityInput, stateInput, zipInput, countryInput;

/**
 * Initialize checkout UI elements
 */
function initCheckout() {
    // Buy button elements
    buyCardBtn = document.getElementById('buyCardBtn');
    buyBtnText = document.getElementById('buyBtnText');
    buyBtnLoader = document.getElementById('buyBtnLoader');

    // Form elements
    checkoutForm = document.getElementById('checkoutForm');
    cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
    proceedToPaymentBtn = document.getElementById('proceedToPaymentBtn');
    proceedBtnText = document.getElementById('proceedBtnText');
    proceedBtnLoader = document.getElementById('proceedBtnLoader');

    // Input fields
    firstNameInput = document.getElementById('firstName');
    lastNameInput = document.getElementById('lastName');
    emailInput = document.getElementById('email');
    address1Input = document.getElementById('address1');
    address2Input = document.getElementById('address2');
    cityInput = document.getElementById('city');
    stateInput = document.getElementById('state');
    zipInput = document.getElementById('zip');
    countryInput = document.getElementById('country');

    // Check if elements exist
    if (!buyCardBtn) {
        if (API_CONFIG.debug) {
            console.log('Checkout section not found, skipping initialization');
        }
        return;
    }

    // Set up event listeners
    buyCardBtn.addEventListener('click', handleBuyClick);
    cancelCheckoutBtn.addEventListener('click', handleCancelCheckout);
    proceedToPaymentBtn.addEventListener('click', handleProceedToPayment);

    // Clear validation errors on input
    const inputs = [firstNameInput, lastNameInput, emailInput,
                    address1Input, cityInput, stateInput, zipInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('invalid');
            });
        }
    });

    if (API_CONFIG.debug) {
        console.log('💳 Checkout module initialized');
    }
}

/**
 * Handle "Buy This Card" button click
 */
function handleBuyClick() {
    // Check if we have a current card
    if (!window.currentCard || !window.currentCard.imageId) {
        showCardError('No card selected. Please generate a card first.');
        return;
    }

    // Check if card has expired
    if (window.currentCard.expiresAt) {
        const expiresAt = new Date(window.currentCard.expiresAt);
        if (expiresAt < new Date()) {
            showCardError('This card preview has expired. Please generate a new card.');
            return;
        }
    }

    // Show the checkout form
    checkoutForm.classList.remove('hidden');
    checkoutForm.classList.add('fade-in');

    // Scroll to form
    checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus first input
    setTimeout(() => {
        firstNameInput.focus();
    }, 300);
}

/**
 * Handle cancel checkout button click
 */
function handleCancelCheckout() {
    checkoutForm.classList.add('hidden');
    clearCheckoutForm();
}

/**
 * Clear all form inputs
 */
function clearCheckoutForm() {
    const inputs = [firstNameInput, lastNameInput, emailInput,
                    address1Input, address2Input, cityInput, stateInput, zipInput];
    inputs.forEach(input => {
        if (input) {
            input.value = '';
            input.classList.remove('invalid');
        }
    });
    if (countryInput) {
        countryInput.value = 'US';
    }
}

/**
 * Validate the checkout form
 * @returns {Object|null} Validated form data or null if validation fails
 */
function validateCheckoutForm() {
    const required = [
        { input: firstNameInput, name: 'First name' },
        { input: lastNameInput, name: 'Last name' },
        { input: emailInput, name: 'Email' },
        { input: address1Input, name: 'Street address' },
        { input: cityInput, name: 'City' },
        { input: stateInput, name: 'State' },
        { input: zipInput, name: 'ZIP code' }
    ];

    let isValid = true;
    let firstInvalid = null;

    required.forEach(({ input, name }) => {
        if (!input.value.trim()) {
            input.classList.add('invalid');
            isValid = false;
            if (!firstInvalid) firstInvalid = input;
        }
    });

    // Validate email format
    if (emailInput.value && !isValidEmail(emailInput.value)) {
        emailInput.classList.add('invalid');
        isValid = false;
        if (!firstInvalid) firstInvalid = emailInput;
    }

    // Validate ZIP format (US: 5 digits or 5+4)
    if (zipInput.value && countryInput.value === 'US') {
        if (!/^\d{5}(-\d{4})?$/.test(zipInput.value)) {
            zipInput.classList.add('invalid');
            isValid = false;
            if (!firstInvalid) firstInvalid = zipInput;
        }
    }

    if (!isValid) {
        if (firstInvalid) firstInvalid.focus();
        return null;
    }

    return {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        address1: address1Input.value.trim(),
        address2: address2Input.value.trim() || null,
        city: cityInput.value.trim(),
        state: stateInput.value.trim().toUpperCase(),
        zip: zipInput.value.trim(),
        country: countryInput.value
    };
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Set loading state for proceed button
 */
function setProceedLoading(isLoading) {
    if (isLoading) {
        proceedToPaymentBtn.disabled = true;
        cancelCheckoutBtn.disabled = true;
        proceedBtnText.classList.add('hidden');
        proceedBtnLoader.classList.remove('hidden');
    } else {
        proceedToPaymentBtn.disabled = false;
        cancelCheckoutBtn.disabled = false;
        proceedBtnText.classList.remove('hidden');
        proceedBtnLoader.classList.add('hidden');
    }
}

/**
 * Handle "Proceed to Payment" button click
 */
async function handleProceedToPayment() {
    // Validate form
    const formData = validateCheckoutForm();
    if (!formData) {
        return;
    }

    // Ensure we have the current card
    if (!window.currentCard || !window.currentCard.imageId) {
        showCardError('Card session expired. Please generate a new card.');
        return;
    }

    setProceedLoading(true);

    try {
        const response = await fetch(API_CONFIG.checkoutEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageId: window.currentCard.imageId,
                email: formData.email,
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address1: formData.address1,
                    address2: formData.address2,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    country: formData.country
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Checkout failed with status ${response.status}`);
        }

        // Success - redirect to Shopify checkout
        if (API_CONFIG.debug) {
            console.log('Checkout created:', {
                orderId: data.orderId,
                redirecting: data.checkoutUrl
            });
        }

        // Redirect to Shopify checkout URL
        window.location.href = data.checkoutUrl;

    } catch (error) {
        console.error('Checkout error:', error);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showCardError('Network error. Please check your connection and try again.');
        } else {
            showCardError(error.message);
        }

        setProceedLoading(false);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}
