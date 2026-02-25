// Transaction Management Module (period-aware, budget-linked ledger)

const TransactionManager = {
    getAll() {
        return Storage.getTransactions();
    },

    getSortedByDate(transactions = null, sort = 'newest') {
        const txns = (transactions || this.getAll()).slice();
        const compareDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

        if (sort === 'oldest') {
            return txns.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        if (sort === 'amount-desc') {
            return txns.sort((a, b) => b.amount - a.amount || compareDateDesc(a, b));
        }
        if (sort === 'amount-asc') {
            return txns.sort((a, b) => a.amount - b.amount || compareDateDesc(a, b));
        }

        return txns.sort(compareDateDesc);
    },

    _getSelectedPeriod() {
        return {
            month: Storage.getSelectedMonth(),
            year: Storage.getSelectedYear()
        };
    },

    _isInPeriod(transaction, month, year) {
        const txnDate = new Date(transaction.date);
        return !Number.isNaN(txnDate.getTime()) && txnDate.getMonth() === month && txnDate.getFullYear() === year;
    },

    getByMonth(month, year) {
        return this.getAll().filter(t => this._isInPeriod(t, month, year));
    },

    getBySelectedPeriod() {
        const { month, year } = this._getSelectedPeriod();
        return this.getByMonth(month, year);
    },

    filter(filters = {}) {
        const month = filters.month !== undefined ? filters.month : Storage.getSelectedMonth();
        const year = filters.year !== undefined ? filters.year : Storage.getSelectedYear();
        let transactions = this.getByMonth(month, year);

        if (filters.type && filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }

        if (filters.date && isValidDateInput(filters.date)) {
            transactions = transactions.filter(t => t.date === filters.date);
        }

        if (filters.startDate && isValidDateInput(filters.startDate)) {
            transactions = transactions.filter(t => t.date >= filters.startDate);
        }
        if (filters.endDate && isValidDateInput(filters.endDate)) {
            transactions = transactions.filter(t => t.date <= filters.endDate);
        }

        if (filters.category) {
            const query = sanitizeText(filters.category, { maxLength: 40, fallback: '' }).toLowerCase();
            if (query) {
                transactions = transactions.filter(t => t.category.toLowerCase().includes(query));
            }
        }

        if (filters.search) {
            const searchLower = sanitizeText(filters.search, { maxLength: 120, fallback: '' }).toLowerCase();
            if (searchLower) {
                transactions = transactions.filter(t =>
                    t.description.toLowerCase().includes(searchLower) ||
                    t.category.toLowerCase().includes(searchLower)
                );
            }
        }

        return this.getSortedByDate(transactions, filters.sort || 'newest');
    },

    _findBudgetCategoryById(categoryId, month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        if (!categoryId) return null;
        return Storage.getBudgetCategories(month, year).find(c => c.id === categoryId) || null;
    },

    _isValidTransactionType(value) {
        return value === 'income' || value === 'expense';
    },

    _deriveTransactionTypeFromBudgetCategory(category) {
        if (!category) return null;
        return category.type === 'income' ? 'income' : 'expense';
    },

    add(transactionData) {
        const selectedPeriod = this._getSelectedPeriod();
        const rawDate = sanitizeText(transactionData && transactionData.date, { maxLength: 10, fallback: getTodayDate() });
        const date = isValidDateInput(rawDate) ? rawDate : getTodayDate();

        const budgetCategory = this._findBudgetCategoryById(transactionData && transactionData.budgetCategoryId, selectedPeriod.month, selectedPeriod.year);
        const derivedType = this._deriveTransactionTypeFromBudgetCategory(budgetCategory);
        const requestedType = this._isValidTransactionType(transactionData && transactionData.type) ? transactionData.type : null;
        const type = derivedType || requestedType;

        if (!this._isValidTransactionType(type)) {
            return { success: false, error: 'invalid_type' };
        }

        const amount = toNumber(transactionData && transactionData.amount, { fallback: 0, min: 0, max: 1000000000 });
        if (!(amount > 0)) {
            return { success: false, error: 'invalid_amount' };
        }

        let categoryName = sanitizeText(transactionData && transactionData.category, { maxLength: 40, fallback: '' });
        let budgetType;

        if (budgetCategory) {
            categoryName = budgetCategory.name;
            budgetType = budgetCategory.type;
        } else {
            categoryName = toTitleCase(categoryName || (type === 'income' ? 'Income' : 'Expense'));
            budgetType = type === 'income' ? 'income' : undefined;
        }

        const description = sanitizeText(transactionData && transactionData.description, {
            maxLength: 120,
            fallback: categoryName || (type === 'income' ? 'Income' : 'Expense')
        });

        const transaction = {
            id: generateId(),
            amount,
            type,
            category: categoryName,
            budgetCategoryId: budgetCategory ? budgetCategory.id : undefined,
            budgetType: budgetType,
            description,
            date,
            createdAt: new Date().toISOString()
        };

        const success = Storage.addTransaction(transaction);
        return success ? { success: true, transaction } : { success: false, error: 'storage_error' };
    },

    update(id, updates) {
        const safeUpdates = { ...updates };
        if (safeUpdates.amount !== undefined) {
            safeUpdates.amount = toNumber(safeUpdates.amount, { fallback: 0, min: 0, max: 1000000000 });
        }
        if (safeUpdates.category !== undefined) {
            safeUpdates.category = toTitleCase(sanitizeText(safeUpdates.category, { maxLength: 40, fallback: 'Other' }));
        }
        if (safeUpdates.description !== undefined) {
            safeUpdates.description = sanitizeText(safeUpdates.description, { maxLength: 120, fallback: 'Transaction' });
        }
        if (safeUpdates.date !== undefined && !isValidDateInput(safeUpdates.date)) {
            delete safeUpdates.date;
        }
        safeUpdates.updatedAt = new Date().toISOString();

        const success = Storage.updateTransaction(id, safeUpdates);
        return { success };
    },

    delete(id) {
        return { success: Storage.deleteTransaction(id) };
    },

    getById(id) {
        return this.getAll().find(t => t.id === id) || null;
    },

    clearAll() {
        return Storage.clearTransactions();
    },

    calculateSummary(transactions = null) {
        const txns = Array.isArray(transactions) ? transactions : this.getAll();
        const income = roundCurrency(txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
        const expenses = roundCurrency(txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));

        return {
            totalIncome: income,
            totalExpenses: expenses,
            balance: roundCurrency(income - expenses),
            transactionCount: txns.length
        };
    },

    getPeriodSummary(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear(), filters = {}) {
        const transactions = this.filter({ ...filters, month, year });
        return {
            transactions,
            summary: this.calculateSummary(transactions)
        };
    },

    getUniqueCategories(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const categories = new Set(this.getByMonth(month, year).map(t => t.category));
        return Array.from(categories).sort();
    },

    getLedgerCategoryOptions(transactionType = 'expense', month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const categories = Storage.getBudgetCategories(month, year);
        if (transactionType === 'income') {
            return categories.filter(c => c.type === 'income');
        }
        return categories.filter(c => c.type !== 'income');
    },

    getBudgetActualsMap(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const categories = Storage.getBudgetCategories(month, year);
        const categoryById = new Map(categories.map(cat => [cat.id, cat]));
        const categoryNameLookup = new Map(categories.map(cat => [cat.name.toLowerCase(), cat]));

        const byId = {};
        const byName = {};
        const totalsByType = {
            income: 0,
            variable: 0,
            fixed: 0,
            savings: 0,
            debt: 0
        };

        this.getByMonth(month, year).forEach(txn => {
            let category = null;

            if (txn.budgetCategoryId && categoryById.has(txn.budgetCategoryId)) {
                category = categoryById.get(txn.budgetCategoryId);
            } else if (txn.category && categoryNameLookup.has(txn.category.toLowerCase())) {
                category = categoryNameLookup.get(txn.category.toLowerCase());
            }

            if (!category) {
                return;
            }

            byId[category.id] = roundCurrency((byId[category.id] || 0) + txn.amount);
            byName[category.name] = roundCurrency((byName[category.name] || 0) + txn.amount);

            if (totalsByType.hasOwnProperty(category.type)) {
                totalsByType[category.type] = roundCurrency(totalsByType[category.type] + txn.amount);
            }
        });

        return {
            byId,
            byName,
            totalsByType
        };
    },

    getActualByBudgetCategory(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        return this.getBudgetActualsMap(month, year).byName;
    },

    getEffectiveBudgetCategories(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const categories = Storage.getBudgetCategories(month, year);
        const txnActuals = this.getBudgetActualsMap(month, year).byId;

        return categories.map(cat => {
            const manualActual = toNumber(cat.actual, { fallback: 0, min: 0 });
            const transactionActual = toNumber(txnActuals[cat.id], { fallback: 0, min: 0 });
            const effectiveActual = cat.type === 'income'
                ? (transactionActual > 0 ? transactionActual : manualActual)
                : (transactionActual > 0 ? transactionActual : manualActual);

            return {
                ...cat,
                manualActual,
                transactionActual,
                actualEffective: roundCurrency(effectiveActual),
                actualSource: transactionActual > 0 ? 'transactions' : 'manual'
            };
        });
    },

    getEffectiveBudgetMetrics(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const base = Storage.getBudgetMetrics(month, year);
        const effectiveCategories = this.getEffectiveBudgetCategories(month, year);

        const actuals = {
            income: 0,
            variable: 0,
            fixed: 0,
            savings: 0,
            debt: 0
        };

        effectiveCategories.forEach(cat => {
            if (actuals.hasOwnProperty(cat.type)) {
                actuals[cat.type] = roundCurrency(actuals[cat.type] + toNumber(cat.actualEffective, { fallback: 0, min: 0 }));
            }
        });

        const actualOutflow = roundCurrency(actuals.variable + actuals.fixed + actuals.savings + actuals.debt);
        const incomeBasis = base.incomePlanned;
        const actualBalance = roundCurrency(incomeBasis - actualOutflow);

        return {
            ...base,
            incomeActual: actuals.income,
            variableActual: actuals.variable,
            fixedActual: actuals.fixed,
            savingsActual: actuals.savings,
            debtActual: actuals.debt,
            actualOutflow,
            actualBalance,
            actualUtilizationPercent: incomeBasis > 0 ? roundCurrency((actualOutflow / incomeBasis) * 100) : 0,
            effectiveCategories
        };
    },

    getSpendingByType(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const metrics = this.getEffectiveBudgetMetrics(month, year);
        return {
            variable: metrics.variableActual,
            fixed: metrics.fixedActual,
            savings: metrics.savingsActual,
            debt: metrics.debtActual,
            income: metrics.incomeActual > 0 ? metrics.incomeActual : metrics.incomePlanned
        };
    },

    getPlannedVsActual(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const effective = this.getEffectiveBudgetCategories(month, year);
        return effective.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            color: cat.color,
            planned: toNumber(cat.planned, { fallback: 0, min: 0 }),
            actual: toNumber(cat.actualEffective, { fallback: 0, min: 0 }),
            remaining: roundCurrency(toNumber(cat.planned, { fallback: 0, min: 0 }) - toNumber(cat.actualEffective, { fallback: 0, min: 0 })),
            percentageUsed: toNumber(cat.planned, { fallback: 0, min: 0 }) > 0
                ? roundCurrency((toNumber(cat.actualEffective, { fallback: 0, min: 0 }) / toNumber(cat.planned, { fallback: 0, min: 0 })) * 100)
                : 0
        }));
    },

    getCurrentMonth() {
        return this.getBySelectedPeriod();
    },

    getCurrentMonthSpent() {
        return roundCurrency(this.getBySelectedPeriod()
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0));
    },

    getExpensesByCategory(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const expenses = this.getByMonth(month, year).filter(t => t.type === 'expense');
        const totals = {};
        expenses.forEach(t => {
            totals[t.category] = roundCurrency((totals[t.category] || 0) + t.amount);
        });

        return Object.entries(totals).map(([category, total]) => ({ category, total }));
    },

    getMonthlyData(months = 6) {
        const now = new Date();
        const data = { labels: [], income: [], expenses: [] };

        for (let i = months - 1; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthData = this.getByMonth(date.getMonth(), date.getFullYear());
            data.labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            data.income.push(roundCurrency(monthData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)));
            data.expenses.push(roundCurrency(monthData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)));
        }

        return data;
    },

    getAllocationSummary(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        const spendingByType = this.getSpendingByType(month, year);
        const totalIncome = spendingByType.income;

        if (totalIncome <= 0) {
            return {
                variable: { amount: 0, percentage: 0 },
                fixed: { amount: 0, percentage: 0 },
                savings: { amount: 0, percentage: 0 },
                debt: { amount: 0, percentage: 0 },
                totalIncome: 0,
                totalAllocated: 0,
                unallocated: 0
            };
        }

        const totalAllocated = roundCurrency(spendingByType.variable + spendingByType.fixed + spendingByType.savings + spendingByType.debt);

        return {
            variable: { amount: spendingByType.variable, percentage: roundCurrency((spendingByType.variable / totalIncome) * 100) },
            fixed: { amount: spendingByType.fixed, percentage: roundCurrency((spendingByType.fixed / totalIncome) * 100) },
            savings: { amount: spendingByType.savings, percentage: roundCurrency((spendingByType.savings / totalIncome) * 100) },
            debt: { amount: spendingByType.debt, percentage: roundCurrency((spendingByType.debt / totalIncome) * 100) },
            totalIncome,
            totalAllocated,
            unallocated: roundCurrency(Math.max(0, totalIncome - totalAllocated))
        };
    }
};

window.TransactionManager = TransactionManager;

