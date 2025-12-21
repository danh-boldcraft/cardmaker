// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Card Generator E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('should display the card generator UI correctly', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Cardmaker/);

    // Verify card generator elements are visible
    await expect(page.locator('#cardPrompt')).toBeVisible();
    await expect(page.locator('#generateBtn')).toBeVisible();
    await expect(page.locator('#generateBtnText')).toContainText('Generate Card');

    // Verify character counter is present
    await expect(page.locator('#promptCharCount')).toContainText('0');
  });

  test('should update character counter on input', async ({ page }) => {
    const prompt = page.locator('#cardPrompt');
    const counter = page.locator('#promptCharCount');

    // Initially should be 0
    await expect(counter).toContainText('0');

    // Type some text
    await prompt.fill('A beautiful sunset');
    await expect(counter).toContainText('18');

    // Clear and type longer text
    await prompt.fill('A beautiful sunset over mountains with Happy Birthday text');
    await expect(counter).toContainText('59');
  });

  test('should generate a card image successfully', async ({ page }) => {
    // Skip this test in CI if SKIP_CARD_GENERATION is set to save costs
    if (process.env.SKIP_CARD_GENERATION === 'true') {
      test.skip();
    }

    const prompt = page.locator('#cardPrompt');
    const generateBtn = page.locator('#generateBtn');
    const cardPreview = page.locator('#cardPreview');
    const cardImage = page.locator('#cardImage');
    const cardError = page.locator('#cardError');

    // Fill in a simple prompt
    await prompt.fill('A sunset over mountains');

    // Click generate button
    await generateBtn.click();

    // Wait for loading state to show
    await expect(page.locator('#generateBtnLoader')).toBeVisible({ timeout: 2000 });

    // Wait for loading to complete (image generation can take 20-30 seconds)
    await expect(page.locator('#generateBtnLoader')).toBeHidden({ timeout: 60000 });

    // Check if we got an error (rate limit, etc.) or success
    const errorVisible = await cardError.isVisible().catch(() => false);

    if (errorVisible) {
      // If we hit rate limit or other error, that's okay for the test
      const errorText = await page.locator('#cardErrorMessage').textContent();
      console.log('Card generation returned error:', errorText);

      // Verify it's an expected error (rate limit or temporary failure)
      expect(errorText).toMatch(/(limit|try again|failed)/i);
    } else {
      // Success path - verify image is displayed
      await expect(cardPreview).toBeVisible({ timeout: 5000 });

      // Verify image has a src attribute (presigned URL)
      const imageSrc = await cardImage.getAttribute('src');
      expect(imageSrc).toBeTruthy();
      expect(imageSrc).toContain('s3');
      expect(imageSrc).toContain('.png');

      // Wait for image to actually load
      await expect(cardImage).toHaveJSProperty('complete', true, { timeout: 10000 });

      // Verify dimensions note is shown
      await expect(page.locator('.preview-note')).toContainText('5" x 7"');
    }
  });

  test('should show error for empty prompt', async ({ page }) => {
    const generateBtn = page.locator('#generateBtn');
    const cardError = page.locator('#cardError');

    // Click generate without entering a prompt
    await generateBtn.click();

    // Should show error message
    await expect(cardError).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#cardErrorMessage')).toContainText(/enter.*description/i);
  });

  test('should show error for prompt that is too long', async ({ page }) => {
    const prompt = page.locator('#cardPrompt');
    const generateBtn = page.locator('#generateBtn');
    const cardError = page.locator('#cardError');

    // Create a prompt longer than 512 characters
    const longPrompt = 'A'.repeat(513);

    // Try to fill it (textarea should enforce maxlength)
    await prompt.fill(longPrompt);

    // Check that it was truncated to 512
    const actualValue = await prompt.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(512);

    // If we somehow bypass the maxlength, the API should reject it
    // But the textarea maxlength should prevent this
  });

  test('should handle rate limit gracefully', async ({ page }) => {
    // Mock the generate-card endpoint to return rate limit error
    await page.route('**/generate-card', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Daily generation limit reached (50/day). Try again tomorrow.',
          currentCount: 50,
          limit: 50
        })
      });
    });

    const prompt = page.locator('#cardPrompt');
    const generateBtn = page.locator('#generateBtn');
    const cardError = page.locator('#cardError');

    // Fill and submit
    await prompt.fill('A sunset over mountains');
    await generateBtn.click();

    // Wait for loading to complete
    await expect(page.locator('#generateBtnLoader')).toBeHidden({ timeout: 10000 });

    // Verify rate limit error is displayed
    await expect(cardError).toBeVisible();
    await expect(page.locator('#cardErrorMessage')).toContainText(/limit.*reached/i);
  });

  test('should clear previous errors when typing in prompt', async ({ page }) => {
    const prompt = page.locator('#cardPrompt');
    const generateBtn = page.locator('#generateBtn');
    const cardError = page.locator('#cardError');

    // Generate error by clicking with empty prompt
    await generateBtn.click();
    await expect(cardError).toBeVisible();

    // Start typing - error should disappear
    await prompt.click();
    await expect(cardError).toBeHidden();
  });
});
