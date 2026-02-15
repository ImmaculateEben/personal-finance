// Transaction Management Module

const TransactionManager = {
    /**
     * Get all transactions
     * @returns {Array} Array of transactions
     */
    getAll() {
        return Storage.getTransactions();
    },
    
    /**
     * Get transactions sorted by date (newest first)
     * @returns {Array} Sorted transactions
     */
    getSortedByDate() {
        const transactions = this.getAll();
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    /**
     * Add a new transaction
     * @param {object} transactionData - Transaction data
     * @returns {object} Result with success status and transaction
     */
    add(transactionData) {
        const transaction = {
            id: generateId(),
            amount: parseFloat(transactionData.amount),
            type: transactionData.type,
            category: toTitleCase(transactionData.category.trim()),
            description: transactionData.description.trim(),
            date: transactionData.date,
            createdAt: new Date().toISOString()
        };
        
        const success = Storage.addTransaction(transaction);
        
        if (success) {
            return { success: true, transaction };
        }
        return { success: false, transaction: null };
    },
    
    /**
     * Update an existing transaction
     * @param {string} id - Transaction ID
     * @param {object} updates - Fields to update
     * @returns {object} Result with success status
     */
    update(id, updates) {
        if (updates.amount) updates.amount = parseFloat(updates.amount);
        if (updates.category) updates.category = toTitleCase(updates.category.trim());
        if (updates.description) updates.description = updates.description.trim();
        updates.updatedAt = new Date().toISOString();
        
        const success = Storage.updateTransaction(id, updates);
        return { success };
    },
    
    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     * @returns {object} Result with success status
     */
    delete(id) {
        const success = Storage.deleteTransaction(id);
        return { success };
    },
    
    /**
     * Filter transactions
     * @param {object} filters - Filter criteria
     * @returns {Array} Filtered transactions
     */
    filter(filters = {}) {
        let transactions = this.getAll();
        
        // Filter by type
        if (filters.type && filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        // Filter by date
        if (filters.date) {
            transactions = transactions.filter(t => t.date === filters.date);
        }
        
        // Filter by date range
        if (filters.startDate) {
            transactions = transactions.filter(t => t.date >= filters.startDate);
        }
        if (filters.endDate) {
            transactions = transactions.filter(t => t.date <= filters.endDate);
        }
        
        // Filter by category
        if (filters.category) {
            transactions = transactions.filter(t => 
                t.category.toLowerCase().includes(filters.category.toLowerCase())
            );
        }
        
        // Filter by description
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(searchLower) ||
                t.category.toLowerCase().includes(searchLower)
            );
        }
        
        return transactions;
    },
    
    /**
     * Calculate summary statistics
     * @param {Array} transactions - Transactions to analyze (optional)
     * @returns {object} Summary object
     */
    calculateSummary(transactions = null) {
        const txns = transactions || this.getAll();
        
        const income = txns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = txns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            transactionCount: txns.length
        };
    },
    
    /**
     * Get transactions by month
     * @param {number} month - Month (0-11)
     * @param {number} year - Year
     * @returns {Array} Filtered transactions
     */
    getByMonth(month, year) {
        return this.getAll().filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === month && txnDate.getFullYear() === year;
        });
    },
    
    /**
     * Get transactions for current month
     * @returns {Array} Current month transactions
     */
    getCurrentMonth() {
        const { month, year } = getCurrentMonth();
        return this.getByMonth(month, year);
    },
    
    /**
     * Get income/expense data grouped by month
     * @param {number} months - Number of months to include
     * @returns {object} Monthly data
     */
    getMonthlyData(months = 6) {
        const now = new Date();
        const data = {
            labels: [],
            income: [],
            expenses: []
        };
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthData = this.getByMonth(date.getMonth(), date.getFullYear());
            
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            data.labels.push(monthLabel);
            
            data.income.push(
                monthData.filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)
            );
            
            data.expenses.push(
                monthData.filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
            );
        }
        
        return data;
    },
    
    /**
     * Get expenses grouped by category
     * @returns {Array} Category totals
     */
    getExpensesByCategory() {
        const expenses = this.getAll().filter(t => t.type === 'expense');
        const categoryTotals = {};
        
        expenses.forEach(t => {
            if (!categoryTotals[t.category]) {
                categoryTotals[t.category] = 0;
            }
            categoryTotals[t.category] += t.amount;
        });
        
        return Object.entries(categoryTotals).map(([category, total]) => ({
            category,
            total
        }));
    },
    
    /**
     * Get a single transaction by ID
     * @param {string} id - Transaction ID
     * @returns {object|null} Transaction or null
     */
    getById(id) {
        return this.getAll().find(t => t.id === id) || null;
    },
    
    /**
     * Clear all transactions
     * @returns {boolean} Success status
     */
    clearAll() {
        return Storage.clearTransactions();
    },
    
    /**
     * Get unique categories from transactions
     * @returns {Array} Unique category names
     */
    getUniqueCategories() {
        const transactions = this.getAll();
        const categories = new Set(transactions.map(t => t.category));
        return Array.from(categories).sort();
    },
    
    /**
     * Get spending trends (daily average for last N days)
     * @param {number} days - Number of days
     * @returns {number} Daily average
     */
    getSpendingTrend(days = 30) {
        const now = new Date();
        const startDate = new Date(now.setDate(now.getDate() - days));
        const startDateStr = startDate.toISOString().split('T')[0];
        
        const recentExpenses = this.getAll().filter(t => 
            t.type === 'expense' && t.date >= startDateStr
        );
        
        const total = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
        return total / days;
    },
    
    // ==================== Budget Calculations ==================== //
    
    /**
     * Calculate actual spending by budget category
     * @returns {object} Category actual amounts
     */
    getActualByBudgetCategory() {
        const transactions = this.getAll();
        const actualByCategory = {};
        
        // Get current month transactions
        const now = new Date();
        const currentMonthTxns = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return txnDate.getMonth() === now.getMonth() && 
                   txnDate.getFullYear() === now.getFullYear();
        });
        
        currentMonthTxns.forEach(t => {
            if (!actualByCategory[t.category]) {
                actualByCategory[t.category] = 0;
            }
            actualByCategory[t.category] += t.amount;
        });
        
        return actualByCategory;
    },
    
    /**
     * Calculate spending by category type (variable, fixed, savings, debt)
     * @returns {object} Type totals
     */
    getSpendingByType() {
        const actualByCategory = this.getActualByBudgetCategory();
        const budgetCategories = Storage.getBudgetCategories();
        const typeTotals = {
            variable: 0,
            fixed: 0,
            savings: 0,
            debt: 0,
            income: 0
        };
        
        // Map categories to types
        budgetCategories.forEach(cat => {
            const actual = actualByCategory[cat.name] || 0;
            if (typeTotals.hasOwnProperty(cat.type)) {
                typeTotals[cat.type] += actual;
            }
        });
        
        // Add income transactions
        const transactions = this.getAll();
        const now = new Date();
        const currentMonthIncome = transactions.filter(t => {
            const txnDate = new Date(t.date);
            return t.type === 'income' && 
                   txnDate.getMonth() === now.getMonth() && 
                   txnDate.getFullYear() === now.getFullYear();
        }).reduce((sum, t) => sum + t.amount, 0);
        
        typeTotals.income = currentMonthIncome;
        
        return typeTotals;
    },
    
    /**
     * Get planned vs actual comparison for all categories
     * @returns {Array} Comparison data
     */
    getPlannedVsActual() {
        const actualByCategory = this.getActualByBudgetCategory();
        const budgetCategories = Storage.getBudgetCategories();
        
        return budgetCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            color: cat.color,
            planned: cat.planned,
            actual: actualByCategory[cat.name] || 0,
            remaining: cat.planned - (actualByCategory[cat.name] || 0),
            percentageUsed: cat.planned > 0 ? 
                Math.min(((actualByCategory[cat.name] || 0) / cat.planned) * 100, 100) : 0
        }));
    },
    
    /**
     * Calculate total spent for current month
     * @returns {number} Total spent
     */
    getCurrentMonthSpent() {
        const transactions = this.getAll();
        const now = new Date();
        
        return transactions
            .filter(t => t.type === 'expense')
            .filter(t => {
                const txnDate = new Date(t.date);
                return txnDate.getMonth() === now.getMonth() && 
                       txnDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
    },
    
    /**
     * Get allocation summary (percentage by type)
     * @returns {object} Allocation percentages
     */
    getAllocationSummary() {
        const spendingByType = this.getSpendingByType();
        const totalIncome = spendingByType.income;
        
        if (totalIncome <= 0) {
            return {
                variable: { amount: 0, percentage: 0 },
                fixed: { amount: 0, percentage: 0 },
                savings: { amount: 0, percentage: 0 },
                debt: { amount: 0, percentage: 0 },
                totalIncome: 0,
                totalAllocated: 0
            };
        }
        
        const totalAllocated = spendingByType.variable + spendingByType.fixed + 
                               spendingByType.savings + spendingByType.debt;
        
        return {
            variable: {
                amount: spendingByType.variable,
                percentage: (spendingByType.variable / totalIncome) * 100
            },
            fixed: {
                amount: spendingByType.fixed,
                percentage: (spendingByType.fixed / totalIncome) * 100
            },
            savings: {
                amount: spendingByType.savings,
                percentage: (spendingByType.savings / totalIncome) * 100
            },
            debt: {
                amount: spendingByType.debt,
                percentage: (spendingByType.debt / totalIncome) * 100
            },
            totalIncome: totalIncome,
            totalAllocated: totalAllocated,
            unallocated: Math.max(0, totalIncome - totalAllocated)
        };
    }
};

// Export for use in other modules
window.TransactionManager = TransactionManager;
