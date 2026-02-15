// localStorage Management Module

const Storage = {
    // Keys
    TRANSACTIONS_KEY: 'finance_transactions',
    PREFERENCES_KEY: 'finance_preferences',
    CATEGORIES_KEY: 'finance_categories',
    BUDGET_KEY: 'finance_budget', // New key for budget data
    
    // Default preferences
    defaultPreferences: {
        theme: 'light',
        currency: 'USD',
        selectedMonth: new Date().getMonth()
    },
    
    // Budget category types
    categoryTypes: {
        VARIABLE: 'variable',      // Fluctuating costs (Groceries, Dining, Shopping)
        FIXED: 'fixed',           // Fixed bills (Rent, Utilities, Subscriptions)
        SAVINGS: 'savings',        // Savings/Investments
        DEBT: 'debt',             // Debt Repayment
        INCOME: 'income'
    },
    
    // Default budget categories with types
    defaultBudgetCategories: [
        // Income Sources
        { id: 'inc-1', name: 'Salary', type: 'income', color: '#22c55e', planned: 0 },
        { id: 'inc-2', name: 'Freelance', type: 'income', color: '#84cc16', planned: 0 },
        { id: 'inc-3', name: 'Investments', type: 'income', color: '#06b6d4', planned: 0 },
        
        // Variable Expenses
        { id: 'var-1', name: 'Groceries', type: 'variable', color: '#f59e0b', planned: 0 },
        { id: 'var-2', name: 'Dining Out', type: 'variable', color: '#ec4899', planned: 0 },
        { id: 'var-3', name: 'Shopping', type: 'variable', color: '#f97316', planned: 0 },
        { id: 'var-4', name: 'Entertainment', type: 'variable', color: '#8b5cf6', planned: 0 },
        
        // Fixed Expenses (Bills)
        { id: 'fix-1', name: 'Rent', type: 'fixed', color: '#ef4444', planned: 0 },
        { id: 'fix-2', name: 'Utilities', type: 'fixed', color: '#06b6d4', planned: 0 },
        { id: 'fix-3', name: 'Subscriptions', type: 'fixed', color: '#8b5cf6', planned: 0 },
        { id: 'fix-4', name: 'Transportation', type: 'fixed', color: '#3b82f6', planned: 0 },
        { id: 'fix-5', name: 'Insurance', type: 'fixed', color: '#14b8a6', planned: 0 },
        
        // Savings/Investments
        { id: 'sav-1', name: 'Emergency Fund', type: 'savings', color: '#22c55e', planned: 0 },
        { id: 'sav-2', name: 'Holidays', type: 'savings', color: '#ec4899', planned: 0 },
        { id: 'sav-3', name: 'Retirement', type: 'savings', color: '#06b6d4', planned: 0 },
        { id: 'sav-4', name: 'Other Savings', type: 'savings', color: '#84cc16', planned: 0 },
        
        // Debt Repayment
        { id: 'debt-1', name: 'Car Lease', type: 'debt', color: '#ef4444', planned: 0 },
        { id: 'debt-2', name: 'Personal Loan', type: 'debt', color: '#f97316', planned: 0 },
        { id: 'debt-3', name: 'Credit Card', type: 'debt', color: '#8b5cf6', planned: 0 },
        { id: 'debt-4', name: 'Student Loan', type: 'debt', color: '#3b82f6', planned: 0 }
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
    
    // Default categories
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
    
    /**
     * Get data from localStorage with error handling
     * @param {string} key - Storage key
     * @returns {*} Parsed data or null
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage (' + key + '):', error);
            return null;
        }
    },
    
    /**
     * Save data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     * @returns {boolean} Success status
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage (' + key + '):', error);
            return false;
        }
    },
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage (' + key + '):', error);
            return false;
        }
    },
    
    // ==================== Transactions ====================
    
    /**
     * Get all transactions
     * @returns {Array} Array of transactions
     */
    getTransactions() {
        const transactions = this.get(this.TRANSACTIONS_KEY);
        return transactions || [];
    },
    
    /**
     * Save all transactions
     * @param {Array} transactions - Array of transactions
     * @returns {boolean} Success status
     */
    saveTransactions(transactions) {
        return this.set(this.TRANSACTIONS_KEY, transactions);
    },
    
    /**
     * Add a single transaction
     * @param {object} transaction - Transaction to add
     * @returns {boolean} Success status
     */
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.unshift(transaction);
        return this.saveTransactions(transactions);
    },
    
    /**
     * Update a transaction
     * @param {string} id - Transaction ID
     * @param {object} updatedTransaction - Updated transaction data
     * @returns {boolean} Success status
     */
    updateTransaction(id, updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(function(t) { return t.id === id; });
        if (index === -1) return false;
        
        transactions[index] = Object.assign({}, transactions[index], updatedTransaction);
        return this.saveTransactions(transactions);
    },
    
    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     * @returns {boolean} Success status
     */
    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(function(t) { return t.id !== id; });
        if (filtered.length === transactions.length) return false;
        return this.saveTransactions(filtered);
    },
    
    /**
     * Clear all transactions
     * @returns {boolean} Success status
     */
    clearTransactions() {
        return this.remove(this.TRANSACTIONS_KEY);
    },
    
    // ==================== Preferences ====================
    
    /**
     * Get user preferences
     * @returns {object} User preferences
     */
    getPreferences() {
        const preferences = this.get(this.PREFERENCES_KEY);
        return preferences ? Object.assign({}, this.defaultPreferences, preferences) : this.defaultPreferences;
    },
    
    /**
     * Save user preferences
     * @param {object} preferences - Preferences to save
     * @returns {boolean} Success status
     */
    savePreferences(preferences) {
        const currentPrefs = this.getPreferences();
        return this.set(this.PREFERENCES_KEY, Object.assign({}, currentPrefs, preferences));
    },
    
    /**
     * Get current theme
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        return this.getPreferences().theme;
    },
    
    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     * @returns {boolean} Success status
     */
    setTheme(theme) {
        return this.savePreferences({ theme: theme });
    },
    
    /**
     * Get current currency
     * @returns {string} Currency code
     */
    getCurrency() {
        return this.getPreferences().currency;
    },
    
    /**
     * Get currency info
     * @param {string} code - Currency code
     * @returns {object} Currency info
     */
    getCurrencyInfo(code) {
        return this.currencies.find(function(c) { return c.code === code; }) || this.currencies[0];
    },
    
    /**
     * Set currency
     * @param {string} currency - Currency code
     * @returns {boolean} Success status
     */
    setCurrency(currency) {
        return this.savePreferences({ currency: currency });
    },
    
    /**
     * Get all available currencies
     * @returns {Array} Currencies array
     */
    getCurrencies() {
        return this.currencies;
    },
    
    /**
     * Get selected month
     * @returns {number} Month index (0-11)
     */
    getSelectedMonth() {
        return this.getPreferences().selectedMonth;
    },
    
    /**
     * Set selected month
     * @param {number} month - Month index (0-11)
     * @returns {boolean} Success status
     */
    setSelectedMonth(month) {
        return this.savePreferences({ selectedMonth: month });
    },
    
    // ==================== Categories ====================
    
    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    getCategories() {
        const categories = this.get(this.CATEGORIES_KEY);
        return categories || this.defaultCategories.slice();
    },
    
    /**
     * Save all categories
     * @param {Array} categories - Array of categories
     * @returns {boolean} Success status
     */
    saveCategories(categories) {
        return this.set(this.CATEGORIES_KEY, categories);
    },
    
    /**
     * Add a custom category
     * @param {object} category - Category to add
     * @returns {boolean} Success status
     */
    addCategory(category) {
        const categories = this.getCategories();
        categories.push(category);
        return this.saveCategories(categories);
    },
    
    /**
     * Delete a category
     * @param {string} id - Category ID
     * @returns {boolean} Success status
     */
    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(function(c) { return c.id !== id; });
        if (filtered.length === categories.length) return false;
        return this.saveCategories(filtered);
    },
    
    /**
     * Get categories by type
     * @param {string} type - 'income' or 'expense'
     * @returns {Array} Filtered categories
     */
    getCategoriesByType(type) {
        return this.getCategories().filter(function(c) { return c.type === type; });
    },
    
    /**
     * Get category by name
     * @param {string} name - Category name
     * @returns {object|null} Category or null
     */
    getCategoryByName(name) {
        return this.getCategories().find(function(c) { 
            return c.name.toLowerCase() === name.toLowerCase();
        });
    },
    
    // ==================== Utility ====================
    
    /**
     * Clear all app data
     */
    clearAll() {
        this.clearTransactions();
        this.remove(this.PREFERENCES_KEY);
        this.remove(this.CATEGORIES_KEY);
    },
    
    /**
     * Export all data as JSON
     * @returns {string} JSON string
     */
    exportData() {
        return JSON.stringify({
            transactions: this.getTransactions(),
            preferences: this.getPreferences(),
            categories: this.getCategories(),
            exportDate: new Date().toISOString()
        }, null, 2);
    },
    
    /**
     * Import data from JSON
     * @param {string} json - JSON string
     * @returns {object} Import result
     */
    importData(json) {
        try {
            const data = JSON.parse(json);
            
            if (data.transactions && Array.isArray(data.transactions)) {
                this.saveTransactions(data.transactions);
            }
            if (data.preferences && typeof data.preferences === 'object') {
                this.savePreferences(data.preferences);
            }
            if (data.categories && Array.isArray(data.categories)) {
                this.saveCategories(data.categories);
            }
            
            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, message: 'Invalid data format' };
        }
    },
    
    /**
     * Check if storage is available
     * @returns {boolean} True if available
     */
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
    
    // ==================== Budget Management ==================== //
    
    /**
     * Get budget data
     * @returns {object} Budget data with monthlyIncome and categories
     */
    getBudget() {
        const budget = this.get(this.BUDGET_KEY);
        if (budget) {
            return budget;
        }
        // Initialize default budget
        return {
            monthlyIncome: 0,
            categories: this.defaultBudgetCategories.slice()
        };
    },
    
    /**
     * Save budget data
     * @param {object} budget - Budget data to save
     * @returns {boolean} Success status
     */
    saveBudget(budget) {
        return this.set(this.BUDGET_KEY, budget);
    },
    
    /**
     * Get monthly income
     * @returns {number} Monthly income
     */
    getMonthlyIncome() {
        return this.getBudget().monthlyIncome || 0;
    },
    
    /**
     * Set monthly income
     * @param {number} income - Monthly income amount
     * @returns {boolean} Success status
     */
    setMonthlyIncome(income) {
        const budget = this.getBudget();
        budget.monthlyIncome = parseFloat(income) || 0;
        return this.saveBudget(budget);
    },
    
    /**
     * Get budget categories
     * @returns {Array} Budget categories with planned amounts
     */
    getBudgetCategories() {
        const categories = this.getBudget().categories || [];
        console.log('All budget categories:', categories);
        return categories;
    },
    
    /**
     * Get budget categories by type (variable, fixed, savings, debt, income)
     * @param {string} type - Category type
     * @returns {Array} Filtered categories
     */
    getBudgetCategoriesByType(type) {
        return this.getBudgetCategories().filter(c => c.type === type);
    },
    
    /**
     * Update planned amount for a category
     * @param {string} categoryId - Category ID
     * @param {number} plannedAmount - Planned amount
     * @returns {boolean} Success status
     */
    updateCategoryPlanned(categoryId, plannedAmount) {
        const budget = this.getBudget();
        const category = budget.categories.find(c => c.id === categoryId);
        if (category) {
            category.planned = parseFloat(plannedAmount) || 0;
            return this.saveBudget(budget);
        }
        return false;
    },
    
    /**
     * Update a budget category field
     * @param {string} categoryId - Category ID
     * @param {string} field - Field name (name or planned)
     * @param {*} value - New value
     * @returns {boolean} Success status
     */
    updateBudgetCategory(categoryId, field, value) {
        const budget = this.getBudget();
        const category = budget.categories.find(c => c.id === categoryId);
        if (category) {
            if (field === 'planned') {
                category.planned = parseFloat(value) || 0;
            } else if (field === 'actual') {
                category.actual = parseFloat(value) || 0;
            } else if (field === 'name') {
                category.name = value;
            }
            return this.saveBudget(budget);
        }
        return false;
    },
    
    /**
     * Add a custom budget category
     * @param {object} category - Category to add
     * @returns {boolean} Success status
     */
    addBudgetCategory(category) {
        const budget = this.getBudget();
        console.log('Current budget before adding:', budget);
        budget.categories.push(category);
        console.log('Budget after adding:', budget);
        const result = this.saveBudget(budget);
        console.log('Save result:', result);
        return result;
    },
    
    /**
     * Delete a budget category
     * @param {string} categoryId - Category ID
     * @returns {boolean} Success status
     */
    deleteBudgetCategory(categoryId) {
        const budget = this.getBudget();
        const filtered = budget.categories.filter(c => c.id !== categoryId);
        if (filtered.length === budget.categories.length) return false;
        budget.categories = filtered;
        return this.saveBudget(budget);
    },
    
    /**
     * Calculate total planned expenses
     * @returns {number} Total planned expenses
     */
    getTotalPlannedExpenses() {
        const categories = this.getBudgetCategories();
        return categories
            .filter(c => ['variable', 'fixed', 'savings', 'debt'].includes(c.type))
            .reduce((sum, c) => sum + (c.planned || 0), 0);
    },
    
    /**
     * Calculate remaining budget
     * @param {number} totalSpent - Total amount spent
     * @returns {object} Budget summary
     */
    calculateBudgetRemaining(totalSpent) {
        const income = this.getMonthlyIncome();
        const planned = this.getTotalPlannedExpenses();
        const remaining = income - totalSpent;
        const budgetStatus = remaining >= 0 ? 'under' : 'over';
        
        return {
            monthlyIncome: income,
            totalPlanned: planned,
            totalSpent: totalSpent,
            remaining: Math.abs(remaining),
            status: budgetStatus,
            percentageUsed: income > 0 ? Math.min((totalSpent / income) * 100, 100) : 0
        };
    },
    
    /**
     * Get total actual (spent) from budget categories
     * @returns {number} Total actual amount
     */
    getTotalActual() {
        const categories = this.getBudgetCategories();
        let total = 0;
        categories.forEach(cat => {
            if (cat.type !== 'income') {
                total += cat.actual || 0;
            }
        });
        return total;
    },
    
    /**
     * Get allocation summary from budget categories
     * @returns {object} Allocation by type
     */
    getBudgetAllocation() {
        const categories = this.getBudgetCategories();
        const allocation = {
            variable: 0,
            fixed: 0,
            savings: 0,
            debt: 0
        };
        categories.forEach(cat => {
            if (cat.type === 'variable') {
                allocation.variable += cat.actual || 0;
            } else if (cat.type === 'fixed') {
                allocation.fixed += cat.actual || 0;
            } else if (cat.type === 'savings') {
                allocation.savings += cat.actual || 0;
            } else if (cat.type === 'debt') {
                allocation.debt += cat.actual || 0;
            }
        });
        return allocation;
    },
    
    /**
     * Get planned vs actual data from budget categories
     * @returns {array} Array of category objects with planned and actual
     */
    getBudgetPlannedVsActual() {
        const categories = this.getBudgetCategories();
        return categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            planned: cat.planned || 0,
            actual: cat.actual || 0
        }));
    }
};

// Export for use in other modules
window.Storage = Storage;
