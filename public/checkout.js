/**
 * Checkout Frontend Module
 * Handles Shopify checkout flow for AI-generated greeting cards
 */

// DOM Elements (initialized after DOMContentLoaded)
let checkoutSection;
let checkoutForm;
let checkoutBtn;
let checkoutBtnText;
let checkoutBtnLoader;
let checkoutError;
let checkoutErrorMessage;

/**
 * Initialize the checkout form
 */
function initCheckout() {
  // Get DOM elements
  checkoutSection = document.getElementById('checkoutSection');
  checkoutForm = document.getElementById('checkoutForm');
  checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtnText = document.getElementById('checkoutBtnText');
  checkoutBtnLoader = document.getElementById('checkoutBtnLoader');
  checkoutError = document.getElementById('checkoutError');
  checkoutErrorMessage = document.getElementById('checkoutErrorMessage');

  // Check if elements exist
  if (!checkoutForm) {
    if (API_CONFIG.debug) {
      console.log('Checkout form not found, skipping initialization');
    }
    return;
  }

  // Set up event listeners
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Clear error on input focus
  const formInputs = checkoutForm.querySelectorAll('input, select');
  formInputs.forEach(input => {
    input.addEventListener('focus', hideCheckoutError);
  });

  if (API_CONFIG.debug) {
    console.log('🛒 Checkout initialized');
  }
}

/**
 * Show checkout section (called after card is generated)
 */
function showCheckoutSection() {
  if (checkoutSection) {
    checkoutSection.classList.remove('hidden');
    checkoutSection.classList.add('fade-in');
    setTimeout(() => checkoutSection.classList.remove('fade-in'), 300);

    // Scroll to checkout section
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Hide checkout section
 */
function hideCheckoutSection() {
  if (checkoutSection) {
    checkoutSection.classList.add('hidden');
  }
}

/**
 * Set loading state for checkout button
 */
function setCheckoutLoading(isLoading) {
  if (isLoading) {
    checkoutBtn.disabled = true;
    checkoutBtnText.classList.add('hidden');
    checkoutBtnLoader.classList.remove('hidden');

    // Disable form inputs
    const formInputs = checkoutForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.disabled = true;
    });
  } else {
    checkoutBtn.disabled = false;
    checkoutBtnText.classList.remove('hidden');
    checkoutBtnLoader.classList.add('hidden');

    // Enable form inputs
    const formInputs = checkoutForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.disabled = false;
    });
  }
}

/**
 * Show checkout error message
 */
function showCheckoutError(message) {
  checkoutErrorMessage.textContent = message;
  checkoutError.classList.remove('hidden');
  checkoutError.classList.add('fade-in');
  setTimeout(() => checkoutError.classList.remove('fade-in'), 300);

  // Scroll to error
  checkoutError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide checkout error message
 */
function hideCheckoutError() {
  if (checkoutError) {
    checkoutError.classList.add('hidden');
  }
}

/**
 * Handle checkout form submission
 */
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  // Check if we have a current card
  if (!window.currentCard || !window.currentCard.imageId) {
    showCheckoutError('No card selected. Please generate a card first.');
    return;
  }

  // Hide previous errors
  hideCheckoutError();

  // Get form data
  const formData = new FormData(checkoutForm);
  const shippingAddress = {
    firstName: formData.get('firstName').trim(),
    lastName: formData.get('lastName').trim(),
    address1: formData.get('address1').trim(),
    address2: formData.get('address2').trim(),
    city: formData.get('city').trim(),
    state: formData.get('state').trim().toUpperCase(),
    zip: formData.get('zip').trim(),
    country: formData.get('country')
  };

  const email = formData.get('email').trim();

  // Client-side validation
  if (!email || !email.includes('@')) {
    showCheckoutError('Please enter a valid email address');
    return;
  }

  // Show loading state
  setCheckoutLoading(true);

  try {
    const response = await fetch(API_CONFIG.checkoutEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageId: window.currentCard.imageId,
        imageUrl: window.currentCard.imageUrl,
        email: email,
        shippingAddress: shippingAddress
      })
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      showCheckoutError(data.error || 'Order limit exceeded. Please try again later.');
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    // Success - redirect to Shopify checkout
    if (API_CONFIG.debug) {
      console.log('Order created:', {
        orderId: data.orderId,
        checkoutUrl: data.checkoutUrl
      });
    }

    // Redirect user to Shopify checkout
    window.location.href = data.checkoutUrl;

  } catch (error) {
    console.error('Checkout error:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showCheckoutError('Network error. Please check your connection and try again.');
    } else {
      showCheckoutError(error.message);
    }
  } finally {
    setCheckoutLoading(false);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
