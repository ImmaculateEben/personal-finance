// Main Application Module (Budget Dashboard)

const App = {
    _notesSaveHandler: null,
    _activePeriodKey: null,

    init() {
        if (!Storage.isAvailable()) {
            UI.showNotification('Local storage is unavailable. Changes will not persist.', 'error');
        }

        this.initCurrencySelector();
        this.initPeriodSelectors();
        this.initBudgetItemModal();
        this.initDataTools();
        this.initNotes();
        this.initGlobalEvents();

        this.refreshAll({ forceNotesSync: true });
        console.log('Budget dashboard initialized');
    },

    initCurrencySelector() {
        const selector = document.getElementById('currencySelector');
        if (!selector) return;

        selector.innerHTML = '';
        const currencies = Storage.getCurrencies();
        const savedCurrency = Storage.getCurrency();

        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.code;
            option.textContent = currency.code + ' - ' + currency.name;
            option.selected = currency.code === savedCurrency;
            selector.appendChild(option);
        });

        selector.addEventListener('change', (event) => {
            Storage.setCurrency(event.target.value);
            this.refreshAll();
            const info = Storage.getCurrencyInfo(event.target.value);
            UI.showNotification('Currency changed to ' + info.name, 'success');
        });
    },

    initPeriodSelectors() {
        const monthSelector = document.getElementById('monthSelector');
        const yearSelector = document.getElementById('yearSelector');

        if (monthSelector) {
            monthSelector.addEventListener('change', (event) => {
                Storage.setSelectedMonth(parseInt(event.target.value, 10));
                this.refreshAll({ forceNotesSync: true });
            });
        }

        if (yearSelector) {
            yearSelector.addEventListener('change', (event) => {
                Storage.setSelectedYear(parseInt(event.target.value, 10));
                this.refreshAll({ forceNotesSync: true });
            });
        }

        this.renderYearSelectorOptions();
    },

    renderYearSelectorOptions() {
        const yearSelector = document.getElementById('yearSelector');
        if (!yearSelector) return;

        const selectedYear = Storage.getSelectedYear();
        const years = Storage.getAvailableBudgetYears();
        if (!years.includes(selectedYear)) {
            years.push(selectedYear);
            years.sort((a, b) => a - b);
        }

        yearSelector.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            option.selected = year === selectedYear;
            yearSelector.appendChild(option);
        });
    },

    initBudgetItemModal() {
        const modal = document.getElementById('budgetItemModal');
        if (!modal) return;

        const cancelBtn = document.getElementById('cancelBudgetItem');
        const closeBtn = document.getElementById('closeBudgetItemModal');
        const form = document.getElementById('budgetItemForm');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            UI.hideModal('budgetItemModal');
        };

        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleBudgetItemSubmit(form);
            });
        }
    },

    openBudgetItemModal(type) {
        const safeType = ['income', 'variable', 'fixed', 'savings', 'debt'].includes(type) ? type : 'variable';
        const form = document.getElementById('budgetItemForm');
        if (!form) return;

        form.reset();
        form.budgetItemType.value = safeType;
        form.budgetItemName.value = '';
        form.budgetItemPlanned.value = '';
        form.budgetItemActual.value = '';

        const actualFieldGroup = document.getElementById('actualFieldGroup');
        if (actualFieldGroup) {
            actualFieldGroup.style.display = safeType === 'income' ? 'none' : 'block';
        }

        const typeColors = {
            income: '#22c55e',
            variable: '#ec4899',
            fixed: '#ef4444',
            savings: '#3b82f6',
            debt: '#8b5cf6'
        };
        form.budgetItemColor.value = typeColors[safeType] || '#4299e1';

        UI.showModal('budgetItemModal');
        setTimeout(() => {
            form.budgetItemName.focus();
        }, 0);
    },

    handleBudgetItemSubmit(form) {
        const type = ['income', 'variable', 'fixed', 'savings', 'debt'].includes(form.budgetItemType.value)
            ? form.budgetItemType.value
            : 'variable';

        const name = sanitizeText(form.budgetItemName.value, { maxLength: 40, fallback: '' });
        const planned = toNumber(form.budgetItemPlanned.value, { fallback: 0, min: 0, max: 1000000000 });
        const actual = type === 'income'
            ? 0
            : toNumber(form.budgetItemActual.value, { fallback: 0, min: 0, max: 1000000000 });
        const color = normalizeHexColor(form.budgetItemColor.value, '#4299e1');

        if (!name) {
            UI.showNotification('Please enter a valid item name', 'error');
            form.budgetItemName.focus();
            return;
        }

        if (planned < 0 || actual < 0) {
            UI.showNotification('Amounts cannot be negative', 'error');
            return;
        }

        const success = Storage.addBudgetCategory({
            id: generateId(),
            name,
            type,
            color,
            planned,
            actual
        });

        if (!success) {
            UI.showNotification('Could not add item (limit reached or storage error)', 'error');
            return;
        }

        UI.hideModal('budgetItemModal');
        this.refreshAll();
        UI.showNotification('Budget item added', 'success');
    },

    initDataTools() {
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importInput = document.getElementById('importDataInput');
        const copyPrevBtn = document.getElementById('copyPrevMonthBtn');
        const resetBtn = document.getElementById('resetCurrentMonthBtn');
        const clearAllBtn = document.getElementById('clearAllDataBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExportData();
            });
        }

        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });
        }

        if (importInput) {
            importInput.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;

                await this.handleImportData(file);
                importInput.value = '';
            });
        }

        if (copyPrevBtn) {
            copyPrevBtn.addEventListener('click', () => {
                this.handleCopyPreviousMonth();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.handleResetCurrentMonth();
            });
        }

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.handleClearAllData();
            });
        }
    },

    initNotes() {
        const notesInput = document.getElementById('monthNotes');
        if (!notesInput) return;

        this._notesSaveHandler = debounce(() => {
            Storage.setBudgetNotes(notesInput.value);
            UI.renderPeriodMeta();
            UI.updateNotesCounter();
        }, 300);

        notesInput.addEventListener('input', () => {
            UI.updateNotesCounter();
            this._notesSaveHandler();
        });
    },

    initGlobalEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const modal = document.getElementById('budgetItemModal');
                if (modal && modal.classList.contains('show')) {
                    UI.hideModal('budgetItemModal');
                }
            }
        });

        window.addEventListener('resize', debounce(() => {
            ChartManager.updateBudgetCharts();
        }, 150));
    },

    refreshAll(options = {}) {
        const { forceNotesSync = false } = options;
        const month = Storage.getSelectedMonth();
        const year = Storage.getSelectedYear();
        const periodKey = Storage.getPeriodKey(month, year);

        Storage.ensureBudgetPeriod(month, year);
        this.renderYearSelectorOptions();
        UI.updateMonthSelector(month, year);
        UI.renderBudgetSection();

        if (forceNotesSync || this._activePeriodKey !== periodKey) {
            UI.syncMonthNotes(true);
        } else {
            UI.syncMonthNotes(false);
        }

        this._activePeriodKey = periodKey;
    },

    getPreviousPeriod(month, year) {
        const previous = new Date(year, month - 1, 1);
        return {
            month: previous.getMonth(),
            year: previous.getFullYear()
        };
    },

    handleCopyPreviousMonth() {
        const month = Storage.getSelectedMonth();
        const year = Storage.getSelectedYear();
        const previous = this.getPreviousPeriod(month, year);

        const sourceKey = Storage.getPeriodKey(previous.month, previous.year);
        const targetKey = Storage.getPeriodKey(month, year);

        if (!Storage.listBudgetPeriods().includes(sourceKey)) {
            UI.showNotification('No saved budget found for ' + sourceKey, 'error');
            return;
        }

        if (!confirm('Copy budget categories from ' + sourceKey + ' into ' + targetKey + '? This will overwrite the current month data.')) {
            return;
        }

        const success = Storage.copyBudgetPeriod(previous.month, previous.year, month, year, { includeNotes: false });
        if (success) {
            this.refreshAll({ forceNotesSync: true });
            UI.showNotification('Copied budget from ' + sourceKey, 'success');
        } else {
            UI.showNotification('Unable to copy previous month', 'error');
        }
    },

    handleResetCurrentMonth() {
        const periodKey = Storage.getPeriodKey();
        if (!confirm('Reset all budget items and notes for ' + periodKey + '?')) {
            return;
        }

        const success = Storage.resetBudgetPeriod();
        if (success) {
            this.refreshAll({ forceNotesSync: true });
            UI.showNotification('Current month reset', 'success');
        } else {
            UI.showNotification('Unable to reset current month', 'error');
        }
    },

    handleClearAllData() {
        if (!confirm('Clear ALL saved finance data (all months, preferences, and backups in this browser)?')) {
            return;
        }
        if (!confirm('This cannot be undone. Continue?')) {
            return;
        }

        Storage.clearAll();
        this.refreshAll({ forceNotesSync: true });
        UI.showNotification('All local data cleared', 'success');
    },

    handleExportData() {
        const json = Storage.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);

        anchor.href = url;
        anchor.download = 'finance-backup-' + stamp + '.json';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        UI.showNotification('Backup exported', 'success');
    },

    async handleImportData(file) {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            UI.showNotification('Backup file is too large (max 5MB)', 'error');
            return;
        }

        const confirmImport = confirm('Import backup file and replace matching saved data in this browser?');
        if (!confirmImport) return;

        try {
            const text = await file.text();
            const result = Storage.importData(text);

            if (result.success) {
                this.refreshAll({ forceNotesSync: true });
                UI.showNotification(result.message, 'success');
            } else {
                UI.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Import failed:', error);
            UI.showNotification('Failed to read the selected file', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
