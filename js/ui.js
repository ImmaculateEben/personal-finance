// UI Rendering Module (Budget + Transaction Ledger)

const UI = {
    _budgetEventsBound: false,
    _toastTimer: null,

    showNotification(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = sanitizeText(message, { maxLength: 160, fallback: '' });
        }

        toast.className = 'toast ' + (type === 'error' ? 'error' : 'success');
        toast.classList.add('show');

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    },

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.toggle('show', Boolean(show));
        document.body.style.overflow = show ? 'hidden' : '';
    },

    showModal(modalId) {
        this.toggleModal(modalId, true);
    },

    hideModal(modalId) {
        this.toggleModal(modalId, false);
    },

    updateMonthSelector(monthIndex, year) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthSelector = document.getElementById('monthSelector');
        const yearSelector = document.getElementById('yearSelector');
        const title = document.getElementById('budgetDashboardTitle');

        if (monthSelector) monthSelector.value = String(monthIndex);
        if (yearSelector && year !== undefined) yearSelector.value = String(year);
        if (title) title.textContent = monthNames[monthIndex] + ' ' + year + ' Budget Dashboard';
    },

    _getBudgetMetrics(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        if (window.TransactionManager && typeof TransactionManager.getEffectiveBudgetMetrics === 'function') {
            return TransactionManager.getEffectiveBudgetMetrics(month, year);
        }
        return Storage.getBudgetMetrics(month, year);
    },

    _getBudgetCategories(month = Storage.getSelectedMonth(), year = Storage.getSelectedYear()) {
        if (window.TransactionManager && typeof TransactionManager.getEffectiveBudgetCategories === 'function') {
            return TransactionManager.getEffectiveBudgetCategories(month, year);
        }
        return Storage.getBudgetCategories(month, year);
    },

    renderBudgetSection() {
        this.ensureBudgetEventBindings();
        this.renderSpreadsheet('incomeSpreadsheet', 'income');
        this.renderSpreadsheet('expensesSpreadsheet', 'variable');
        this.renderSpreadsheet('billsSpreadsheet', 'fixed');
        this.renderSpreadsheet('savingsSpreadsheet', 'savings');
        this.renderSpreadsheet('debtSpreadsheet', 'debt');
        this.renderBudgetSummary();
        this.updateHeaderSummary();
        this.renderInsights();
        this.renderPeriodMeta();
        ChartManager.updateBudgetCharts();
    },

    refreshBudgetSection() {
        this.renderBudgetSection();
    },

    _getSectionContainer(containerId) {
        return document.getElementById(containerId) || null;
    },

    _createSpreadsheetRowHtml(cat) {
        const id = escapeHtml(cat.id);
        const name = escapeHtml(cat.name || '');
        const color = normalizeHexColor(cat.color, '#4299e1');
        const planned = toNumber(cat.planned, { fallback: 0, min: 0 });
        const manualActual = toNumber(cat.manualActual !== undefined ? cat.manualActual : cat.actual, { fallback: 0, min: 0 });
        const transactionActual = toNumber(cat.transactionActual, { fallback: 0, min: 0 });
        const hasTxnActual = transactionActual > 0;
        const actualTitle = hasTxnActual
            ? 'Manual actual: ' + formatCurrency(manualActual) + ' | Ledger actual (used in charts/summary): ' + formatCurrency(transactionActual)
            : 'Manual actual used in charts and summary';

        const sharedName = `
            <div class="col-name">
                <input type="color" class="category-color-input" value="${color}" data-category-id="${id}" data-field="color" title="Change color">
                <input type="text" class="category-name budget-editable" value="${name}" data-category-id="${id}" data-field="name" maxlength="40" placeholder="Item name" autocomplete="off">
            </div>
        `;

        const actionButtons = `
            <button type="button" class="row-add-btn" data-category-id="${id}" aria-label="Duplicate item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
            </button>
            <button type="button" class="row-delete-btn" data-category-id="${id}" aria-label="Delete item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>
        `;

        if (cat.type === 'income') {
            return `
                <div class="spreadsheet-row income-row" data-category-id="${id}" data-type="income">
                    ${sharedName}
                    <div class="col-planned">
                        <input type="number" class="planned-input budget-editable" value="${planned}" data-category-id="${id}" data-field="planned" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                    </div>
                    ${actionButtons}
                </div>
            `;
        }

        return `
            <div class="spreadsheet-row ${hasTxnActual ? 'ledger-driven-row' : ''}" data-category-id="${id}" data-type="${escapeHtml(cat.type)}">
                ${sharedName}
                <div class="col-planned">
                    <input type="number" class="planned-input budget-editable" value="${planned}" data-category-id="${id}" data-field="planned" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                </div>
                <div class="col-actual">
                    <input type="number" class="actual-input budget-editable ${hasTxnActual ? 'ledger-actual-overridden' : ''}" value="${manualActual}" data-category-id="${id}" data-field="actual" min="0" step="0.01" inputmode="decimal" placeholder="0.00" title="${escapeHtml(actualTitle)}">
                    ${hasTxnActual ? `<span class="ledger-actual-pill" title="Ledger actual used in summary/charts">Tx ${escapeHtml(formatCurrency(transactionActual))}</span>` : ''}
                </div>
                ${actionButtons}
            </div>
        `;
    },

    renderSpreadsheet(containerId, type) {
        const container = this._getSectionContainer(containerId);
        if (!container) return;

        const categories = this._getBudgetCategories().filter(cat => cat.type === type);
        container.innerHTML = categories.map(cat => this._createSpreadsheetRowHtml(cat)).join('');
    },

    renderBudgetSummary() {
        const metrics = this._getBudgetMetrics();

        const elIncome = document.getElementById('summaryTotalIncome');
        const elExpenses = document.getElementById('summaryTotalExpenses');
        const elBills = document.getElementById('summaryTotalBills');
        const elSavings = document.getElementById('summaryTotalSavings');
        const elDebt = document.getElementById('summaryTotalDebt');
        const elRemaining = document.getElementById('summaryRemaining');
        const remainingRow = document.getElementById('remainingRow');

        if (elIncome) elIncome.textContent = formatCurrency(metrics.incomePlanned);
        if (elExpenses) elExpenses.textContent = formatCurrency(metrics.variablePlanned);
        if (elBills) elBills.textContent = formatCurrency(metrics.fixedPlanned);
        if (elSavings) elSavings.textContent = formatCurrency(metrics.savingsPlanned);
        if (elDebt) elDebt.textContent = formatCurrency(metrics.debtPlanned);
        if (elRemaining) elRemaining.textContent = formatCurrency(Math.abs(metrics.plannedBalance));

        if (remainingRow) {
            remainingRow.className = 'summary-row remaining ' + (metrics.plannedBalance >= 0 ? 'positive' : 'negative');
            const label = remainingRow.querySelector('.summary-label');
            if (label) label.textContent = metrics.plannedBalance >= 0 ? 'Left' : 'Over';
        }
    },

    updateHeaderSummary() {
        const metrics = this._getBudgetMetrics();

        [
            ['headerExpenses', metrics.variableActual],
            ['headerBills', metrics.fixedActual],
            ['headerSavings', metrics.savingsActual],
            ['headerDebt', metrics.debtActual]
        ].forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = formatCurrency(value);
        });

        ['headerBalance', 'headerBalanceDesktop'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = formatCurrency(metrics.actualBalance);
            el.style.color = metrics.actualBalance >= 0 ? '#fbbf24' : '#ef4444';
        });
    },

    renderPeriodMeta() {
        const month = Storage.getSelectedMonth();
        const year = Storage.getSelectedYear();
        const periodKey = Storage.getPeriodKey(month, year);
        const budget = Storage.getBudget(month, year);
        const metrics = this._getBudgetMetrics(month, year);

        const periodBadge = document.getElementById('currentPeriodBadge');
        const itemBadge = document.getElementById('itemCountBadge');
        const updatedText = document.getElementById('lastUpdatedText');

        if (periodBadge) periodBadge.textContent = periodKey;
        if (itemBadge) itemBadge.textContent = String(metrics.categoriesCount) + ' items';
        if (updatedText) {
            updatedText.textContent = budget.updatedAt ? ('Last saved: ' + new Date(budget.updatedAt).toLocaleString()) : 'Last saved: not yet';
        }
    },

    renderInsights() {
        const metrics = this._getBudgetMetrics();
        const categories = this._getBudgetCategories();
        const nonIncome = categories.filter(c => c.type !== 'income');

        let largestPlanned = null;
        let largestActual = null;

        nonIncome.forEach(cat => {
            const planned = toNumber(cat.planned, { fallback: 0, min: 0 });
            const actual = toNumber(cat.actualEffective !== undefined ? cat.actualEffective : cat.actual, { fallback: 0, min: 0 });
            if (!largestPlanned || planned > largestPlanned.amount) largestPlanned = { name: cat.name, amount: planned };
            if (!largestActual || actual > largestActual.amount) largestActual = { name: cat.name, amount: actual };
        });

        const healthValue = metrics.actualBalance >= 0 ? 'On track' : 'Over budget';
        const healthTone = metrics.actualBalance >= 0 ? 'good' : 'bad';

        this._setText('insightBudgetHealth', healthValue);
        this._setText('insightPlannedUtilization', metrics.plannedUtilizationPercent.toFixed(1) + '%');
        this._setText('insightActualUtilization', metrics.actualUtilizationPercent.toFixed(1) + '%');
        this._setText('insightLargestPlanned', largestPlanned ? (largestPlanned.name + ' (' + formatCurrency(largestPlanned.amount) + ')') : 'None');
        this._setText('insightLargestActual', largestActual && largestActual.amount > 0 ? (largestActual.name + ' (' + formatCurrency(largestActual.amount) + ')') : 'No actuals yet');

        const healthEl = document.getElementById('insightBudgetHealth');
        if (healthEl) healthEl.dataset.tone = healthTone;
    },

    syncMonthNotes(force = false) {
        const notesInput = document.getElementById('monthNotes');
        if (!notesInput) return;
        if (!force && document.activeElement === notesInput) return;
        notesInput.value = Storage.getBudgetNotes();
        this.updateNotesCounter();
    },

    updateNotesCounter() {
        const notesInput = document.getElementById('monthNotes');
        const counter = document.getElementById('notesCharCount');
        if (!notesInput || !counter) return;
        counter.textContent = String(notesInput.value.length) + '/1000';
    },

    ensureBudgetEventBindings() {
        if (this._budgetEventsBound) return;

        const root = document.querySelector('.financial-overview-section');
        if (!root) return;

        root.addEventListener('focusout', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('.budget-editable')) return;
            this._handleBudgetFieldCommit(target);
        });

        root.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.matches('.category-color-input')) {
                const categoryId = target.dataset.categoryId;
                Storage.updateBudgetCategory(categoryId, 'color', target.value);
                this.refreshBudgetSection();
            }
        });

        root.addEventListener('keydown', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('.budget-editable')) return;
            if (event.key === 'Enter') {
                event.preventDefault();
                target.blur();
            }
        });

        root.addEventListener('click', (event) => {
            const clickTarget = event.target instanceof Element ? event.target : null;
            if (!clickTarget) return;
            const row = clickTarget.closest('.spreadsheet-row');
            if (row && window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
                const isAction = !!clickTarget.closest('.row-delete-btn, .row-add-btn');
                const isInput = !!clickTarget.closest('input, button');
                if (!isAction && isInput) {
                    root.querySelectorAll('.spreadsheet-row[data-actions-open=\"true\"]').forEach(el => {
                        if (el !== row) el.removeAttribute('data-actions-open');
                    });
                    row.setAttribute('data-actions-open', 'true');
                }
            }

            const deleteBtn = clickTarget.closest('.row-delete-btn');
            if (deleteBtn) {
                const categoryId = deleteBtn.dataset.categoryId;
                const category = Storage.getBudgetCategories().find(c => c.id === categoryId);
                const label = category ? category.name : 'this item';
                if (confirm('Delete "' + label + '" from this month?')) {
                    if (Storage.deleteBudgetCategory(categoryId)) {
                        this.refreshBudgetSection();
                        this.renderTransactionCategoryOptions();
                        this.showNotification('Item deleted', 'success');
                    } else {
                        this.showNotification('Unable to delete item', 'error');
                    }
                }
                return;
            }

            const duplicateBtn = clickTarget.closest('.row-add-btn');
            if (duplicateBtn) {
                const categoryId = duplicateBtn.dataset.categoryId;
                const category = Storage.getBudgetCategories().find(c => c.id === categoryId);
                if (!category) return;

                const copy = {
                    ...category,
                    id: generateId(),
                    name: sanitizeText(category.name + ' Copy', { maxLength: 40, fallback: 'Item Copy' })
                };

                if (Storage.addBudgetCategory(copy)) {
                    this.refreshBudgetSection();
                    this.renderTransactionCategoryOptions();
                    this.showNotification('Item duplicated', 'success');
                } else {
                    this.showNotification('Unable to duplicate item', 'error');
                }
                return;
            }

            const addBtn = clickTarget.closest('.add-item-btn');
            if (addBtn && window.App && typeof window.App.openBudgetItemModal === 'function') {
                window.App.openBudgetItemModal(addBtn.dataset.type || 'variable');
            }
        });

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            if (window.matchMedia && !window.matchMedia('(max-width: 767px)').matches) return;
            if (event.target.closest('.financial-overview-section')) return;
            root.querySelectorAll('.spreadsheet-row[data-actions-open=\"true\"]').forEach(el => {
                el.removeAttribute('data-actions-open');
            });
        });

        this._budgetEventsBound = true;
    },

    _handleBudgetFieldCommit(target) {
        const categoryId = target.dataset.categoryId;
        const field = target.dataset.field;
        if (!categoryId || !field) return;

        let value = target.value;
        if (field === 'name') {
            value = sanitizeText(value, { maxLength: 40, fallback: 'Item' });
            target.value = value;
        } else if (field === 'planned' || field === 'actual') {
            value = toNumber(value, { fallback: 0, min: 0, max: 1000000000 });
            target.value = String(value);
        }

        const success = Storage.updateBudgetCategory(categoryId, field, value);
        if (success) {
            this.refreshBudgetSection();
            this.renderTransactionCategoryOptions();
        } else {
            this.showNotification('Unable to save changes', 'error');
        }
    },

    // ---------------- Transaction Ledger ----------------

    syncTransactionFormDefaults() {
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            const current = dateInput.value;
            if (!isValidDateInput(current)) {
                dateInput.value = getTodayDate();
            }
        }
        this.renderTransactionCategoryOptions();
    },

    renderTransactionCategoryOptions() {
        const select = document.getElementById('transactionCategory');
        const typeSelect = document.getElementById('transactionType');
        if (!select || !typeSelect || !window.TransactionManager) return;

        const desiredType = typeSelect.value === 'income' ? 'income' : 'expense';
        const currentValue = select.value;
        const options = TransactionManager.getLedgerCategoryOptions(desiredType);

        select.innerHTML = '';

        if (options.length === 0) {
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = desiredType === 'income' ? 'No income categories in this month' : 'No spending categories in this month';
            placeholder.selected = true;
            select.appendChild(placeholder);
            select.disabled = true;
            return;
        }

        select.disabled = false;
        options.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name + ' (' + capitalize(cat.type) + ')';
            option.dataset.categoryName = cat.name;
            option.dataset.categoryType = cat.type;
            if (cat.id === currentValue) option.selected = true;
            select.appendChild(option);
        });

        if (!select.value && options[0]) {
            select.value = options[0].id;
        }
    },

    getLedgerFiltersFromUI() {
        const type = document.getElementById('ledgerFilterType');
        const search = document.getElementById('ledgerSearch');
        const sort = document.getElementById('ledgerSort');

        return {
            type: type ? type.value : 'all',
            search: search ? search.value : '',
            sort: sort ? sort.value : 'newest'
        };
    },

    renderTransactionLedger() {
        if (!window.TransactionManager) return;
        const filters = this.getLedgerFiltersFromUI();
        const { transactions, summary } = TransactionManager.getPeriodSummary(Storage.getSelectedMonth(), Storage.getSelectedYear(), filters);
        this.renderLedgerSummary(summary);
        this.renderTransactions(transactions);
        this.renderTransactionCategoryOptions();
    },

    renderLedgerSummary(summary) {
        this._setText('ledgerIncomeTotal', formatCurrency(summary.totalIncome));
        this._setText('ledgerExpenseTotal', formatCurrency(summary.totalExpenses));
        this._setText('ledgerBalanceTotal', formatCurrency(summary.balance));
        this._setText('ledgerTransactionCount', String(summary.transactionCount));

        const balanceEl = document.getElementById('ledgerBalanceTotal');
        if (balanceEl) {
            balanceEl.style.color = summary.balance >= 0 ? '#22c55e' : '#ef4444';
        }
    },

    renderTransactions(transactions) {
        const list = document.getElementById('transactionsList');
        const emptyState = document.getElementById('emptyState');
        if (!list) return;

        const itemsHtml = transactions.map(t => this.createTransactionElement(t)).join('');
        list.innerHTML = itemsHtml;

        if (emptyState) {
            emptyState.hidden = transactions.length !== 0;
        }
    },

    createTransactionElement(transaction) {
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        const budgetTypeLabel = transaction.budgetType ? capitalize(transaction.budgetType) : (transaction.type === 'income' ? 'Income' : 'Expense');

        return `
            <div class="transaction-item" data-id="${escapeHtml(transaction.id)}">
                <div class="transaction-type-indicator ${escapeHtml(transaction.type)}"></div>
                <div class="transaction-info">
                    <span class="transaction-description">${escapeHtml(transaction.description)}</span>
                    <span class="transaction-category">${escapeHtml(transaction.category)} • ${escapeHtml(budgetTypeLabel)}</span>
                </div>
                <span class="transaction-date">${escapeHtml(formatDate(transaction.date))}</span>
                <span class="transaction-amount ${escapeHtml(transaction.type)}">${escapeHtml(amountPrefix + formatCurrency(transaction.amount))}</span>
                <button type="button" class="delete-btn" data-id="${escapeHtml(transaction.id)}" aria-label="Delete transaction">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
        `;
    },

    removeTransactionElement(id) {
        const safeId = String(id || '').replace(/"/g, '');
        const item = document.querySelector('.transaction-item[data-id="' + safeId + '"]');
        if (item) {
            item.classList.add('removing');
            setTimeout(() => item.remove(), 200);
        }
    },

    clearLedgerFilters() {
        const type = document.getElementById('ledgerFilterType');
        const search = document.getElementById('ledgerSearch');
        const sort = document.getElementById('ledgerSort');
        if (type) type.value = 'all';
        if (search) search.value = '';
        if (sort) sort.value = 'newest';
    },

    // ---------------- Generic Helpers ----------------

    _setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value ?? '');
    },

    updateCharts() {
        ChartManager.updateCharts();
    },

    renderSummary() {
        this.renderBudgetSummary();
    },

    renderCategoryDatalist() {},
    renderCategoriesList() {},
    scrollToTop() {},

    focusInput(inputId) {
        const input = document.getElementById(inputId);
        if (input) input.focus();
    },

    setButtonLoading(button, loading) {
        if (!button) return;
        if (loading) {
            button.disabled = true;
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            button.innerHTML = 'Working...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
        }
    },

    addAnimationStyles() {}
};

window.UI = UI;

