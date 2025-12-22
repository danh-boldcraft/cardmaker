/**
 * Card Generator Frontend Module
 * Handles AI-powered greeting card generation
 */

// DOM Elements (initialized after DOMContentLoaded)
let promptInput;
let generateBtn;
let generateBtnText;
let generateBtnLoader;
let cardPreview;
let cardImage;
let cardError;
let cardErrorMessage;
let usageDisplay;

/**
 * Initialize the card generator UI
 */
function initCardGenerator() {
  // Get DOM elements
  promptInput = document.getElementById('cardPrompt');
  generateBtn = document.getElementById('generateBtn');
  generateBtnText = document.getElementById('generateBtnText');
  generateBtnLoader = document.getElementById('generateBtnLoader');
  cardPreview = document.getElementById('cardPreview');
  cardImage = document.getElementById('cardImage');
  cardError = document.getElementById('cardError');
  cardErrorMessage = document.getElementById('cardErrorMessage');
  usageDisplay = document.getElementById('usageDisplay');

  // Check if elements exist (card generator section might not be present)
  if (!generateBtn) {
    if (API_CONFIG.debug) {
      console.log('Card generator section not found, skipping initialization');
    }
    return;
  }

  // Set up event listeners
  generateBtn.addEventListener('click', handleGenerateCard);

  // Allow Enter key to submit (but not Shift+Enter for multi-line)
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateCard();
    }
  });

  // Clear error on input focus
  promptInput.addEventListener('focus', hideCardError);

  // Character counter
  const charCount = document.getElementById('promptCharCount');
  if (charCount) {
    promptInput.addEventListener('input', () => {
      charCount.textContent = promptInput.value.length;
    });
  }

  if (API_CONFIG.debug) {
    console.log('🎨 Card generator initialized');
  }
}

/**
 * Set loading state for the generate button
 */
function setGenerateLoading(isLoading) {
  if (isLoading) {
    generateBtn.disabled = true;
    generateBtnText.classList.add('hidden');
    generateBtnLoader.classList.remove('hidden');
    promptInput.disabled = true;
  } else {
    generateBtn.disabled = false;
    generateBtnText.classList.remove('hidden');
    generateBtnLoader.classList.add('hidden');
    promptInput.disabled = false;
  }
}

/**
 * Show card preview with generated image
 */
function showCardPreview(imageUrl) {
  cardImage.src = imageUrl;
  cardImage.onload = () => {
    cardPreview.classList.remove('hidden');
    cardPreview.classList.add('fade-in');
    setTimeout(() => cardPreview.classList.remove('fade-in'), 300);
  };
  cardImage.onerror = () => {
    showCardError('Failed to load generated image');
  };
}

/**
 * Hide card preview
 */
function hideCardPreview() {
  cardPreview.classList.add('hidden');
}

/**
 * Show error message for card generation
 */
function showCardError(message) {
  cardErrorMessage.textContent = message;
  cardError.classList.remove('hidden');
  cardError.classList.add('fade-in');
  setTimeout(() => cardError.classList.remove('fade-in'), 300);
}

/**
 * Hide card error message
 */
function hideCardError() {
  cardError.classList.add('hidden');
}

/**
 * Update usage display
 */
function updateUsageDisplay(current, limit) {
  if (usageDisplay) {
    usageDisplay.textContent = `${current}/${limit} cards generated today`;
    if (current >= limit) {
      usageDisplay.classList.add('limit-reached');
    } else {
      usageDisplay.classList.remove('limit-reached');
    }
  }
}

/**
 * Handle generate card button click
 */
async function handleGenerateCard() {
  const prompt = promptInput.value.trim();

  // Validate prompt
  if (!prompt) {
    showCardError('Please enter a description for your card');
    return;
  }

  if (prompt.length > 512) {
    showCardError('Description is too long (max 512 characters)');
    return;
  }

  // Hide previous results/errors
  hideCardPreview();
  hideCardError();

  // Hide checkout section if showing
  if (typeof hideCheckoutSection === 'function') {
    hideCheckoutSection();
  }

  // Show loading state
  setGenerateLoading(true);

  try {
    const response = await fetch(API_CONFIG.generateCardEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      if (data.currentCount !== undefined && data.limit !== undefined) {
        updateUsageDisplay(data.currentCount, data.limit);
      }
      showCardError(data.error || 'Rate limit exceeded. Please try again later.');
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    // Success - show the generated card
    showCardPreview(data.imageUrl);

    if (API_CONFIG.debug) {
      console.log('Card generated:', {
        imageId: data.imageId,
        expiresAt: data.expiresAt
      });
    }

    // Store the current card info for potential purchase flow
    window.currentCard = {
      imageId: data.imageId,
      imageUrl: data.imageUrl,
      expiresAt: data.expiresAt,
      prompt: prompt
    };

    // Show checkout section
    if (typeof showCheckoutSection === 'function') {
      showCheckoutSection();
    }

  } catch (error) {
    console.error('Error generating card:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showCardError('Network error. Please check your connection and try again.');
    } else {
      showCardError(error.message);
    }
  } finally {
    setGenerateLoading(false);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardGenerator);
} else {
  initCardGenerator();
}
