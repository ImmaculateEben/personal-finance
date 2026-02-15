// UI Rendering Module

const UI = {
    /**
     * Show a notification toast
     * @param {string} message - Message to display
     * @param {string} type - 'success' or 'error'
     */
    showNotification(message, type = 'success') {
        const toast = document.getElementById('toast');
        const messageEl = toast.querySelector('.toast-message');
        
        toast.className = 'toast ' + type;
        messageEl.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },
    
    /**
     * Render summary cards
     * @param {object} summary - Summary data
     */
    renderSummary(summary) {
        const incomeEl = document.getElementById('summaryTotalIncome');
        const expensesEl = document.getElementById('summaryTotalExpenses');
        const balanceEl = document.getElementById('summaryRemaining');
        
        // Add animation class
        incomeEl.classList.add('updated');
        expensesEl.classList.add('updated');
        balanceEl.classList.add('updated');
        
        incomeEl.textContent = formatCurrency(summary.totalIncome);
        expensesEl.textContent = formatCurrency(summary.totalExpenses);
        balanceEl.textContent = formatCurrency(summary.balance);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            incomeEl.classList.remove('updated');
            expensesEl.classList.remove('updated');
            balanceEl.classList.remove('updated');
        }, 300);
    },
    
    /**
     * Update header summary row with budget totals
     */
    updateHeaderSummary() {
        const categories = Storage.getBudgetCategories();
        
        let totalIncomePlanned = 0;
        let totalExpensesPlanned = 0;
        let totalBillsPlanned = 0;
        let totalSavingsPlanned = 0;
        let totalDebtPlanned = 0;
        
        // Also track actual/spent amounts
        let totalExpensesActual = 0;
        let totalBillsActual = 0;
        let totalSavingsActual = 0;
        let totalDebtActual = 0;
        
        categories.forEach(cat => {
            switch(cat.type) {
                case 'income':
                    totalIncomePlanned += cat.planned;
                    break;
                case 'variable':
                    totalExpensesPlanned += cat.planned;
                    totalExpensesActual += cat.actual || 0;
                    break;
                case 'fixed':
                    totalBillsPlanned += cat.planned;
                    totalBillsActual += cat.actual || 0;
                    break;
                case 'savings':
                    totalSavingsPlanned += cat.planned;
                    totalSavingsActual += cat.actual || 0;
                    break;
                case 'debt':
                    totalDebtPlanned += cat.planned;
                    totalDebtActual += cat.actual || 0;
                    break;
            }
        });
        
        // Calculate total spent from actual values only
        const totalSpent = totalExpensesActual + totalBillsActual + totalSavingsActual + totalDebtActual;
        
        // Calculate Balance: Income - Total Spent (using actual values)
        const totalBalance = totalIncomePlanned - totalSpent;
        
        // Note: Income is displayed in the budget summary section, not in the header
        document.getElementById('headerExpenses').textContent = formatCurrency(totalExpensesActual);
        document.getElementById('headerBills').textContent = formatCurrency(totalBillsActual);
        document.getElementById('headerSavings').textContent = formatCurrency(totalSavingsActual);
        document.getElementById('headerDebt').textContent = formatCurrency(totalDebtActual);
        
        const balanceEl = document.getElementById('headerBalance');
        if (balanceEl) {
            balanceEl.textContent = formatCurrency(totalBalance);
            balanceEl.style.color = totalBalance >= 0 ? '#fbbf24' : '#ef4444';
        }
        
        const balanceDesktopEl = document.getElementById('headerBalanceDesktop');
        if (balanceDesktopEl) {
            balanceDesktopEl.textContent = formatCurrency(totalBalance);
            balanceDesktopEl.style.color = totalBalance >= 0 ? '#fbbf24' : '#ef4444';
        }
    },
    
    /**
     * Update month selector and dashboard title
     * @param {number} monthIndex - Month index (0-11)
     */
    updateMonthSelector(monthIndex) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const selector = document.getElementById('monthSelector');
        const title = document.getElementById('budgetDashboardTitle');
        
        if (selector && title) {
            selector.value = monthIndex;
            title.textContent = monthNames[monthIndex] + ' Budget Dashboard';
        }
    },
    
    /**
     * Render transactions list
     * @param {Array} transactions - Transactions to render
     */
    renderTransactions(transactions) {
        const list = document.getElementById('transactionsList');
        const emptyState = document.getElementById('emptyState');
        
        // Clear current list (except empty state)
        const existingItems = list.querySelectorAll('.transaction-item');
        existingItems.forEach(item => item.remove());
        
        if (transactions.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        transactions.forEach((transaction, index) => {
            const item = this.createTransactionElement(transaction);
            item.style.animationDelay = (index * 0.05) + 's';
            list.appendChild(item);
        });
    },
    
    /**
     * Create a transaction list item element
     * @param {object} transaction - Transaction data
     * @returns {HTMLElement} Transaction element
     */
    createTransactionElement(transaction) {
        const item = document.createElement('div');
        item.className = 'transaction-item fade-in';
        item.dataset.id = transaction.id;
        
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        item.innerHTML = `
            <div class="transaction-type-indicator ${transaction.type}"></div>
            <div class="transaction-info">
                <span class="transaction-description">${transaction.description}</span>
                <span class="transaction-category">${transaction.category}</span>
            </div>
            <span class="transaction-date">${formatDate(transaction.date)}</span>
            <span class="transaction-amount ${transaction.type}">${amountPrefix}${formatCurrency(transaction.amount)}</span>
            <button class="delete-btn" data-id="${transaction.id}" aria-label="Delete transaction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
            </button>
        `;
        
        return item;
    },
    
    /**
     * Remove a transaction element with animation
     * @param {string} id - Transaction ID
     */
    removeTransactionElement(id) {
        const item = document.querySelector(`.transaction-item[data-id="${id}"]`);
        if (item) {
            item.classList.add('removing');
            setTimeout(() => {
                item.remove();
                // Check if empty state should be shown
                const list = document.getElementById('transactionsList');
                if (list.querySelectorAll('.transaction-item').length === 0) {
                    document.getElementById('emptyState').style.display = 'block';
                }
            }, 250);
        }
    },
    
    /**
     * Render category datalist for autocomplete
     */
    renderCategoryDatalist() {
        const categories = Storage.getCategories();
        const datalist = document.getElementById('categoryList');
        
        datalist.innerHTML = categories
            .map(c => `<option value="${c.name}">`)
            .join('');
    },
    
    /**
     * Render custom categories list
     */
    renderCategoriesList() {
        const list = document.getElementById('categoryListDisplay');
        const categories = Storage.getCategories();
        const defaultCategoryIds = Storage.defaultCategories.map(c => c.id);
        
        const customCategories = categories.filter(c => !defaultCategoryIds.includes(c.id));
        
        if (customCategories.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No custom categories yet</p>';
            return;
        }
        
        list.innerHTML = customCategories.map(c => `
            <div class="category-item">
                <div class="category-item-info">
                    <span class="category-color" style="background-color: ${c.color}"></span>
                    <span>${c.name}</span>
                </div>
                <button class="category-delete" data-id="${c.id}" aria-label="Delete category">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `).join('');
    },
    
    /**
     * Update charts
     */
    updateCharts() {
        ChartManager.updateCharts();
    },
    
    /**
     * Reset form
     */
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Reset date to today
            const dateInput = form.querySelector('input[type="date"]');
            if (dateInput) {
                dateInput.value = getTodayDate();
            }
        }
    },
    
    /**
     * Toggle modal
     * @param {string} modalId - Modal ID
     * @param {boolean} show - Show or hide
     */
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        if (show) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Show modal
     * @param {string} modalId - Modal ID
     */
    showModal(modalId) {
        this.toggleModal(modalId, true);
    },
    
    /**
     * Hide modal
     * @param {string} modalId - Modal ID
     */
    hideModal(modalId) {
        this.toggleModal(modalId, false);
    },
    
    /**
     * Set loading state on button
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
                </svg>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    },
    
    /**
     * Add animation styles for spinner
     */
    addAnimationStyles() {
        if (document.getElementById('spinner-style')) return;
        
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Scroll to top of transactions list
     */
    scrollToTop() {
        const list = document.getElementById('transactionsList');
        if (list) {
            list.scrollTop = 0;
        }
    },
    
    /**
     * Focus on form input
     * @param {string} inputId - Input element ID
     */
    focusInput(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
        }
    },
    
    // ==================== Budget Spreadsheet Section UI ==================== //
    
    /**
     * Render the spreadsheet-style budget section
     */
    renderBudgetSection() {
        this.renderIncomeSpreadsheet();
        this.renderExpensesSpreadsheet();
        this.renderBillsSpreadsheet();
        this.renderSavingsSpreadsheet();
        this.renderDebtSpreadsheet();
        this.renderBudgetSummary();
        this.updateHeaderSummary();
        ChartManager.updateBudgetCharts();
        this.initSpreadsheetEditing();
        this.initBudgetItemButtons();
    },
    
    /**
     * Create a spreadsheet row HTML string
     * @param {object} cat - Category object
     * @returns {string} HTML string
     */
    createSpreadsheetRow(cat) {
        // Get actual amount - prioritize stored manual value, then transaction-based
        const manualActual = cat.actual !== undefined ? cat.actual : 0;
        const actualByCategory = TransactionManager.getActualByBudgetCategory();
        const transactionActual = actualByCategory[cat.id] || 0;
        const actualAmount = manualActual > 0 ? manualActual : transactionActual;
        
        // For income, show only Name and Amount (planned)
        if (cat.type === 'income') {
            return `
                <div class="spreadsheet-row income-row" data-category-id="${cat.id}" data-type="${cat.type}">
                    <div class="col-name">
                        <input type="color" class="category-color-input" value="${cat.color}" data-category-id="${cat.id}" data-field="color" title="Click to change color">
                        <input type="text" class="category-name" value="${cat.name}" 
                               data-category-id="${cat.id}" data-field="name"
                               placeholder="Item name">
                    </div>
                    <div class="col-planned">
                        <input type="number" class="planned-input" value="${cat.planned}" 
                               data-category-id="${cat.id}" data-field="planned" 
                               placeholder="0.00" step="0.01">
                    </div>
                    <button class="row-add-btn" data-type="${cat.type}" aria-label="Duplicate item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                    <button class="row-delete-btn" data-category-id="${cat.id}" aria-label="Delete item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        // For other categories, show Name, Planned, Actual
        return `
            <div class="spreadsheet-row" data-category-id="${cat.id}" data-type="${cat.type}">
                <div class="col-name">
                    <input type="color" class="category-color-input" value="${cat.color}" data-category-id="${cat.id}" data-field="color" title="Click to change color">
                    <input type="text" class="category-name" value="${cat.name}" 
                           data-category-id="${cat.id}" data-field="name"
                           placeholder="Item name">
                </div>
                <div class="col-planned">
                    <input type="number" class="planned-input" value="${cat.planned}" 
                           data-category-id="${cat.id}" data-field="planned" 
                           placeholder="0.00" step="0.01">
                </div>
                <div class="col-actual">
                    <input type="number" class="actual-input" value="${actualAmount || 0}" 
                           data-category-id="${cat.id}" data-field="actual" 
                           placeholder="0.00" step="0.01">
                </div>
                <button class="row-add-btn" data-type="${cat.type}" aria-label="Duplicate item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                </button>
                <button class="row-delete-btn" data-category-id="${cat.id}" aria-label="Delete item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
    },
    
    /**
     * Render income spreadsheet
     */
    renderIncomeSpreadsheet() {
        const container = document.getElementById('incomeSpreadsheet');
        if (!container) return;
        
        const categories = Storage.getBudgetCategoriesByType('income');
        console.log('Income categories:', categories);
        
        container.innerHTML = categories.map(cat => this.createSpreadsheetRow(cat)).join('');
    },
    
    /**
     * Render expenses spreadsheet
     */
    renderExpensesSpreadsheet() {
        const container = document.getElementById('expensesSpreadsheet');
        if (!container) return;
        
        const categories = Storage.getBudgetCategoriesByType('variable');
        
        container.innerHTML = categories.map(cat => this.createSpreadsheetRow(cat)).join('');
    },
    
    /**
     * Render bills spreadsheet
     */
    renderBillsSpreadsheet() {
        const container = document.getElementById('billsSpreadsheet');
        if (!container) return;
        
        const categories = Storage.getBudgetCategoriesByType('fixed');
        
        container.innerHTML = categories.map(cat => this.createSpreadsheetRow(cat)).join('');
    },
    
    /**
     * Render savings spreadsheet
     */
    renderSavingsSpreadsheet() {
        const container = document.getElementById('savingsSpreadsheet');
        if (!container) return;
        
        const categories = Storage.getBudgetCategoriesByType('savings');
        
        container.innerHTML = categories.map(cat => this.createSpreadsheetRow(cat)).join('');
    },
    
    /**
     * Render debt spreadsheet
     */
    renderDebtSpreadsheet() {
        const container = document.getElementById('debtSpreadsheet');
        if (!container) return;
        
        const categories = Storage.getBudgetCategoriesByType('debt');
        
        container.innerHTML = categories.map(cat => this.createSpreadsheetRow(cat)).join('');
    },
    
    /**
     * Render budget summary section
     */
    renderBudgetSummary() {
        const categories = Storage.getBudgetCategories();
        const actualByCategory = TransactionManager.getActualByBudgetCategory();
        
        let totalIncomePlanned = 0;
        let totalExpensesPlanned = 0;
        let totalBillsPlanned = 0;
        let totalSavingsPlanned = 0;
        let totalDebtPlanned = 0;
        
        categories.forEach(cat => {
            switch(cat.type) {
                case 'income':
                    totalIncomePlanned += cat.planned;
                    break;
                case 'variable':
                    totalExpensesPlanned += cat.planned;
                    break;
                case 'fixed':
                    totalBillsPlanned += cat.planned;
                    break;
                case 'savings':
                    totalSavingsPlanned += cat.planned;
                    break;
                case 'debt':
                    totalDebtPlanned += cat.planned;
                    break;
            }
        });
        
        const totalOutflow = totalExpensesPlanned + totalBillsPlanned + totalSavingsPlanned + totalDebtPlanned;
        const remaining = totalIncomePlanned - totalOutflow;
        
        document.getElementById('summaryTotalIncome').textContent = formatCurrency(totalIncomePlanned);
        document.getElementById('summaryTotalExpenses').textContent = formatCurrency(totalExpensesPlanned);
        document.getElementById('summaryTotalBills').textContent = formatCurrency(totalBillsPlanned);
        document.getElementById('summaryTotalSavings').textContent = formatCurrency(totalSavingsPlanned);
        document.getElementById('summaryTotalDebt').textContent = formatCurrency(totalDebtPlanned);
        
        const remainingEl = document.getElementById('summaryRemaining');
        const remainingRow = document.getElementById('remainingRow');
        
        remainingEl.textContent = formatCurrency(Math.abs(remaining));
        remainingRow.className = remaining >= 0 ? 'summary-row remaining positive' : 'summary-row remaining negative';
    },
    
    /**
     * Initialize inline editing for spreadsheet inputs
     */
    initSpreadsheetEditing() {
        // Handle name and planned amount changes
        document.querySelectorAll('.spreadsheet-body').forEach(body => {
            body.addEventListener('blur', (e) => {
                if (e.target.classList.contains('category-name') || e.target.classList.contains('planned-input') || e.target.classList.contains('actual-input')) {
                    const categoryId = e.target.dataset.categoryId;
                    const field = e.target.dataset.field;
                    let value = e.target.value;
                    
                    if (field === 'planned' || field === 'actual') {
                        value = parseFloat(value) || 0;
                    }
                    
                    // Save to storage
                    Storage.updateBudgetCategory(categoryId, field, value);
                    
                    // Refresh all spreadsheets and summaries
                    this.refreshBudgetSection();
                }
            }, true);
            
            // Handle color input changes
            body.addEventListener('change', (e) => {
                if (e.target.classList.contains('category-color-input')) {
                    const categoryId = e.target.dataset.categoryId;
                    const color = e.target.value;
                    
                    // Save to storage
                    Storage.updateBudgetCategory(categoryId, 'color', color);
                    
                    // Refresh all spreadsheets and summaries
                    this.refreshBudgetSection();
                }
            });
            
            // Handle Enter key
            body.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.target.classList.contains('category-name') || e.target.classList.contains('planned-input') || e.target.classList.contains('actual-input')) {
                        e.target.blur();
                    }
                }
            });
        });
        
        // Handle delete buttons
        document.querySelectorAll('.row-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = btn.dataset.categoryId;
                if (confirm('Are you sure you want to delete this item?')) {
                    Storage.deleteBudgetCategory(categoryId);
                    this.refreshBudgetSection();
                    UI.showNotification('Item deleted', 'success');
                }
            });
        });
        
        // Handle row add buttons - duplicate the row
        document.querySelectorAll('.row-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.spreadsheet-row');
                const categoryId = row.dataset.categoryId;
                const type = row.dataset.type;
                
                // Get the existing category data
                const category = Storage.getBudgetCategories().find(c => c.id === categoryId);
                if (category) {
                    // Create a duplicate with new ID
                    const newCategory = {
                        ...category,
                        id: generateId(),
                        name: category.name + ' (Copy)'
                    };
                    Storage.addBudgetCategory(newCategory);
                    UI.refreshBudgetSection();
                    UI.showNotification('Item duplicated', 'success');
                }
            });
        });
    },
    
    /**
     * Initialize add item buttons for each section
     */
    initBudgetItemButtons() {
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                document.getElementById('budgetItemType').value = type;
                document.getElementById('budgetItemName').value = '';
                document.getElementById('budgetItemPlanned').value = '';
                document.getElementById('budgetItemActual').value = '';
                
                // Show/hide actual field based on type (income doesn't need actual)
                const actualFieldGroup = document.getElementById('actualFieldGroup');
                if (type === 'income') {
                    actualFieldGroup.style.display = 'none';
                } else {
                    actualFieldGroup.style.display = 'block';
                }
                
                // Set default color based on type
                const defaultColors = {
                    income: '#22c55e',
                    variable: '#f59e0b',
                    fixed: '#ef4444',
                    savings: '#3b82f6',
                    debt: '#8b5cf6'
                };
                document.getElementById('budgetItemColor').value = defaultColors[type] || '#4299e1';
                
                UI.showModal('budgetItemModal');
                setTimeout(() => {
                    document.getElementById('budgetItemName').focus();
                }, 100);
            });
        });
    },
    
    /**
     * Add a new budget item
     * @param {object} item - Item data
     */
    addBudgetItem(item) {
        Storage.addBudgetCategory(item);
        this.refreshBudgetSection();
        UI.showNotification('Item added successfully', 'success');
    },
    
    /**
     * Update budget section when transaction is added/deleted
     */
    refreshBudgetSection() {
        console.log('Refreshing budget section...');
        this.renderIncomeSpreadsheet();
        this.renderExpensesSpreadsheet();
        this.renderBillsSpreadsheet();
        this.renderSavingsSpreadsheet();
        this.renderDebtSpreadsheet();
        this.renderBudgetSummary();
        this.updateHeaderSummary();
        ChartManager.updateBudgetCharts();
        this.initSpreadsheetEditing();
        this.initBudgetItemButtons();
    }
};

// Export for use in other modules
window.UI = UI;
