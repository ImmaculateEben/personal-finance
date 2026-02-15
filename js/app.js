// Main Application Module

const App = {
    /**
     * Initialize the application
     */
    init() {
        // Check localStorage availability
        if (!Storage.isAvailable()) {
            UI.showNotification('localStorage is not available. Data will not be saved.', 'error');
        }
        
        // Initialize month selector
        this.initMonthSelector();
        
        // Initialize currency selector
        this.initCurrencySelector();
        
        // Initialize budget section
        this.initBudgetSection();
        
        // Initialize UI components
        this.initForm();
        this.initFilters();
        this.initBudgetItemModal();
        this.initEventListeners();
        
        // Initialize charts
        ChartManager.init();
        
        // Initial render
        this.refreshAll();
        
        console.log('Personal Finance Dashboard initialized');
    },
    
    /**
     * Initialize currency selector
     */
    initCurrencySelector() {
        const selector = document.getElementById('currencySelector');
        const currencies = Storage.getCurrencies();
        const savedCurrency = Storage.getCurrency();
        
        // Populate currency options
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            option.textContent = currency.code + ' - ' + currency.name;
            if (currency.code === savedCurrency) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
        // Handle currency change
        selector.addEventListener('change', (e) => {
            this.handleCurrencyChange(e.target.value);
        });
    },
    
    /**
     * Initialize month selector
     */
    initMonthSelector() {
        const selector = document.getElementById('monthSelector');
        const savedMonth = Storage.getSelectedMonth();
        const currentMonth = new Date().getMonth();
        const monthToUse = savedMonth !== null ? savedMonth : currentMonth;
        
        // Update UI
        UI.updateMonthSelector(monthToUse);
        
        // Handle month change
        selector.addEventListener('change', (e) => {
            const monthIndex = parseInt(e.target.value);
            Storage.setSelectedMonth(monthIndex);
            UI.updateMonthSelector(monthIndex);
            // Refresh all data for the selected month
            this.refreshAll();
        });
    },
    
    /**
     * Handle currency change
     * @param {string} currencyCode - New currency code
     */
    handleCurrencyChange(currencyCode) {
        Storage.setCurrency(currencyCode);
        
        // Refresh all UI components to reflect new currency
        this.refreshAll();
        
        const currencyInfo = Storage.getCurrencyInfo(currencyCode);
        UI.showNotification('Currency changed to ' + currencyInfo.name, 'success');
    },
    
    /**
     * Get current currency symbol
     * @returns {string} Currency symbol
     */
    getCurrencySymbol() {
        const currencyCode = Storage.getCurrency();
        const currencyInfo = Storage.getCurrencyInfo(currencyCode);
        return currencyInfo.symbol;
    },
    
    /**
     * Initialize budget section
     */
    initBudgetSection() {
        const incomeInput = document.getElementById('monthlyIncome');
        
        if (incomeInput) {
            // Initialize with saved value
            incomeInput.value = Storage.getMonthlyIncome();
            
            // Handle income change with debounce
            incomeInput.addEventListener('input', debounce((e) => {
                this.handleIncomeChange(e.target.value);
            }, 300));
            
            // Handle blur to ensure valid value
            incomeInput.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value) || 0;
                e.target.value = value;
                this.handleIncomeChange(value);
            });
        }
        
        // Render budget section
        UI.renderBudgetSection();
    },
    
    /**
     * Handle monthly income change
     * @param {number} income - New income amount
     */
    handleIncomeChange(income) {
        Storage.setMonthlyIncome(income);
        
        // Update display
        const display = document.getElementById('monthlyIncomeDisplay');
        if (display) {
            display.textContent = formatCurrency(income);
        }
        
        // Refresh budget summary
        UI.renderBudgetSummary();
        ChartManager.updateBudgetCharts();
    },
    
    /**
     * Initialize transaction form
     */
    initForm() {
        const form = document.getElementById('transactionForm');
        const dateInput = form.querySelector('#date');
        
        // Set default date to today
        dateInput.value = getTodayDate();
        
        // Form submission handler
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit(e.target);
        });
    },
    
    /**
     * Handle transaction form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleTransactionSubmit(form) {
        const formData = {
            amount: form.amount.value,
            type: form.type.value,
            category: form.category.value,
            description: form.description.value,
            date: form.date.value
        };
        
        // Validate form data
        if (!isValidAmount(formData.amount)) {
            UI.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        // Add transaction
        const result = TransactionManager.add(formData);
        
        if (result.success) {
            UI.showNotification('Transaction added successfully', 'success');
            form.reset();
            dateInput.value = getTodayDate();
            this.refreshAll();
            UI.focusInput('amount');
            
            // Refresh budget section
            UI.refreshBudgetSection();
        } else {
            UI.showNotification('Failed to add transaction', 'error');
        }
    },
    
    /**
     * Initialize filters
     */
    initFilters() {
        const filterType = document.getElementById('filterType');
        const filterDate = document.getElementById('filterDate');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        // Filter change handlers
        const handleFilterChange = debounce(() => {
            this.applyFilters();
        }, 300);
        
        filterType.addEventListener('change', handleFilterChange);
        filterDate.addEventListener('change', handleFilterChange);
        
        // Clear filters
        clearFiltersBtn.addEventListener('click', () => {
            filterType.value = 'all';
            filterDate.value = '';
            this.applyFilters();
            UI.showNotification('Filters cleared', 'success');
        });
    },
    
    /**
     * Apply current filters and refresh the view
     */
    applyFilters() {
        const filterType = document.getElementById('filterType').value;
        const filterDate = document.getElementById('filterDate').value;
        
        const filters = {};
        
        if (filterType !== 'all') {
            filters.type = filterType;
        }
        
        if (filterDate) {
            filters.date = filterDate;
        }
        
        const filteredTransactions = TransactionManager.filter(filters);
        UI.renderTransactions(filteredTransactions);
        
        // Update summary with filtered data
        const summary = TransactionManager.calculateSummary(filteredTransactions);
        UI.renderSummary(summary);
    },
    
    /**
     * Initialize category modal
     */
    initCategoryModal() {
        const modal = document.getElementById('categoryModal');
        const addBtn = document.getElementById('addCategoryBtn');
        const cancelBtn = document.getElementById('cancelCategory');
        const closeBtn = document.getElementById('closeCategoryModal');
        const form = document.getElementById('categoryForm');
        const overlay = modal.querySelector('.modal-overlay');
        
        // Open modal
        addBtn.addEventListener('click', () => {
            UI.showModal('categoryModal');
            document.getElementById('newCategoryName').focus();
        });
        
        // Close modal handlers
        const closeModal = () => UI.hideModal('categoryModal');
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit(e.target);
        });
    },
    
    /**
     * Initialize budget item modal
     */
    initBudgetItemModal() {
        console.log('Initializing budget item modal...');
        const modal = document.getElementById('budgetItemModal');
        const cancelBtn = document.getElementById('cancelBudgetItem');
        const closeBtn = document.getElementById('closeBudgetItemModal');
        const form = document.getElementById('budgetItemForm');
        const overlay = modal.querySelector('.modal-overlay');
        
        console.log('Modal elements:', { modal, cancelBtn, closeBtn, form, overlay });
        
        // Close modal handlers
        const closeModal = () => UI.hideModal('budgetItemModal');
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            console.log('Form submitted!');
            e.preventDefault();
            this.handleBudgetItemSubmit(e.target);
        });
    },
    
    /**
     * Handle budget item form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleBudgetItemSubmit(form) {
        const type = form.budgetItemType.value;
        const name = toTitleCase(form.budgetItemName.value.trim());
        const planned = parseFloat(form.budgetItemPlanned.value) || 0;
        const actual = parseFloat(form.budgetItemActual.value) || 0;
        const color = form.budgetItemColor.value;
        
        const budgetItem = {
            id: generateId(),
            name: name,
            type: type,
            color: color,
            planned: planned,
            actual: actual
        };
        
        console.log('Adding budget item:', budgetItem);
        const success = Storage.addBudgetCategory(budgetItem);
        console.log('Save result:', success);
        
        if (success) {
            UI.showNotification('Item added successfully', 'success');
            form.reset();
            UI.hideModal('budgetItemModal');
            UI.refreshBudgetSection();
        } else {
            UI.showNotification('Failed to add item', 'error');
        }
    },
    
    /**
     * Handle category form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleCategorySubmit(form) {
        const category = {
            id: generateId(),
            name: toTitleCase(form.newCategoryName.value.trim()),
            type: form.newCategoryType.value,
            color: form.newCategoryColor.value
        };
        
        const success = Storage.addCategory(category);
        
        if (success) {
            UI.showNotification('Category added successfully', 'success');
            form.reset();
            form.newCategoryColor.value = '#4299e1';
            UI.hideModal('categoryModal');
            UI.renderCategoriesList();
            UI.renderCategoryDatalist();
        } else {
            UI.showNotification('Failed to add category', 'error');
        }
    },
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Transaction delete buttons (event delegation)
        document.getElementById('transactionsList').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDeleteTransaction(id);
            }
        });
        
        // Category delete buttons (event delegation)
        document.getElementById('categoryListDisplay').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.category-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDeleteCategory(id);
            }
        });
        
        // Window resize handler for charts
        window.addEventListener('resize', debounce(() => {
            UI.updateCharts();
        }, 250));
        
        // Add animation styles
        UI.addAnimationStyles();
    },
    
    /**
     * Handle transaction deletion
     * @param {string} id - Transaction ID
     */
    handleDeleteTransaction(id) {
        const transaction = TransactionManager.getById(id);
        if (!transaction) return;
        
        // Confirm deletion
        const confirmDelete = confirm(`Delete "${transaction.description}" for ${formatCurrency(transaction.amount)}?`);
        
        if (confirmDelete) {
            const result = TransactionManager.delete(id);
            
            if (result.success) {
                UI.removeTransactionElement(id);
                this.refreshAll();
                UI.showNotification('Transaction deleted', 'success');
                
                // Refresh budget section
                UI.refreshBudgetSection();
            } else {
                UI.showNotification('Failed to delete transaction', 'error');
            }
        }
    },
    
    /**
     * Handle category deletion
     * @param {string} id - Category ID
     */
    handleDeleteCategory(id) {
        const category = Storage.getCategories().find(c => c.id === id);
        if (!category) return;
        
        // Check if category is in use
        const transactions = TransactionManager.getAll();
        const isInUse = transactions.some(t => 
            t.category.toLowerCase() === category.name.toLowerCase()
        );
        
        if (isInUse) {
            UI.showNotification('Cannot delete category in use by transactions', 'error');
            return;
        }
        
        // Confirm deletion
        const confirmDelete = confirm(`Delete category "${category.name}"?`);
        
        if (confirmDelete) {
            const success = Storage.deleteCategory(id);
            
            if (success) {
                UI.renderCategoriesList();
                UI.renderCategoryDatalist();
                UI.showNotification('Category deleted', 'success');
            } else {
                UI.showNotification('Failed to delete category', 'error');
            }
        }
    },
    
    /**
     * Refresh all UI components
     */
    refreshAll() {
        // Get selected month
        const selectedMonth = Storage.getSelectedMonth();
        const year = new Date().getFullYear();
        
        // Get all transactions filtered by selected month
        const transactions = TransactionManager.getByMonth(selectedMonth, year);
        
        // Render transactions
        UI.renderTransactions(transactions);
        
        // Render summary
        const summary = TransactionManager.calculateSummary(transactions);
        UI.renderSummary(summary);
        
        // Render charts
        UI.updateCharts();
        
        // Render categories
        UI.renderCategoriesList();
        UI.renderCategoryDatalist();
        
        // Render budget section
        UI.renderBudgetSection();
    },
    
    /**
     * Refresh with filtering applied
     */
    refreshWithFilters() {
        const filterType = document.getElementById('filterType').value;
        const filterDate = document.getElementById('filterDate').value;
        
        const filters = {};
        if (filterType !== 'all') filters.type = filterType;
        if (filterDate) filters.date = filterDate;
        
        const filteredTransactions = TransactionManager.filter(filters);
        UI.renderTransactions(filteredTransactions);
        
        const summary = TransactionManager.calculateSummary(filteredTransactions);
        UI.renderSummary(summary);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for console access
window.App = App;
