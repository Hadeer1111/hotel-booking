import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke test for the booking flow. This is intentionally light
 * because the headline correctness test (parallel double-book conflict) lives
 * in apps/api/test/bookings.concurrency.e2e-spec.ts where it can hit the DB
 * directly without spinning up a browser.
 *
 * The test only runs against a fully-stack environment (RUN_PLAYWRIGHT=1) so
 * `pnpm web e2e` in CI doesn't try to drive a browser when no servers exist.
 */
test.skip(!process.env.RUN_PLAYWRIGHT, 'set RUN_PLAYWRIGHT=1 with both web+api running');

test('happy path: browse → register → book a room', async ({ page }) => {
  const email = `e2e-${Date.now()}@x.io`;

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/book hotels/i);

  await page.getByRole('link', { name: /create an account/i }).click();
  await page.getByLabel('Name').fill('Playwright User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: /create account/i }).click();

  await page.waitForURL((url) => url.pathname.startsWith('/hotels'));
  await page.getByRole('link', { name: /grand|hotel/i }).first().click();

  await page.getByRole('button', { name: /book now/i }).first().click();
  await page.waitForURL(/\/bookings\//);
  await expect(page.getByRole('heading', { name: 'Booking' })).toBeVisible();
});
