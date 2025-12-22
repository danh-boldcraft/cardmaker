# Phase 3: Frontend Checkout Flow - Implementation Plan

## Overview
Add the checkout flow to the frontend that allows users to purchase their generated AI greeting card. This phase builds the UI and frontend logic that connects to the checkout backend (Phase 4).

## Current State
- **Image generation complete**: Users can enter a prompt and generate a card image
- **Card preview exists**: Generated card displays with 5x7 dimensions
- **`window.currentCard` stores**: imageId, imageUrl, expiresAt, prompt for the current card
- **Missing**: Buy button, shipping address form, checkout API call

## Implementation Tasks

### 1. Add Checkout Endpoint Configuration
**File:** `public/config.js`

Add the checkout endpoint URL to the API_CONFIG object:
```javascript
// Add to API_CONFIG object (around line 132)
checkoutEndpoint: `${getApiBaseUrl()}/checkout`,
```

### 2. Add "Buy This Card" Button to Card Preview
**File:** `public/index.html`

Add a "Buy This Card" button below the card preview image. The button should:
- Be hidden initially (only show after a card is generated)
- Be inside the `#cardPreview` div, after the preview-note paragraph
- Have a distinct CTA styling

Add the following markup inside `#cardPreview`, after the `<p class="preview-note">` line:
```html
<button type="button" id="buyCardBtn" class="buy-btn">
    <span id="buyBtnText">Buy This Card - $12.99</span>
    <span id="buyBtnLoader" class="loader hidden"></span>
</button>
```

### 3. Add Shipping Address Form Section
**File:** `public/index.html`

Add a new collapsible section that appears when user clicks "Buy This Card". Add this section AFTER the `#cardPreview` div and BEFORE the `#cardError` div:

```html
<!-- Shipping Address Form (shown after clicking Buy) -->
<div id="checkoutForm" class="checkout-form hidden">
    <h3>Shipping Information</h3>
    <p class="checkout-subtitle">Where should we send your card?</p>

    <div class="form-row">
        <div class="form-group">
            <label for="firstName">First Name *</label>
            <input type="text" id="firstName" name="firstName" required />
        </div>
        <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input type="text" id="lastName" name="lastName" required />
        </div>
    </div>

    <div class="form-group">
        <label for="email">Email Address *</label>
        <input type="email" id="email" name="email" required
               placeholder="For order confirmation" />
    </div>

    <div class="form-group">
        <label for="address1">Street Address *</label>
        <input type="text" id="address1" name="address1" required />
    </div>

    <div class="form-group">
        <label for="address2">Apartment, suite, etc. (optional)</label>
        <input type="text" id="address2" name="address2" />
    </div>

    <div class="form-row">
        <div class="form-group">
            <label for="city">City *</label>
            <input type="text" id="city" name="city" required />
        </div>
        <div class="form-group form-group-small">
            <label for="state">State *</label>
            <input type="text" id="state" name="state" required
                   placeholder="e.g., CA" maxlength="2" />
        </div>
        <div class="form-group form-group-small">
            <label for="zip">ZIP Code *</label>
            <input type="text" id="zip" name="zip" required
                   pattern="[0-9]{5}(-[0-9]{4})?" />
        </div>
    </div>

    <div class="form-group">
        <label for="country">Country *</label>
        <select id="country" name="country" required>
            <option value="US" selected>United States</option>
            <option value="CA">Canada</option>
            <!-- Add more countries as needed -->
        </select>
    </div>

    <div class="form-actions">
        <button type="button" id="cancelCheckoutBtn" class="btn-secondary">
            Cancel
        </button>
        <button type="button" id="proceedToPaymentBtn" class="btn-primary">
            <span id="proceedBtnText">Proceed to Payment</span>
            <span id="proceedBtnLoader" class="loader hidden"></span>
        </button>
    </div>
</div>
```

### 4. Add CSS Styles for Checkout Flow
**File:** `public/styles.css`

Add the following styles at the end of the file:

```css
/* Checkout Flow Styles */
.buy-btn {
    width: 100%;
    padding: 16px 24px;
    margin-top: 20px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.buy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.buy-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.checkout-form {
    margin-top: 24px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
}

.checkout-form h3 {
    margin: 0 0 8px 0;
    color: #333;
}

.checkout-subtitle {
    margin: 0 0 20px 0;
    color: #6c757d;
    font-size: 0.9rem;
}

.form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}

.form-group {
    flex: 1;
    margin-bottom: 16px;
}

.form-group-small {
    flex: 0 0 100px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #495057;
    font-size: 0.9rem;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px 12px;
    font-size: 1rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    background: #fff;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group input.invalid {
    border-color: #dc3545;
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #dee2e6;
}

.btn-secondary {
    flex: 0 0 auto;
    padding: 12px 24px;
    font-size: 1rem;
    color: #6c757d;
    background: #fff;
    border: 1px solid #ced4da;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
}

.btn-primary {
    flex: 1;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    background: #007bff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-primary:hover {
    background: #0069d9;
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Responsive adjustments for checkout form */
@media (max-width: 600px) {
    .form-row {
        flex-direction: column;
        gap: 0;
    }

    .form-group-small {
        flex: 1;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-primary {
        width: 100%;
    }
}
```

### 5. Create Checkout JavaScript Module
**File:** `public/checkout.js` (NEW)

Create a new module for checkout functionality:

```javascript
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
                    provinceCode: formData.state,
                    zip: formData.zip,
                    countryCode: formData.country
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
```

### 6. Include checkout.js in index.html
**File:** `public/index.html`

Add the script tag after card-generator.js:
```html
<script src="checkout.js"></script>
```

The scripts section should look like:
```html
<script src="config.js"></script>
<script src="card-generator.js"></script>
<script src="checkout.js"></script>
<script type="module" src="app.js"></script>
```

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `public/config.js` | Modify | Add `checkoutEndpoint` to API_CONFIG |
| `public/index.html` | Modify | Add buy button, shipping form, checkout.js script |
| `public/styles.css` | Modify | Add checkout form styles |
| `public/checkout.js` | Create | Checkout flow JavaScript logic |

## API Contract (for Phase 4 backend)

The checkout frontend expects this API contract:

**POST /checkout**
```json
Request:
{
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "San Francisco",
    "provinceCode": "CA",
    "zip": "94102",
    "countryCode": "US"
  }
}

Response (200):
{
  "orderId": "draft_order_123",
  "checkoutUrl": "https://store.myshopify.com/cart/..."
}

Error (400):
{
  "error": "Missing required field: imageId"
}

Error (404):
{
  "error": "Card image not found or expired"
}

Error (500):
{
  "error": "Failed to create checkout: [details]"
}
```

## Implementation Order

1. Update `public/config.js` - Add checkout endpoint
2. Update `public/index.html` - Add buy button and shipping form HTML
3. Update `public/styles.css` - Add checkout form styles
4. Create `public/checkout.js` - Checkout flow logic
5. Update `public/index.html` - Include checkout.js script
6. Test locally with mock responses (optional)
7. Deploy to test environment

## Testing Checklist

### UI Testing (before Phase 4 backend)
- [ ] Card generates successfully and preview shows
- [ ] "Buy This Card" button appears in card preview
- [ ] Clicking Buy shows shipping form with smooth animation
- [ ] Cancel button hides form and clears inputs
- [ ] Form validation highlights required fields
- [ ] Email validation works correctly
- [ ] ZIP code validation works for US format
- [ ] State input converts to uppercase
- [ ] Form is responsive on mobile

### Integration Testing (after Phase 4 backend)
- [ ] Proceed button calls /checkout endpoint
- [ ] Loading state shows during API call
- [ ] Success redirects to Shopify checkout URL
- [ ] Error shows appropriate message
- [ ] Network errors handled gracefully

## Dependencies
- **Requires Phase 2**: Card generation must work (provides `window.currentCard`)
- **Prepares for Phase 4**: Frontend ready to consume `/checkout` endpoint

## Design Decisions
- **Inline form vs modal**: Using inline form for simpler UX (no modal complexity)
- **Country dropdown**: Starting with US/Canada only for POC
- **State as text input**: Simpler than dropdown, with 2-char validation
- **Price hardcoded**: $12.99 shown in button (matches Shopify product)
- **Redirect flow**: Redirect to Shopify for payment (not embedded checkout)
