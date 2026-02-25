// Main Application Module (Budget Dashboard + Transaction Ledger)

const App = {
    _notesSaveHandler: null,
    _ledgerFilterRefresh: null,
    _activePeriodKey: null,

    init() {
        if (!Storage.isAvailable()) {
            UI.showNotification('Local storage is unavailable. Changes will not persist.', 'error');
        }

        this.initThemePresetSelector();
        this.initCurrencySelector();
        this.initPeriodSelectors();
        this.initBudgetItemModal();
        this.initTransactionLedger();
        this.initDataTools();
        this.initNotes();
        this.initGlobalEvents();

        this.refreshAll({ forceNotesSync: true });
        console.log('Budget dashboard initialized');
    },

    initThemePresetSelector() {
        const selector = document.getElementById('uiThemePreset');
        const initialPreset = typeof Storage.getUIThemePreset === 'function' ? Storage.getUIThemePreset() : 'corporate';

        this.applyUIThemePreset(initialPreset);

        if (!selector) return;

        selector.value = initialPreset;
        selector.addEventListener('change', (event) => {
            const requestedPreset = event.target && event.target.value ? String(event.target.value) : 'corporate';
            Storage.setUIThemePreset(requestedPreset);
            const appliedPreset = Storage.getUIThemePreset();
            selector.value = appliedPreset;
            this.applyUIThemePreset(appliedPreset);

            const selectedLabel = selector.options[selector.selectedIndex] ? selector.options[selector.selectedIndex].textContent : 'Theme';
            UI.showNotification('Interface theme changed to ' + selectedLabel, 'success');
        });
    },

    applyUIThemePreset(preset) {
        const safePreset = typeof Storage.getUIThemePreset === 'function'
            ? (Storage.UI_THEME_PRESETS && Storage.UI_THEME_PRESETS.includes(preset) ? preset : Storage.getUIThemePreset())
            : 'corporate';

        if (document.documentElement) {
            document.documentElement.setAttribute('data-ui-theme', safePreset);
        }
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
                this.refreshAll({ forceNotesSync: true, forceTransactionDateSync: true });
            });
        }

        if (yearSelector) {
            yearSelector.addEventListener('change', (event) => {
                Storage.setSelectedYear(parseInt(event.target.value, 10));
                this.refreshAll({ forceNotesSync: true, forceTransactionDateSync: true });
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
        const closeModal = () => UI.hideModal('budgetItemModal');

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
        setTimeout(() => form.budgetItemName.focus(), 0);
    },

    handleBudgetItemSubmit(form) {
        const type = ['income', 'variable', 'fixed', 'savings', 'debt'].includes(form.budgetItemType.value)
            ? form.budgetItemType.value
            : 'variable';

        const name = sanitizeText(form.budgetItemName.value, { maxLength: 40, fallback: '' });
        const planned = toNumber(form.budgetItemPlanned.value, { fallback: 0, min: 0, max: 1000000000 });
        const actual = type === 'income' ? 0 : toNumber(form.budgetItemActual.value, { fallback: 0, min: 0, max: 1000000000 });
        const color = normalizeHexColor(form.budgetItemColor.value, '#4299e1');

        if (!name) {
            UI.showNotification('Please enter a valid item name', 'error');
            form.budgetItemName.focus();
            return;
        }

        const success = Storage.addBudgetCategory({ id: generateId(), name, type, color, planned, actual });
        if (!success) {
            UI.showNotification('Could not add item (limit reached or storage error)', 'error');
            return;
        }

        UI.hideModal('budgetItemModal');
        this.refreshAll();
        UI.showNotification('Budget item added', 'success');
    },

    initTransactionLedger() {
        const form = document.getElementById('transactionForm');
        const typeSelect = document.getElementById('transactionType');
        const filtersRoot = document.getElementById('ledgerFilters');
        const clearBtn = document.getElementById('ledgerClearFilters');
        const list = document.getElementById('transactionsList');

        this._ledgerFilterRefresh = debounce(() => {
            UI.renderTransactionLedger();
        }, 200);

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleTransactionSubmit(form);
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                UI.renderTransactionCategoryOptions();
            });
        }

        if (filtersRoot) {
            filtersRoot.addEventListener('input', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && target.matches('#ledgerSearch')) {
                    this._ledgerFilterRefresh();
                }
            });
            filtersRoot.addEventListener('change', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && target.matches('#ledgerFilterType, #ledgerSort')) {
                    UI.renderTransactionLedger();
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                UI.clearLedgerFilters();
                UI.renderTransactionLedger();
                UI.showNotification('Ledger filters cleared', 'success');
            });
        }

        if (list) {
            list.addEventListener('click', (event) => {
                const clickTarget = event.target instanceof Element ? event.target : null;
                if (!clickTarget) return;
                const deleteBtn = clickTarget.closest('.delete-btn');
                if (!deleteBtn) return;
                const id = deleteBtn.dataset.id;
                if (id) this.handleDeleteTransaction(id);
            });
        }
    },

    getDefaultTransactionDateForSelectedPeriod() {
        const month = Storage.getSelectedMonth();
        const year = Storage.getSelectedYear();
        const today = new Date();
        if (today.getMonth() === month && today.getFullYear() === year) {
            return getTodayDate();
        }
        return formatDateForInput(new Date(year, month, 1));
    },

    syncTransactionForm(forceDate = false) {
        const dateInput = document.getElementById('transactionDate');
        if (dateInput && (forceDate || !isValidDateInput(dateInput.value))) {
            dateInput.value = this.getDefaultTransactionDateForSelectedPeriod();
        }
        UI.renderTransactionCategoryOptions();
    },

    handleTransactionSubmit(form) {
        const categorySelect = document.getElementById('transactionCategory');
        const selectedOption = categorySelect && categorySelect.options[categorySelect.selectedIndex];

        if (!categorySelect || categorySelect.disabled || !categorySelect.value || !selectedOption) {
            UI.showNotification('Create a matching budget category first', 'error');
            return;
        }

        const payload = {
            amount: form.transactionAmount.value,
            type: form.transactionType.value,
            budgetCategoryId: categorySelect.value,
            budgetType: selectedOption.dataset.categoryType,
            category: selectedOption.dataset.categoryName || selectedOption.textContent,
            description: form.transactionDescription.value,
            date: form.transactionDate.value
        };

        if (!isValidDateInput(payload.date)) {
            UI.showNotification('Choose a valid transaction date', 'error');
            return;
        }

        const selectedMonth = Storage.getSelectedMonth();
        const selectedYear = Storage.getSelectedYear();
        const txnDate = new Date(payload.date);
        if (txnDate.getMonth() !== selectedMonth || txnDate.getFullYear() !== selectedYear) {
            UI.showNotification('Transaction date must be within the selected month and year', 'error');
            return;
        }

        const result = TransactionManager.add(payload);
        if (!result.success) {
            const errorMap = {
                invalid_amount: 'Enter a valid transaction amount',
                invalid_type: 'Choose a valid transaction type',
                storage_error: 'Could not save transaction'
            };
            UI.showNotification(errorMap[result.error] || 'Could not save transaction', 'error');
            return;
        }

        form.transactionAmount.value = '';
        form.transactionDescription.value = '';
        if (!isValidDateInput(form.transactionDate.value)) {
            form.transactionDate.value = this.getDefaultTransactionDateForSelectedPeriod();
        }

        this.refreshAll();
        UI.showNotification('Transaction added', 'success');
        UI.focusInput('transactionAmount');
    },

    handleDeleteTransaction(id) {
        const txn = TransactionManager.getById(id);
        if (!txn) {
            UI.showNotification('Transaction not found', 'error');
            return;
        }

        const message = 'Delete ' + txn.description + ' (' + formatCurrency(txn.amount) + ')?';
        if (!confirm(message)) return;

        const result = TransactionManager.delete(id);
        if (result.success) {
            this.refreshAll();
            UI.showNotification('Transaction deleted', 'success');
        } else {
            UI.showNotification('Could not delete transaction', 'error');
        }
    },

    initDataTools() {
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importInput = document.getElementById('importDataInput');
        const copyPrevBtn = document.getElementById('copyPrevMonthBtn');
        const resetBtn = document.getElementById('resetCurrentMonthBtn');
        const clearAllBtn = document.getElementById('clearAllDataBtn');
        const encryptToggle = document.getElementById('backupEncryptToggle');
        const passphraseInput = document.getElementById('backupPassphrase');

        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                await this.handleExportData();
            });
        }

        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
        }

        if (importInput) {
            importInput.addEventListener('change', async (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                await this.handleImportData(file);
                importInput.value = '';
            });
        }

        if (copyPrevBtn) copyPrevBtn.addEventListener('click', () => this.handleCopyPreviousMonth());
        if (resetBtn) resetBtn.addEventListener('click', () => this.handleResetCurrentMonth());
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.handleClearAllData());

        if (encryptToggle && passphraseInput) {
            const syncState = () => {
                passphraseInput.disabled = !encryptToggle.checked;
                if (!encryptToggle.checked) {
                    passphraseInput.value = '';
                }
            };
            encryptToggle.addEventListener('change', syncState);
            syncState();
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
        const { forceNotesSync = false, forceTransactionDateSync = false } = options;
        const month = Storage.getSelectedMonth();
        const year = Storage.getSelectedYear();
        const periodKey = Storage.getPeriodKey(month, year);

        Storage.ensureBudgetPeriod(month, year);
        this.renderYearSelectorOptions();
        UI.updateMonthSelector(month, year);
        UI.renderBudgetSection();
        this.syncTransactionForm(forceTransactionDateSync || this._activePeriodKey !== periodKey);
        UI.renderTransactionLedger();

        if (forceNotesSync || this._activePeriodKey !== periodKey) {
            UI.syncMonthNotes(true);
        } else {
            UI.syncMonthNotes(false);
        }

        this._activePeriodKey = periodKey;
    },

    getPreviousPeriod(month, year) {
        const previous = new Date(year, month - 1, 1);
        return { month: previous.getMonth(), year: previous.getFullYear() };
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
        if (!confirm('Reset all budget items and notes for ' + periodKey + '?')) return;

        const success = Storage.resetBudgetPeriod();
        if (success) {
            this.refreshAll({ forceNotesSync: true, forceTransactionDateSync: true });
            UI.showNotification('Current month reset', 'success');
        } else {
            UI.showNotification('Unable to reset current month', 'error');
        }
    },

    handleClearAllData() {
        if (!confirm('Clear ALL saved finance data (all months, preferences, transactions, and backups in this browser)?')) return;
        if (!confirm('This cannot be undone. Continue?')) return;

        Storage.clearAll();
        this.refreshAll({ forceNotesSync: true, forceTransactionDateSync: true });
        UI.showNotification('All local data cleared', 'success');
    },

    isBackupEncryptionEnabled() {
        const toggle = document.getElementById('backupEncryptToggle');
        return !!(toggle && toggle.checked);
    },

    getBackupPassphrase() {
        const input = document.getElementById('backupPassphrase');
        return input ? input.value : '';
    },

    async buildExportPayload() {
        const plainJson = Storage.exportData();

        if (!this.isBackupEncryptionEnabled()) {
            return {
                filename: 'finance-backup-' + new Date().toISOString().slice(0, 10) + '.json',
                contentType: 'application/json',
                body: plainJson,
                encrypted: false
            };
        }

        const passphrase = this.getBackupPassphrase();
        if (!passphrase) {
            throw new Error('Enter a passphrase or turn off encryption');
        }

        const encryptedWrapper = await encryptBackupJson(plainJson, passphrase);
        return {
            filename: 'finance-backup-encrypted-' + new Date().toISOString().slice(0, 10) + '.json',
            contentType: 'application/json',
            body: JSON.stringify(encryptedWrapper, null, 2),
            encrypted: true
        };
    },

    async handleExportData() {
        try {
            const payload = await this.buildExportPayload();
            const blob = new Blob([payload.body], { type: payload.contentType });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');

            anchor.href = url;
            anchor.download = payload.filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);

            UI.showNotification(payload.encrypted ? 'Encrypted backup exported' : 'Backup exported', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            UI.showNotification(error.message || 'Failed to export backup', 'error');
        }
    },

    async maybeDecryptImportedBackup(text) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            return { plaintextJson: text, encrypted: false };
        }

        if (!parsed || typeof parsed !== 'object' || !parsed.encryptedBackup) {
            return { plaintextJson: text, encrypted: false };
        }

        let passphrase = this.getBackupPassphrase();
        if (!passphrase) {
            passphrase = prompt('This backup is encrypted. Enter the passphrase to import:') || '';
        }
        if (!passphrase) {
            throw new Error('Passphrase is required to import this encrypted backup');
        }

        const plaintextJson = await decryptBackupJson(parsed, passphrase);
        return { plaintextJson, encrypted: true };
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
            const { plaintextJson, encrypted } = await this.maybeDecryptImportedBackup(text);
            const result = Storage.importData(plaintextJson);

            if (result.success) {
                this.refreshAll({ forceNotesSync: true, forceTransactionDateSync: true });
                UI.showNotification((encrypted ? 'Encrypted backup imported. ' : '') + result.message, 'success');
            } else {
                UI.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Import failed:', error);
            UI.showNotification(error.message || 'Failed to read the selected file', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;

