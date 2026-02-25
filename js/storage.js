// localStorage Management Module

const Storage = {
    // Keys
    TRANSACTIONS_KEY: 'finance_transactions',
    PREFERENCES_KEY: 'finance_preferences',
    CATEGORIES_KEY: 'finance_categories',
    BUDGETS_KEY: 'finance_budgets_v2',
    LEGACY_BUDGET_KEY: 'finance_budget',
    STORAGE_VERSION: 2,
    MAX_BUDGET_ITEMS_PER_PERIOD: 200,

    // Default preferences
    defaultPreferences: {
        theme: 'light',
        currency: 'USD',
        selectedMonth: new Date().getMonth(),
        selectedYear: new Date().getFullYear()
    },

    // Budget category types
    categoryTypes: {
        VARIABLE: 'variable',
        FIXED: 'fixed',
        SAVINGS: 'savings',
        DEBT: 'debt',
        INCOME: 'income'
    },

    // Default budget categories with types
    defaultBudgetCategories: [
        { id: 'inc-1', name: 'Salary', type: 'income', color: '#22c55e', planned: 0, actual: 0 },
        { id: 'inc-2', name: 'Freelance', type: 'income', color: '#84cc16', planned: 0, actual: 0 },
        { id: 'inc-3', name: 'Investments', type: 'income', color: '#06b6d4', planned: 0, actual: 0 },

        { id: 'var-1', name: 'Groceries', type: 'variable', color: '#f59e0b', planned: 0, actual: 0 },
        { id: 'var-2', name: 'Dining Out', type: 'variable', color: '#ec4899', planned: 0, actual: 0 },
        { id: 'var-3', name: 'Shopping', type: 'variable', color: '#f97316', planned: 0, actual: 0 },
        { id: 'var-4', name: 'Entertainment', type: 'variable', color: '#8b5cf6', planned: 0, actual: 0 },

        { id: 'fix-1', name: 'Rent', type: 'fixed', color: '#ef4444', planned: 0, actual: 0 },
        { id: 'fix-2', name: 'Utilities', type: 'fixed', color: '#06b6d4', planned: 0, actual: 0 },
        { id: 'fix-3', name: 'Subscriptions', type: 'fixed', color: '#8b5cf6', planned: 0, actual: 0 },
        { id: 'fix-4', name: 'Transportation', type: 'fixed', color: '#3b82f6', planned: 0, actual: 0 },
        { id: 'fix-5', name: 'Insurance', type: 'fixed', color: '#14b8a6', planned: 0, actual: 0 },

        { id: 'sav-1', name: 'Emergency Fund', type: 'savings', color: '#22c55e', planned: 0, actual: 0 },
        { id: 'sav-2', name: 'Holidays', type: 'savings', color: '#ec4899', planned: 0, actual: 0 },
        { id: 'sav-3', name: 'Retirement', type: 'savings', color: '#06b6d4', planned: 0, actual: 0 },
        { id: 'sav-4', name: 'Other Savings', type: 'savings', color: '#84cc16', planned: 0, actual: 0 },

        { id: 'debt-1', name: 'Car Lease', type: 'debt', color: '#ef4444', planned: 0, actual: 0 },
        { id: 'debt-2', name: 'Personal Loan', type: 'debt', color: '#f97316', planned: 0, actual: 0 },
        { id: 'debt-3', name: 'Credit Card', type: 'debt', color: '#8b5cf6', planned: 0, actual: 0 },
        { id: 'debt-4', name: 'Student Loan', type: 'debt', color: '#3b82f6', planned: 0, actual: 0 }
    ],

    // Available currencies
    currencies: [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: 'EUR', name: 'Euro' },
        { code: 'GBP', symbol: 'GBP', name: 'British Pound' },
        { code: 'JPY', symbol: 'JPY', name: 'Japanese Yen' },
        { code: 'CNY', symbol: 'CNY', name: 'Chinese Yuan' },
        { code: 'INR', symbol: 'INR', name: 'Indian Rupee' },
        { code: 'NGN', symbol: 'NGN', name: 'Nigerian Naira' },
        { code: 'BRL', symbol: 'BRL', name: 'Brazilian Real' },
        { code: 'KRW', symbol: 'KRW', name: 'South Korean Won' },
        { code: 'AUD', symbol: 'AUD', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'CAD', name: 'Canadian Dollar' },
        { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
        { code: 'MXN', symbol: 'MXN', name: 'Mexican Peso' },
        { code: 'ZAR', symbol: 'ZAR', name: 'South African Rand' }
    ],

    // Default categories (kept for transaction compatibility)
    defaultCategories: [
        { id: 'cat-1', name: 'Salary', type: 'income', color: '#22c55e' },
        { id: 'cat-2', name: 'Freelance', type: 'income', color: '#84cc16' },
        { id: 'cat-3', name: 'Investments', type: 'income', color: '#06b6d4' },
        { id: 'cat-4', name: 'Food', type: 'expense', color: '#f59e0b' },
        { id: 'cat-5', name: 'Rent', type: 'expense', color: '#ef4444' },
        { id: 'cat-6', name: 'Transportation', type: 'expense', color: '#3b82f6' },
        { id: 'cat-7', name: 'Utilities', type: 'expense', color: '#8b5cf6' },
        { id: 'cat-8', name: 'Entertainment', type: 'expense', color: '#ec4899' },
        { id: 'cat-9', name: 'Shopping', type: 'expense', color: '#f97316' },
        { id: 'cat-10', name: 'Healthcare', type: 'expense', color: '#14b8a6' },
        { id: 'cat-11', name: 'Other', type: 'expense', color: '#64748b' }
    ],

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage (' + key + '):', error);
            return null;
        }
    },

    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage (' + key + '):', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage (' + key + '):', error);
            return false;
        }
    },

    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    _clone(value) {
        return JSON.parse(JSON.stringify(value));
    },

    _normalizeCurrency(code) {
        const safeCode = String(code || '').toUpperCase();
        return this.currencies.some(c => c.code === safeCode) ? safeCode : this.defaultPreferences.currency;
    },

    _normalizeMonth(month) {
        const parsed = parseInt(month, 10);
        if (!Number.isInteger(parsed)) return new Date().getMonth();
        return Math.min(11, Math.max(0, parsed));
    },

    _normalizeYear(year) {
        const parsed = parseInt(year, 10);
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(parsed)) return currentYear;
        return Math.min(currentYear + 25, Math.max(currentYear - 25, parsed));
    },

    _normalizeCategoryName(value, fallback) {
        const text = sanitizeText(value, { maxLength: 40, fallback: fallback || 'Item' });
        return toTitleCase(text);
    },

    _normalizeBudgetType(value, fallback) {
        const validTypes = ['income', 'variable', 'fixed', 'savings', 'debt'];
        if (validTypes.includes(value)) return value;
        return fallback === undefined ? 'variable' : fallback;
    },

    _defaultColorForType(type) {
        const palette = {
            income: '#22c55e',
            variable: '#ec4899',
            fixed: '#ef4444',
            savings: '#3b82f6',
            debt: '#8b5cf6'
        };
        return palette[type] || '#4299e1';
    },

    _normalizeBudgetCategory(raw, index = 0) {
        const type = this._normalizeBudgetType(raw && raw.type, 'variable');
        return {
            id: sanitizeText(raw && raw.id, { maxLength: 64, fallback: generateId() }),
            name: this._normalizeCategoryName(raw && raw.name, 'Item ' + (index + 1)),
            type: type,
            color: normalizeHexColor(raw && raw.color, this._defaultColorForType(type)),
            planned: toNumber(raw && raw.planned, { fallback: 0, min: 0, max: 1000000000 }),
            actual: toNumber(raw && raw.actual, { fallback: 0, min: 0, max: 1000000000 })
        };
    },

    _createDefaultBudget() {
        return {
            monthlyIncome: 0,
            notes: '',
            updatedAt: null,
            categories: this.defaultBudgetCategories.map((cat, index) => this._normalizeBudgetCategory(cat, index))
        };
    },

    _normalizeBudget(budget) {
        const normalized = this._createDefaultBudget();
        if (!budget || typeof budget !== 'object') {
            return normalized;
        }

        normalized.monthlyIncome = toNumber(budget.monthlyIncome, { fallback: 0, min: 0, max: 1000000000 });
        normalized.notes = sanitizeText(budget.notes, { maxLength: 1000, fallback: '', trim: false });
        normalized.updatedAt = typeof budget.updatedAt === 'string' ? budget.updatedAt : null;

        if (Array.isArray(budget.categories) && budget.categories.length) {
            const dedupe = new Set();
            const categories = [];
            budget.categories.slice(0, this.MAX_BUDGET_ITEMS_PER_PERIOD).forEach((cat, index) => {
                const normalizedCat = this._normalizeBudgetCategory(cat, index);
                if (dedupe.has(normalizedCat.id)) {
                    normalizedCat.id = generateId();
                }
                dedupe.add(normalizedCat.id);
                categories.push(normalizedCat);
            });
            normalized.categories = categories.length ? categories : normalized.categories;
        }

        return normalized;
    },

    _normalizeBudgetsStore(raw) {
        const store = {
            version: this.STORAGE_VERSION,
            periods: {}
        };

        if (!raw || typeof raw !== 'object') {
            return store;
        }

        const rawPeriods = raw.periods && typeof raw.periods === 'object' ? raw.periods : {};
        Object.keys(rawPeriods).forEach(periodKey => {
            if (/^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey)) {
                store.periods[periodKey] = this._normalizeBudget(rawPeriods[periodKey]);
            }
        });

        return store;
    },

    _saveBudgetsStore(store) {
        const normalizedStore = this._normalizeBudgetsStore(store);
        return this.set(this.BUDGETS_KEY, normalizedStore);
    },

    _migrateLegacyBudgetIfNeeded() {
        const existing = this.get(this.BUDGETS_KEY);
        if (existing) {
            return this._normalizeBudgetsStore(existing);
        }

        const legacyBudget = this.get(this.LEGACY_BUDGET_KEY);
        const store = { version: this.STORAGE_VERSION, periods: {} };

        if (legacyBudget && typeof legacyBudget === 'object') {
            const month = this.getSelectedMonth();
            const year = this.getSelectedYear();
            const periodKey = this.getPeriodKey(month, year);
            store.periods[periodKey] = this._normalizeBudget(legacyBudget);
            this._saveBudgetsStore(store);
            return store;
        }

        this._saveBudgetsStore(store);
        return store;
    },

    getBudgetsStore() {
        return this._migrateLegacyBudgetIfNeeded();
    },

    getPeriodKey(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const safeMonth = this._normalizeMonth(month);
        const safeYear = this._normalizeYear(year);
        return String(safeYear) + '-' + String(safeMonth + 1).padStart(2, '0');
    },

    listBudgetPeriods() {
        return Object.keys(this.getBudgetsStore().periods).sort();
    },

    getAvailableBudgetYears() {
        const currentYear = new Date().getFullYear();
        const years = new Set([currentYear - 1, currentYear, currentYear + 1, this.getSelectedYear()]);

        this.listBudgetPeriods().forEach(key => {
            const year = parseInt(key.slice(0, 4), 10);
            if (Number.isInteger(year)) {
                years.add(year);
            }
        });

        return Array.from(years).sort((a, b) => a - b);
    },

    ensureBudgetPeriod(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const periodKey = this.getPeriodKey(month, year);
        const store = this.getBudgetsStore();
        if (!store.periods[periodKey]) {
            store.periods[periodKey] = this._createDefaultBudget();
            this._saveBudgetsStore(store);
        }
        return this._normalizeBudget(store.periods[periodKey]);
    },

    getBudget(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const periodKey = this.getPeriodKey(month, year);
        const store = this.getBudgetsStore();
        if (!store.periods[periodKey]) {
            return this._createDefaultBudget();
        }
        return this._normalizeBudget(store.periods[periodKey]);
    },

    saveBudget(budget, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const periodKey = this.getPeriodKey(month, year);
        const store = this.getBudgetsStore();
        const normalizedBudget = this._normalizeBudget(budget);
        normalizedBudget.updatedAt = new Date().toISOString();
        store.periods[periodKey] = normalizedBudget;
        return this._saveBudgetsStore(store);
    },

    resetBudgetPeriod(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const freshBudget = this._createDefaultBudget();
        freshBudget.updatedAt = new Date().toISOString();
        return this.saveBudget(freshBudget, month, year);
    },

    copyBudgetPeriod(sourceMonth, sourceYear, targetMonth = this.getSelectedMonth(), targetYear = this.getSelectedYear(), options = {}) {
        const { includeNotes = false } = options;
        const sourceBudget = this.getBudget(sourceMonth, sourceYear);
        const targetBudget = this._normalizeBudget(sourceBudget);

        if (!includeNotes) {
            targetBudget.notes = '';
        }

        targetBudget.categories = targetBudget.categories.map(cat => ({ ...cat, id: generateId() }));
        targetBudget.updatedAt = new Date().toISOString();

        return this.saveBudget(targetBudget, targetMonth, targetYear);
    },

    getBudgetNotes(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        return this.getBudget(month, year).notes || '';
    },

    setBudgetNotes(notes, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const budget = this.getBudget(month, year);
        budget.notes = sanitizeText(notes, { maxLength: 1000, fallback: '', trim: false });
        return this.saveBudget(budget, month, year);
    },

    getBudgetCategories(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        return this.getBudget(month, year).categories || [];
    },

    getBudgetCategoriesByType(type, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const safeType = this._normalizeBudgetType(type, null);
        return this.getBudgetCategories(month, year).filter(c => c.type === safeType);
    },

    addBudgetCategory(category, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const budget = this.getBudget(month, year);
        if (budget.categories.length >= this.MAX_BUDGET_ITEMS_PER_PERIOD) {
            return false;
        }

        const normalizedCategory = this._normalizeBudgetCategory(category, budget.categories.length);
        if (budget.categories.some(c => c.id === normalizedCategory.id)) {
            normalizedCategory.id = generateId();
        }

        budget.categories.push(normalizedCategory);
        return this.saveBudget(budget, month, year);
    },

    updateBudgetCategory(categoryId, field, value, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const safeId = sanitizeText(categoryId, { maxLength: 64, fallback: '' });
        if (!safeId) return false;

        const budget = this.getBudget(month, year);
        const category = budget.categories.find(c => c.id === safeId);
        if (!category) return false;

        if (field === 'planned' || field === 'actual') {
            category[field] = toNumber(value, { fallback: 0, min: 0, max: 1000000000 });
        } else if (field === 'name') {
            category.name = this._normalizeCategoryName(value, category.name);
        } else if (field === 'color') {
            category.color = normalizeHexColor(value, category.color);
        } else {
            return false;
        }

        return this.saveBudget(budget, month, year);
    },

    deleteBudgetCategory(categoryId, month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const safeId = sanitizeText(categoryId, { maxLength: 64, fallback: '' });
        if (!safeId) return false;

        const budget = this.getBudget(month, year);
        const originalLength = budget.categories.length;
        budget.categories = budget.categories.filter(c => c.id !== safeId);
        if (budget.categories.length === originalLength) return false;
        return this.saveBudget(budget, month, year);
    },

    getBudgetMetrics(month = this.getSelectedMonth(), year = this.getSelectedYear()) {
        const categories = this.getBudgetCategories(month, year);
        const totals = {
            incomePlanned: 0,
            incomeActual: 0,
            variablePlanned: 0,
            variableActual: 0,
            fixedPlanned: 0,
            fixedActual: 0,
            savingsPlanned: 0,
            savingsActual: 0,
            debtPlanned: 0,
            debtActual: 0
        };

        categories.forEach(cat => {
            const planned = toNumber(cat.planned, { fallback: 0, min: 0 });
            const actual = toNumber(cat.actual, { fallback: 0, min: 0 });

            if (cat.type === 'income') {
                totals.incomePlanned += planned;
                totals.incomeActual += actual;
            }
            if (cat.type === 'variable') {
                totals.variablePlanned += planned;
                totals.variableActual += actual;
            }
            if (cat.type === 'fixed') {
                totals.fixedPlanned += planned;
                totals.fixedActual += actual;
            }
            if (cat.type === 'savings') {
                totals.savingsPlanned += planned;
                totals.savingsActual += actual;
            }
            if (cat.type === 'debt') {
                totals.debtPlanned += planned;
                totals.debtActual += actual;
            }
        });

        Object.keys(totals).forEach(key => {
            totals[key] = roundCurrency(totals[key]);
        });

        const plannedOutflow = roundCurrency(
            totals.variablePlanned + totals.fixedPlanned + totals.savingsPlanned + totals.debtPlanned
        );
        const actualOutflow = roundCurrency(
            totals.variableActual + totals.fixedActual + totals.savingsActual + totals.debtActual
        );

        const plannedBalance = roundCurrency(totals.incomePlanned - plannedOutflow);
        const actualBalance = roundCurrency(totals.incomePlanned - actualOutflow);

        return {
            ...totals,
            plannedOutflow,
            actualOutflow,
            plannedBalance,
            actualBalance,
            categoriesCount: categories.length,
            plannedUtilizationPercent: totals.incomePlanned > 0 ? roundCurrency((plannedOutflow / totals.incomePlanned) * 100) : 0,
            actualUtilizationPercent: totals.incomePlanned > 0 ? roundCurrency((actualOutflow / totals.incomePlanned) * 100) : 0
        };
    },

    // Compatibility aliases used by charts/UI legacy code
    getMonthlyIncome() {
        return this.getBudgetMetrics().incomePlanned;
    },

    setMonthlyIncome(income) {
        const budget = this.getBudget();
        budget.monthlyIncome = toNumber(income, { fallback: 0, min: 0, max: 1000000000 });
        return this.saveBudget(budget);
    },

    getTotalActual() {
        return this.getBudgetMetrics().actualOutflow;
    },

    getBudgetAllocation() {
        const m = this.getBudgetMetrics();
        return {
            variable: m.variableActual,
            fixed: m.fixedActual,
            savings: m.savingsActual,
            debt: m.debtActual
        };
    },

    getBudgetPlannedVsActual() {
        return this.getBudgetCategories().map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            planned: toNumber(cat.planned, { fallback: 0, min: 0 }),
            actual: toNumber(cat.actual, { fallback: 0, min: 0 }),
            color: normalizeHexColor(cat.color, this._defaultColorForType(cat.type))
        }));
    },

    // ==================== Transactions ====================

    _normalizeTransaction(raw) {
        if (!raw || typeof raw !== 'object') return null;

        const type = raw.type === 'income' ? 'income' : (raw.type === 'expense' ? 'expense' : null);
        const date = sanitizeText(raw.date, { maxLength: 10, fallback: '' });
        if (!type || !isValidDateInput(date)) return null;

        const amount = toNumber(raw.amount, { fallback: 0, min: 0.01, max: 1000000000 });
        if (amount <= 0) return null;

        const budgetCategoryId = sanitizeText(raw.budgetCategoryId, { maxLength: 64, fallback: '' });
        const budgetType = this._normalizeBudgetType(raw.budgetType, null);

        return {
            id: sanitizeText(raw.id, { maxLength: 64, fallback: generateId() }),
            amount: amount,
            type: type,
            category: toTitleCase(sanitizeText(raw.category, { maxLength: 40, fallback: 'Other' })),
            description: sanitizeText(raw.description, { maxLength: 120, fallback: 'Transaction' }),
            budgetCategoryId: budgetCategoryId || undefined,
            budgetType: budgetType || undefined,
            date: date,
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined
        };
    },

    getTransactions() {
        const raw = this.get(this.TRANSACTIONS_KEY);
        if (!Array.isArray(raw)) return [];

        const seen = new Set();
        const normalized = [];
        raw.forEach(txn => {
            const safeTxn = this._normalizeTransaction(txn);
            if (!safeTxn) return;
            if (seen.has(safeTxn.id)) {
                safeTxn.id = generateId();
            }
            seen.add(safeTxn.id);
            normalized.push(safeTxn);
        });

        return normalized;
    },

    saveTransactions(transactions) {
        if (!Array.isArray(transactions)) return false;
        const normalized = [];
        const seen = new Set();

        transactions.forEach(txn => {
            const safeTxn = this._normalizeTransaction(txn);
            if (!safeTxn) return;
            if (seen.has(safeTxn.id)) {
                safeTxn.id = generateId();
            }
            seen.add(safeTxn.id);
            normalized.push(safeTxn);
        });

        return this.set(this.TRANSACTIONS_KEY, normalized);
    },

    addTransaction(transaction) {
        const safeTxn = this._normalizeTransaction(transaction);
        if (!safeTxn) return false;
        const transactions = this.getTransactions();
        transactions.unshift(safeTxn);
        return this.saveTransactions(transactions);
    },

    updateTransaction(id, updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return false;

        const candidate = {
            ...transactions[index],
            ...updatedTransaction,
            id: transactions[index].id,
            updatedAt: new Date().toISOString()
        };
        const normalized = this._normalizeTransaction(candidate);
        if (!normalized) return false;
        normalized.id = transactions[index].id;
        transactions[index] = normalized;
        return this.saveTransactions(transactions);
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        if (filtered.length === transactions.length) return false;
        return this.saveTransactions(filtered);
    },

    clearTransactions() {
        return this.remove(this.TRANSACTIONS_KEY);
    },

    // ==================== Preferences ====================

    getPreferences() {
        const raw = this.get(this.PREFERENCES_KEY);
        const prefs = {
            ...this.defaultPreferences,
            ...(raw && typeof raw === 'object' ? raw : {})
        };

        return {
            theme: prefs.theme === 'dark' ? 'dark' : 'light',
            currency: this._normalizeCurrency(prefs.currency),
            selectedMonth: this._normalizeMonth(prefs.selectedMonth),
            selectedYear: this._normalizeYear(prefs.selectedYear)
        };
    },

    savePreferences(preferences) {
        const current = this.getPreferences();
        const merged = {
            ...current,
            ...(preferences && typeof preferences === 'object' ? preferences : {})
        };

        const normalized = {
            theme: merged.theme === 'dark' ? 'dark' : 'light',
            currency: this._normalizeCurrency(merged.currency),
            selectedMonth: this._normalizeMonth(merged.selectedMonth),
            selectedYear: this._normalizeYear(merged.selectedYear)
        };

        return this.set(this.PREFERENCES_KEY, normalized);
    },

    getTheme() {
        return this.getPreferences().theme;
    },

    setTheme(theme) {
        return this.savePreferences({ theme: theme === 'dark' ? 'dark' : 'light' });
    },

    getCurrency() {
        return this.getPreferences().currency;
    },

    getCurrencyInfo(code) {
        return this.currencies.find(c => c.code === this._normalizeCurrency(code)) || this.currencies[0];
    },

    setCurrency(currency) {
        return this.savePreferences({ currency: this._normalizeCurrency(currency) });
    },

    getCurrencies() {
        return this.currencies.slice();
    },

    getSelectedMonth() {
        return this.getPreferences().selectedMonth;
    },

    setSelectedMonth(month) {
        return this.savePreferences({ selectedMonth: this._normalizeMonth(month) });
    },

    getSelectedYear() {
        return this.getPreferences().selectedYear;
    },

    setSelectedYear(year) {
        return this.savePreferences({ selectedYear: this._normalizeYear(year) });
    },

    // ==================== Categories ====================

    _normalizeTransactionCategory(raw, index = 0) {
        const type = raw && raw.type === 'income' ? 'income' : 'expense';
        return {
            id: sanitizeText(raw && raw.id, { maxLength: 64, fallback: 'cat-' + (index + 1) }),
            name: toTitleCase(sanitizeText(raw && raw.name, { maxLength: 40, fallback: 'Category ' + (index + 1) })),
            type: type,
            color: normalizeHexColor(raw && raw.color, type === 'income' ? '#22c55e' : '#64748b')
        };
    },

    getCategories() {
        const raw = this.get(this.CATEGORIES_KEY);
        if (!Array.isArray(raw)) {
            return this.defaultCategories.map((cat, index) => this._normalizeTransactionCategory(cat, index));
        }

        const seen = new Set();
        const categories = [];
        raw.forEach((cat, index) => {
            const normalized = this._normalizeTransactionCategory(cat, index);
            if (seen.has(normalized.id)) {
                normalized.id = generateId();
            }
            seen.add(normalized.id);
            categories.push(normalized);
        });

        return categories;
    },

    saveCategories(categories) {
        if (!Array.isArray(categories)) return false;
        const normalized = categories.map((cat, index) => this._normalizeTransactionCategory(cat, index));
        return this.set(this.CATEGORIES_KEY, normalized);
    },

    addCategory(category) {
        const categories = this.getCategories();
        const normalized = this._normalizeTransactionCategory(category, categories.length);
        if (categories.some(c => c.id === normalized.id)) {
            normalized.id = generateId();
        }
        categories.push(normalized);
        return this.saveCategories(categories);
    },

    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        if (filtered.length === categories.length) return false;
        return this.saveCategories(filtered);
    },

    getCategoriesByType(type) {
        return this.getCategories().filter(c => c.type === type);
    },

    getCategoryByName(name) {
        const safeName = sanitizeText(name, { maxLength: 40, fallback: '' }).toLowerCase();
        if (!safeName) return null;
        return this.getCategories().find(c => c.name.toLowerCase() === safeName) || null;
    },

    // ==================== Utility ====================

    clearAll() {
        this.clearTransactions();
        this.remove(this.PREFERENCES_KEY);
        this.remove(this.CATEGORIES_KEY);
        this.remove(this.BUDGETS_KEY);
        this.remove(this.LEGACY_BUDGET_KEY);
    },

    exportData() {
        return JSON.stringify({
            schemaVersion: this.STORAGE_VERSION,
            app: 'personal-finance-dashboard',
            exportedAt: new Date().toISOString(),
            transactions: this.getTransactions(),
            preferences: this.getPreferences(),
            categories: this.getCategories(),
            budgets: this.getBudgetsStore()
        }, null, 2);
    },

    importData(json) {
        try {
            const parsed = JSON.parse(json);
            if (!parsed || typeof parsed !== 'object') {
                return { success: false, message: 'Invalid backup format' };
            }

            if (Array.isArray(parsed.transactions)) {
                this.saveTransactions(parsed.transactions);
            }

            if (Array.isArray(parsed.categories)) {
                this.saveCategories(parsed.categories);
            }

            if (parsed.preferences && typeof parsed.preferences === 'object') {
                this.savePreferences(parsed.preferences);
            }

            if (parsed.budgets && typeof parsed.budgets === 'object') {
                this._saveBudgetsStore(parsed.budgets);
            } else if (parsed.budget && typeof parsed.budget === 'object') {
                // Support legacy export shape
                const store = { version: this.STORAGE_VERSION, periods: {} };
                store.periods[this.getPeriodKey()] = this._normalizeBudget(parsed.budget);
                this._saveBudgetsStore(store);
            }

            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, message: 'Invalid JSON file' };
        }
    }
};

// Export for use in other modules
window.Storage = Storage;

