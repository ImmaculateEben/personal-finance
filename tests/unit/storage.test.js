const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    }
  };
}

function loadBrowserScripts() {
  const localStorage = createMemoryStorage();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Intl,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout,
    localStorage,
    crypto: webcrypto,
    btoa: (binary) => Buffer.from(binary, 'binary').toString('base64'),
    atob: (base64) => Buffer.from(base64, 'base64').toString('binary'),
    window: null,
    document: { documentElement: {} },
    navigator: {}
  };

  context.window = context;
  vm.createContext(context);

  for (const file of ['js/utils.js', 'js/storage.js']) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return {
    context,
    Storage: context.Storage || context.window.Storage,
    localStorage
  };
}

test('stores budgets per month and year separately', () => {
  const { Storage } = loadBrowserScripts();

  Storage.setSelectedYear(2026);
  Storage.setSelectedMonth(0);
  Storage.ensureBudgetPeriod();

  const januaryIncome = Storage.getBudgetCategoriesByType('income')[0];
  assert.ok(januaryIncome, 'expected a default income category');
  assert.equal(Storage.updateBudgetCategory(januaryIncome.id, 'planned', 5000), true);
  assert.equal(Storage.setBudgetNotes('January note'), true);

  Storage.setSelectedMonth(1);
  Storage.ensureBudgetPeriod();

  const febIncome = Storage.getBudgetCategoriesByType('income')[0];
  assert.ok(febIncome);
  assert.equal(febIncome.planned, 0);
  assert.equal(Storage.getBudgetNotes(), '');

  Storage.setSelectedMonth(0);
  const januaryIncomeAgain = Storage.getBudgetCategoriesByType('income')[0];
  assert.equal(januaryIncomeAgain.planned, 5000);
  assert.equal(Storage.getBudgetNotes(), 'January note');
});

test('importData normalizes invalid preferences and budget values', () => {
  const { Storage } = loadBrowserScripts();

  const badBackup = {
    preferences: {
      currency: 'XXX',
      selectedMonth: 99,
      selectedYear: 3000
    },
    budgets: {
      periods: {
        '2026-02': {
          notes: '<script>alert(1)</script>',
          categories: [
            {
              id: 'evil',
              name: '  <img src=x onerror=alert(1)>  ',
              type: 'variable',
              color: 'red',
              planned: -100,
              actual: 'not-a-number'
            }
          ]
        }
      }
    }
  };

  const result = Storage.importData(JSON.stringify(badBackup));
  assert.equal(result.success, true);

  assert.equal(Storage.getCurrency(), 'USD');
  assert.equal(Storage.getSelectedMonth() >= 0 && Storage.getSelectedMonth() <= 11, true);

  const importedBudget = Storage.getBudget(1, 2026);
  assert.ok(importedBudget.categories.length >= 1);
  assert.equal(importedBudget.categories[0].planned, 0);
  assert.equal(importedBudget.categories[0].actual, 0);
  assert.equal(importedBudget.categories[0].color.startsWith('#'), true);
  assert.equal(typeof importedBudget.categories[0].name, 'string');
  assert.equal(importedBudget.categories[0].name.length > 0, true);
  assert.equal(importedBudget.categories[0].name.length <= 40, true);
});

test('transaction normalization preserves budgetCategoryId and budgetType', () => {
  const { Storage } = loadBrowserScripts();

  const added = Storage.addTransaction({
    id: 'txn-1',
    amount: 250,
    type: 'expense',
    category: 'Groceries',
    description: 'Test',
    budgetCategoryId: 'var-1',
    budgetType: 'variable',
    date: '2026-02-10'
  });

  assert.equal(added, true);
  const transactions = Storage.getTransactions();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].budgetCategoryId, 'var-1');
  assert.equal(transactions[0].budgetType, 'variable');
});

test('encrypted backup helpers round-trip and reject wrong passphrase', async () => {
  const { context, Storage } = loadBrowserScripts();
  const plainJson = Storage.exportData();

  const encrypted = await context.encryptBackupJson(plainJson, 'test-passphrase');
  assert.equal(encrypted.encryptedBackup, true);
  assert.equal(typeof encrypted.payload, 'string');

  const decrypted = await context.decryptBackupJson(encrypted, 'test-passphrase');
  assert.equal(decrypted, plainJson);

  await assert.rejects(
    context.decryptBackupJson(encrypted, 'wrong-passphrase'),
    /decrypt backup|passphrase/i
  );
});
