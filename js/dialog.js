/**
 * dialog.js — Themed custom dialog system (confirm / alert / prompt)
 * Replaces native browser confirm(), alert(), and prompt() with beautiful
 * themed modals that follow the app's CSS variable design system.
 *
 * API:
 *   await Dialog.confirm('Are you sure?')           → true | false
 *   await Dialog.alert('Something went wrong', 'error')   → void
 *   await Dialog.prompt('Enter name:', 'default')   → string | null
 */

; (function () {
    'use strict';

    /* ── Constants ─────────────────────────────────────────── */
    const OVERLAY_ID = 'dialogSystemOverlay';
    const ANIM_IN_MS = 220;
    const ANIM_OUT_MS = 180;

    /* Icon SVG paths by variant */
    const ICONS = {
        warning: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
        error: `<circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
        success: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>`,
        info: `<circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
        question: `<circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
        prompt: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
    };

    const ACCENT_COLOURS = {
        warning: 'var(--warning-color, #f59e0b)',
        error: 'var(--danger-color,  #ef4444)',
        success: 'var(--success-color, #10d9a0)',
        info: 'var(--info-color,    #38bdf8)',
        question: 'var(--primary-color, #00c9a7)',
        prompt: 'var(--primary-color, #00c9a7)',
    };

    /* ── Singleton overlay ─────────────────────────────────── */
    function getOverlay() {
        let el = document.getElementById(OVERLAY_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = OVERLAY_ID;
            el.className = 'dialog-system-overlay';
            document.body.appendChild(el);
        }
        return el;
    }

    /* ── Build dialog markup ───────────────────────────────── */
    function buildDialog({ type = 'info', title, message, confirmLabel = 'OK',
        cancelLabel = 'Cancel', showCancel = false,
        showInput = false, inputPlaceholder = '', inputDefault = '',
        accent }) {
        const colour = accent || ACCENT_COLOURS[type] || ACCENT_COLOURS.info;
        const iconPath = ICONS[type] || ICONS.info;

        const wrap = document.createElement('div');
        wrap.className = 'dialog-box dialog-entering';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-labelledby', 'dialogTitle');
        wrap.setAttribute('aria-describedby', 'dialogMessage');

        wrap.innerHTML = `
            <div class="dialog-icon-wrap" style="--dialog-accent:${colour}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="dialog-icon">
                    ${iconPath}
                </svg>
            </div>
            <div class="dialog-body">
                ${title ? `<h3 class="dialog-title" id="dialogTitle">${escapeHtml(title)}</h3>` : ''}
                <p  class="dialog-message" id="dialogMessage">${escapeHtml(message)}</p>
                ${showInput ? `
                  <input type="text"
                         class="dialog-input"
                         id="dialogInput"
                         placeholder="${escapeHtml(inputPlaceholder)}"
                         value="${escapeHtml(inputDefault)}"
                         autocomplete="off">
                ` : ''}
            </div>
            <div class="dialog-actions">
                ${showCancel ? `
                  <button type="button" class="dialog-btn dialog-btn-cancel" id="dialogCancel">
                    ${escapeHtml(cancelLabel)}
                  </button>
                ` : ''}
                <button type="button" class="dialog-btn dialog-btn-confirm"
                        id="dialogConfirm"
                        style="--dialog-accent:${colour}">
                    ${escapeHtml(confirmLabel)}
                </button>
            </div>`;

        return wrap;
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ── Core show function ────────────────────────────────── */
    function show(options) {
        return new Promise((resolve) => {
            const overlay = getOverlay();
            const dialog = buildDialog(options);

            // Close previous if open (shouldn't normally happen but safety net)
            overlay.innerHTML = '';
            overlay.appendChild(dialog);
            overlay.classList.add('dialog-system-overlay--visible');

            // Trigger enter animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => dialog.classList.remove('dialog-entering'));
            });

            /* Focus management */
            const confirmBtn = dialog.querySelector('#dialogConfirm');
            const cancelBtn = dialog.querySelector('#dialogCancel');
            const input = dialog.querySelector('#dialogInput');

            if (input) {
                setTimeout(() => { input.focus(); input.select(); }, ANIM_IN_MS);
            } else {
                setTimeout(() => confirmBtn && confirmBtn.focus(), ANIM_IN_MS);
            }

            /* Cleanup helper */
            function close(result) {
                dialog.classList.add('dialog-leaving');
                overlay.classList.remove('dialog-system-overlay--visible');
                setTimeout(() => {
                    overlay.innerHTML = '';
                    resolve(result);
                }, ANIM_OUT_MS);
            }

            /* Confirm */
            confirmBtn && confirmBtn.addEventListener('click', () => {
                if (options.showInput) {
                    const val = input ? input.value : null;
                    close(val);
                } else {
                    close(true);
                }
            });

            /* Cancel */
            cancelBtn && cancelBtn.addEventListener('click', () => close(false));

            /* Click overlay backdrop */
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(options.showCancel ? false : (options.showInput ? null : undefined));
            }, { once: true });

            /* Keyboard */
            function onKey(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', onKey);
                    close(options.showCancel ? false : (options.showInput ? null : undefined));
                }
                if (e.key === 'Enter' && !options.showInput) {
                    document.removeEventListener('keydown', onKey);
                    close(true);
                }
                if (e.key === 'Enter' && options.showInput && e.target === input) {
                    document.removeEventListener('keydown', onKey);
                    close(input ? input.value : null);
                }
            }
            document.addEventListener('keydown', onKey);
        });
    }

    /* ── Public API ────────────────────────────────────────── */
    const Dialog = {
        /**
         * Themed confirm dialog.
         * @param {string} message
         * @param {object} [opts] — type:'warning'|'error'|'question', title, confirmLabel, cancelLabel
         * @returns {Promise<boolean>}
         */
        confirm(message, opts = {}) {
            return show({
                type: opts.type || 'question',
                title: opts.title || null,
                message,
                confirmLabel: opts.confirmLabel || 'Confirm',
                cancelLabel: opts.cancelLabel || 'Cancel',
                showCancel: true,
                showInput: false,
            });
        },

        /**
         * Themed alert / notification dialog.
         * @param {string} message
         * @param {string} [type] — 'info'|'success'|'warning'|'error'
         * @param {object} [opts]
         * @returns {Promise<void>}
         */
        alert(message, type = 'info', opts = {}) {
            return show({
                type,
                title: opts.title || null,
                message,
                confirmLabel: opts.label || 'OK',
                showCancel: false,
                showInput: false,
            });
        },

        /**
         * Themed prompt dialog with an input field.
         * @param {string} message
         * @param {string} [defaultValue]
         * @param {object} [opts]
         * @returns {Promise<string|null>} — null when cancelled
         */
        prompt(message, defaultValue = '', opts = {}) {
            return show({
                type: 'prompt',
                title: opts.title || null,
                message,
                confirmLabel: opts.confirmLabel || 'OK',
                cancelLabel: opts.cancelLabel || 'Cancel',
                showCancel: true,
                showInput: true,
                inputPlaceholder: opts.placeholder || '',
                inputDefault: defaultValue,
            });
        },
    };

    window.Dialog = Dialog;
    console.log('[dialog.js] Custom dialog system ready.');
})();
