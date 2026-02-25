const { test, expect } = require('@playwright/test');

test.describe('Personal Finance Dashboard smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('loads dashboard and supports basic ledger entry', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Finance Dashboard/i })).toBeVisible();
    await expect(page.locator('#monthSelector')).toBeVisible();
    await expect(page.locator('#yearSelector')).toBeVisible();
    await expect(page.locator('#exportDataBtn')).toBeVisible();

    await expect(page.locator('#transactionForm')).toBeVisible();
    await expect(page.locator('#transactionCategory')).toBeEnabled();

    await page.fill('#transactionAmount', '125.50');
    await page.fill('#transactionDescription', 'Smoke Test Purchase');
    await page.click('#transactionForm .ledger-submit-btn');

    await expect(page.locator('#ledgerTransactionCount')).toHaveText('1');
    await expect(page.locator('#transactionsList .transaction-item')).toHaveCount(1);
    await expect(page.locator('#transactionsList')).toContainText('Smoke Test Purchase');
  });

  test('encryption controls toggle passphrase field', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('#backupEncryptToggle');
    const input = page.locator('#backupPassphrase');

    await expect(input).toBeDisabled();
    await toggle.check();
    await expect(input).toBeEnabled();
    await toggle.uncheck();
    await expect(input).toBeDisabled();
  });
});
