// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Frontend Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display the form correctly', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Multiply by 3 Service/);

    // Verify form elements are visible
    await expect(page.locator('#numberInput')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Multiply by 3');
  });

  test('should successfully submit form with mocked API response', async ({ page }) => {
    // Mock the API endpoint
    await page.route('**/multiply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          input: 5,
          result: 15
        })
      });
    });

    // Fill in the number input
    await page.locator('#numberInput').fill('5');

    // Click the submit button with mouse
    await page.locator('button[type="submit"]').click();

    // Wait for loading spinner to disappear
    await expect(page.locator('#btnLoader')).toBeHidden();

    // Verify the result is displayed
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#result')).toContainText('Result: 15');
    await expect(page.locator('#result')).toContainText('5 × 3 = 15');
  });

  test('should handle different numeric inputs correctly', async ({ page }) => {
    const testCases = [
      { input: '10', expectedResult: '30' },
      { input: '0', expectedResult: '0' },
      { input: '-5', expectedResult: '-15' },
      { input: '3.5', expectedResult: '10.5' },
    ];

    for (const testCase of testCases) {
      // Mock the API endpoint with dynamic response
      await page.route('**/multiply', async (route) => {
        const requestBody = route.request().postDataJSON();
        const result = requestBody.number * 3;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            input: requestBody.number,
            result: result
          })
        });
      });

      // Fill and submit
      await page.locator('#numberInput').fill(testCase.input);
      await page.locator('button[type="submit"]').click();

      // Wait for loading to complete
      await expect(page.locator('#btnLoader')).toBeHidden();

      // Verify result
      await expect(page.locator('#result')).toBeVisible();
      await expect(page.locator('#result')).toContainText(`Result: ${testCase.expectedResult}`);

      // Reload page for next test
      if (testCase !== testCases[testCases.length - 1]) {
        await page.reload();
      }
    }
  });

  test('should show loading state during API call', async ({ page }) => {
    // Mock API with delay
    await page.route('**/multiply', async (route) => {
      // Add 2000ms delay to simulate network latency and ensure we can catch the loading state
      await new Promise(resolve => setTimeout(resolve, 2000));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          input: 7,
          result: 21
        })
      });
    });

    // Fill and submit
    await page.locator('#numberInput').fill('7');

    const submitButton = page.locator('button[type="submit"]');

    // Click and immediately check for loading state (before the 2s delay completes)
    await submitButton.click();

    // Verify loading state is shown (should be visible immediately after click)
    await expect(page.locator('#btnLoader')).toBeVisible({ timeout: 1000 });
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('#numberInput')).toBeDisabled();

    // Wait for loading to complete
    await expect(page.locator('#btnLoader')).toBeHidden({ timeout: 5000 });

    // Verify form is re-enabled
    await expect(submitButton).toBeEnabled();
    await expect(page.locator('#numberInput')).toBeEnabled();
  });

  test('should display error message on network failure', async ({ page }) => {
    // Mock API to return network error
    await page.route('**/multiply', async (route) => {
      await route.abort('failed');
    });

    // Fill and submit
    await page.locator('#numberInput').fill('5');
    await page.locator('button[type="submit"]').click();

    // Wait for loading to complete
    await expect(page.locator('#btnLoader')).toBeHidden();

    // Verify error message is displayed
    await expect(page.locator('#error')).toBeVisible();
    // Different browsers show different error messages for network failures
    const errorText = await page.locator('#error').textContent();
    expect(errorText).toMatch(/(Network error|Load failed)/);
  });

  test('should display error message on API error response', async ({ page }) => {
    // Mock API to return error
    await page.route('**/multiply', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid input provided'
        })
      });
    });

    // Fill and submit with a valid number that the API will reject
    await page.locator('#numberInput').fill('999');
    await page.locator('button[type="submit"]').click();

    // Wait for loading to complete
    await expect(page.locator('#btnLoader')).toBeHidden();

    // Verify error message is displayed
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error')).toContainText('Invalid input');
  });

  test('should handle rate limit error (429)', async ({ page }) => {
    // Mock API to return rate limit error
    await page.route('**/multiply', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.'
        })
      });
    });

    // Fill and submit
    await page.locator('#numberInput').fill('5');
    await page.locator('button[type="submit"]').click();

    // Wait for loading to complete
    await expect(page.locator('.spinner')).toBeHidden();

    // Verify rate limit error message is displayed
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#error')).toContainText('Rate limit exceeded');
  });

  test('should clear previous results when submitting new calculation', async ({ page }) => {
    // Mock first API call
    await page.route('**/multiply', async (route) => {
      const requestBody = route.request().postDataJSON();
      const result = requestBody.number * 3;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          input: requestBody.number,
          result: result
        })
      });
    });

    // First submission
    await page.locator('#numberInput').fill('5');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.spinner')).toBeHidden();
    await expect(page.locator('#result')).toContainText('Result: 15');

    // Second submission
    await page.locator('#numberInput').fill('10');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.spinner')).toBeHidden();

    // Verify new result is shown (old result should be replaced)
    await expect(page.locator('#result')).toContainText('Result: 30');
    await expect(page.locator('#result')).not.toContainText('Result: 15');
  });

  test('should validate required field', async ({ page }) => {
    // Try to submit without filling the field
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // HTML5 validation should prevent submission
    // The form should not make an API call
    const numberInput = page.locator('#numberInput');

    // Check if the input has validation error
    const validationMessage = await numberInput.evaluate((el) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});
