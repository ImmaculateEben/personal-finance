// UI Rendering Module (Budget Dashboard)

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

        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
        }

        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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

        if (monthSelector) {
            monthSelector.value = String(monthIndex);
        }
        if (yearSelector && year !== undefined) {
            yearSelector.value = String(year);
        }
        if (title) {
            title.textContent = monthNames[monthIndex] + ' ' + year + ' Budget Dashboard';
        }
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
        const container = document.getElementById(containerId);
        return container || null;
    },

    _createSpreadsheetRowHtml(cat) {
        const id = escapeHtml(cat.id);
        const name = escapeHtml(cat.name || '');
        const color = normalizeHexColor(cat.color, '#4299e1');
        const planned = toNumber(cat.planned, { fallback: 0, min: 0 });
        const actual = toNumber(cat.actual, { fallback: 0, min: 0 });

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
            <div class="spreadsheet-row" data-category-id="${id}" data-type="${escapeHtml(cat.type)}">
                ${sharedName}
                <div class="col-planned">
                    <input type="number" class="planned-input budget-editable" value="${planned}" data-category-id="${id}" data-field="planned" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                </div>
                <div class="col-actual">
                    <input type="number" class="actual-input budget-editable" value="${actual}" data-category-id="${id}" data-field="actual" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                </div>
                ${actionButtons}
            </div>
        `;
    },

    renderSpreadsheet(containerId, type) {
        const container = this._getSectionContainer(containerId);
        if (!container) return;

        const categories = Storage.getBudgetCategoriesByType(type);
        container.innerHTML = categories.map(cat => this._createSpreadsheetRowHtml(cat)).join('');
    },

    renderBudgetSummary() {
        const metrics = Storage.getBudgetMetrics();

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

        if (elRemaining) {
            elRemaining.textContent = formatCurrency(Math.abs(metrics.plannedBalance));
        }

        if (remainingRow) {
            remainingRow.className = 'summary-row remaining ' + (metrics.plannedBalance >= 0 ? 'positive' : 'negative');
            const label = remainingRow.querySelector('.summary-label');
            if (label) {
                label.textContent = metrics.plannedBalance >= 0 ? 'Left' : 'Over';
            }
        }
    },

    updateHeaderSummary() {
        const metrics = Storage.getBudgetMetrics();

        const mappings = [
            ['headerExpenses', metrics.variableActual],
            ['headerBills', metrics.fixedActual],
            ['headerSavings', metrics.savingsActual],
            ['headerDebt', metrics.debtActual]
        ];

        mappings.forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = formatCurrency(value);
            }
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
        const metrics = Storage.getBudgetMetrics(month, year);

        const periodBadge = document.getElementById('currentPeriodBadge');
        const itemBadge = document.getElementById('itemCountBadge');
        const updatedText = document.getElementById('lastUpdatedText');

        if (periodBadge) {
            periodBadge.textContent = periodKey;
        }
        if (itemBadge) {
            itemBadge.textContent = String(metrics.categoriesCount) + ' items';
        }
        if (updatedText) {
            updatedText.textContent = budget.updatedAt ? ('Last saved: ' + new Date(budget.updatedAt).toLocaleString()) : 'Last saved: not yet';
        }
    },

    renderInsights() {
        const metrics = Storage.getBudgetMetrics();
        const categories = Storage.getBudgetCategories();
        const nonIncome = categories.filter(c => c.type !== 'income');

        let largestPlanned = null;
        let largestActual = null;

        nonIncome.forEach(cat => {
            const planned = toNumber(cat.planned, { fallback: 0, min: 0 });
            const actual = toNumber(cat.actual, { fallback: 0, min: 0 });

            if (!largestPlanned || planned > largestPlanned.amount) {
                largestPlanned = { name: cat.name, amount: planned };
            }
            if (!largestActual || actual > largestActual.amount) {
                largestActual = { name: cat.name, amount: actual };
            }
        });

        const healthValue = metrics.actualBalance >= 0 ? 'On track' : 'Over budget';
        const healthTone = metrics.actualBalance >= 0 ? 'good' : 'bad';

        this._setText('insightBudgetHealth', healthValue);
        this._setText('insightPlannedUtilization', metrics.plannedUtilizationPercent.toFixed(1) + '%');
        this._setText('insightActualUtilization', metrics.actualUtilizationPercent.toFixed(1) + '%');
        this._setText('insightLargestPlanned', largestPlanned ? (largestPlanned.name + ' (' + formatCurrency(largestPlanned.amount) + ')') : 'None');
        this._setText('insightLargestActual', largestActual && largestActual.amount > 0 ? (largestActual.name + ' (' + formatCurrency(largestActual.amount) + ')') : 'No actuals yet');

        const healthEl = document.getElementById('insightBudgetHealth');
        if (healthEl) {
            healthEl.dataset.tone = healthTone;
        }
    },

    syncMonthNotes(force = false) {
        const notesInput = document.getElementById('monthNotes');
        if (!notesInput) return;

        if (!force && document.activeElement === notesInput) {
            return;
        }

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
                return;
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

            const deleteBtn = clickTarget.closest('.row-delete-btn');
            if (deleteBtn) {
                const categoryId = deleteBtn.dataset.categoryId;
                const category = Storage.getBudgetCategories().find(c => c.id === categoryId);
                const label = category ? category.name : 'this item';

                if (confirm('Delete "' + label + '" from this month?')) {
                    if (Storage.deleteBudgetCategory(categoryId)) {
                        this.refreshBudgetSection();
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
        } else {
            this.showNotification('Unable to save changes', 'error');
        }
    },

    _setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = String(value ?? '');
        }
    },

    // Compatibility helpers retained for older code paths
    updateCharts() {
        ChartManager.updateCharts();
    },

    renderSummary() {
        this.renderBudgetSummary();
    },

    renderTransactions() {},
    removeTransactionElement() {},
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
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.innerHTML = 'Working...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    },

    addAnimationStyles() {}
};

window.UI = UI;
