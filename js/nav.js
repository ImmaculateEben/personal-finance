/**
 * nav.js — Dashboard navigation, tab switching, sidebar, FAB,
 * dark-mode toggle, collapsible sections, and budget health ring.
 * Runs after app.js has initialised.
 */

; (function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────── */
    const $ = (id) => document.getElementById(id);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* ══════════════════════════════════════════
       1.  TAB / PANEL SWITCHING
    ══════════════════════════════════════════ */
    const panels = $$('.tab-panel');
    const navItems = $$('.nav-item[data-panel]');
    const bottomItems = $$('.bottom-nav-item[data-panel]');

    function switchPanel(targetPanel) {
        if (!targetPanel) return;

        // Panels
        panels.forEach(p => {
            const isActive = p.id === 'panel' + cap(targetPanel);
            p.classList.toggle('is-active', isActive);
        });

        // Sidebar nav
        navItems.forEach(item => {
            const active = item.dataset.panel === targetPanel;
            item.classList.toggle('active', active);
            item.setAttribute('aria-current', active ? 'page' : 'false');
        });

        // Bottom nav
        bottomItems.forEach(item => {
            const active = item.dataset.panel === targetPanel;
            item.classList.toggle('active', active);
            item.setAttribute('aria-current', active ? 'page' : 'false');
        });

        // Trigger chart resize when switching to charts tab
        if (targetPanel === 'charts') {
            setTimeout(() => {
                if (window.ChartManager && typeof ChartManager.updateBudgetCharts === 'function') {
                    ChartManager.updateBudgetCharts();
                }
            }, 120);
        }

        // Remember active panel
        try { sessionStorage.setItem('financeActivePanel', targetPanel); } catch (_) { }

        // Close mobile sidebar if open
        closeMobileSidebar();
    }

    function cap(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Wire sidebar nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => switchPanel(item.dataset.panel));
    });

    // Wire bottom nav items
    bottomItems.forEach(item => {
        item.addEventListener('click', () => switchPanel(item.dataset.panel));
    });

    // Restore last panel
    try {
        const saved = sessionStorage.getItem('financeActivePanel');
        if (saved) switchPanel(saved);
    } catch (_) { }

    /* ══════════════════════════════════════════
       2.  MOBILE SIDEBAR TOGGLE
    ══════════════════════════════════════════ */
    const sidebarToggleBtn = $('sidebarToggleBtn');
    const sidebar = $('appSidebar');
    const overlay = $('sidebarOverlay');

    function openMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('mobile-open');
        overlay && overlay.classList.add('visible');
        overlay && overlay.removeAttribute('aria-hidden');
        sidebarToggleBtn && sidebarToggleBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('mobile-open');
        overlay && overlay.classList.remove('visible');
        overlay && overlay.setAttribute('aria-hidden', 'true');
        sidebarToggleBtn && sidebarToggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    sidebarToggleBtn && sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.contains('mobile-open') ? closeMobileSidebar() : openMobileSidebar();
    });

    overlay && overlay.addEventListener('click', closeMobileSidebar);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMobileSidebar();
    });

    /* ══════════════════════════════════════════
       3.  DARK / LIGHT MODE TOGGLE
    ══════════════════════════════════════════ */
    const darkToggle = $('darkModeToggle');
    const darkIcon = $('darkModeIcon');

    const MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    const SUN_PATH = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

    let isLightMode = false;

    // All CSS custom properties set for dark mode (baseline)
    const DARK_TOKENS = {
        '--bg-base': '#080d1a',
        '--bg-primary': '#080d1a',
        '--bg-secondary': '#0d1426',
        '--bg-tertiary': '#111827',
        '--bg-elevated': '#161e32',
        '--bg-glass': 'rgba(255,255,255,0.04)',
        '--bg-glass-hover': 'rgba(255,255,255,0.07)',
        '--bg-card': 'rgba(22,30,50,0.8)',
        '--text-primary': '#e8edf5',
        '--text-secondary': '#94a3b8',
        '--text-muted': '#64748b',
        '--border': 'rgba(255,255,255,0.08)',
        '--border-color': 'rgba(255,255,255,0.08)',
        '--border-strong': 'rgba(255,255,255,0.16)',
        '--glass-border': 'rgba(255,255,255,0.10)',
        '--card-bg': '#161e32',
        '--input-bg': 'rgba(255,255,255,0.05)',
        '--input-border': 'rgba(255,255,255,0.08)',
        '--ui-ink': '#e8edf5',
        '--ui-sub': '#94a3b8',
        '--ui-dim': '#64748b',
        '--ui-paper': '#161e32',
        '--ui-paper-2': 'rgba(255,255,255,0.05)',
        '--ui-line': 'rgba(255,255,255,0.08)',
        '--ui-line-soft': 'rgba(255,255,255,0.05)',
    };

    // Light mode overrides
    const LIGHT_TOKENS = {
        '--bg-base': '#f1f5f9',
        '--bg-primary': '#f1f5f9',
        '--bg-secondary': '#e8eef5',
        '--bg-tertiary': '#dde5ef',
        '--bg-elevated': '#ffffff',
        '--bg-glass': 'rgba(255,255,255,0.75)',
        '--bg-glass-hover': 'rgba(255,255,255,0.95)',
        '--bg-card': '#ffffff',
        '--text-primary': '#0f172a',
        '--text-secondary': '#475569',
        '--text-muted': '#94a3b8',
        '--border': 'rgba(15,23,42,0.08)',
        '--border-color': 'rgba(15,23,42,0.08)',
        '--border-strong': 'rgba(15,23,42,0.14)',
        '--glass-border': 'rgba(15,23,42,0.10)',
        '--card-bg': '#ffffff',
        '--input-bg': 'rgba(255,255,255,0.9)',
        '--input-border': 'rgba(15,23,42,0.12)',
        '--ui-ink': '#0f172a',
        '--ui-sub': '#475569',
        '--ui-dim': '#94a3b8',
        '--ui-paper': '#ffffff',
        '--ui-paper-2': 'rgba(15,23,42,0.04)',
        '--ui-line': 'rgba(15,23,42,0.08)',
        '--ui-line-soft': 'rgba(15,23,42,0.05)',
    };

    function applyLightMode(light) {
        isLightMode = light;
        const tokens = light ? LIGHT_TOKENS : DARK_TOKENS;
        const html = document.documentElement;

        // Apply all tokens
        Object.entries(tokens).forEach(([prop, val]) => html.style.setProperty(prop, val));

        // data-theme attribute (used by CSS selectors)
        html.setAttribute('data-theme', light ? 'light' : 'dark');

        // Update toggle icon and label
        if (darkIcon) darkIcon.innerHTML = light ? MOON_PATH : SUN_PATH;
        if (darkToggle) {
            const label = light ? 'Switch to dark mode' : 'Switch to light mode';
            darkToggle.setAttribute('title', label);
            darkToggle.setAttribute('aria-label', label);
        }

        // Persist
        try { localStorage.setItem('financeOSLightMode', light ? '1' : '0'); } catch (_) { }
    }

    // Restore persisted preference
    try {
        const stored = localStorage.getItem('financeOSLightMode');
        applyLightMode(stored === '1');
    } catch (_) { applyLightMode(false); }

    darkToggle && darkToggle.addEventListener('click', () => applyLightMode(!isLightMode));

    /* ══════════════════════════════════════════
       4.  PRINT BUTTON
    ══════════════════════════════════════════ */
    const printBtn = $('printBtn');
    printBtn && printBtn.addEventListener('click', () => {
        // Switch to budget panel before print for best output
        switchPanel('budget');
        setTimeout(() => window.print(), 100);
    });

    /* ══════════════════════════════════════════
       5.  COLLAPSIBLE SPREADSHEET SECTIONS
    ══════════════════════════════════════════ */
    $$('.section-collapse-btn').forEach(btn => {
        const section = btn.closest('.spreadsheet-section');
        if (!section) return;

        btn.addEventListener('click', () => {
            const isCollapsed = section.classList.toggle('collapsed');
            btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        });
    });

    /* ══════════════════════════════════════════
       6.  FAB → Quick-add transaction
    ══════════════════════════════════════════ */
    const fab = $('fabAddTransaction');
    fab && fab.addEventListener('click', () => {
        switchPanel('transactions');
        setTimeout(() => {
            const amountInput = $('transactionAmount');
            amountInput && amountInput.focus();
        }, 200);
    });

    /* ══════════════════════════════════════════
       7.  BUDGET HEALTH RING
         Updates the SVG circle stroke-dashoffset
         based on summaryRemaining / summaryTotalIncome
    ══════════════════════════════════════════ */
    const healthRing = $('budgetHealthRing');
    const CIRCUMFERENCE = 2 * Math.PI * 16; // r=16 → ≈ 100.53

    function updateHealthRing() {
        if (!healthRing) return;

        const incomeEl = $('summaryTotalIncome');
        const remainingEl = $('summaryRemaining');
        if (!incomeEl || !remainingEl) return;

        const parseVal = el => {
            const raw = el.textContent.replace(/[^0-9.-]/g, '');
            return parseFloat(raw) || 0;
        };

        const income = parseVal(incomeEl);
        const remaining = parseVal(remainingEl);

        let pct = income > 0 ? Math.min(Math.max(remaining / income, 0), 1) : 0;
        const offset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
        healthRing.style.strokeDashoffset = offset;

        // Colour: red < 20%, amber < 50%, teal otherwise
        let colour = 'var(--success-color)';
        if (pct < 0.2) colour = 'var(--danger-color)';
        else if (pct < 0.5) colour = 'var(--warning-color)';
        healthRing.style.stroke = colour;
    }

    // Observe DOM mutations on summary values to refresh ring
    const summaryContainer = document.querySelector('.budget-summary-section');
    if (summaryContainer && window.MutationObserver) {
        const mo = new MutationObserver(updateHealthRing);
        mo.observe(summaryContainer, { subtree: true, characterData: true, childList: true });
    }
    // Also run once on load
    setTimeout(updateHealthRing, 800);

    /* ══════════════════════════════════════════
       8.  SIDEBAR COLLAPSE TOGGLE (Desktop)
    ══════════════════════════════════════════ */
    const sidebarTogglerBtn = document.querySelector('.sidebar-toggler');
    sidebarTogglerBtn && sidebarTogglerBtn.addEventListener('click', () => {
        sidebar && sidebar.classList.toggle('collapsed');
    });

    /* ══════════════════════════════════════════
       9.  RESIZE HANDLER
    ══════════════════════════════════════════ */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileSidebar();
        }
    }, { passive: true });

    /* ══════════════════════════════════════════
       10. MOBILE PERIOD DRAWER
           On mobile, tapping the month badge in
           topbar-title opens a compact drawer
    ══════════════════════════════════════════ */
    const topbarTitle = document.querySelector('.topbar-title');
    topbarTitle && topbarTitle.addEventListener('click', () => {
        if (window.innerWidth >= 768) return;
        const period = document.querySelector('.topbar-period');
        if (!period) return;
        const visible = period.style.display === 'flex';
        period.style.display = visible ? 'none' : 'flex';
        period.style.flexWrap = 'wrap';
        period.style.position = visible ? '' : 'absolute';
        period.style.top = visible ? '' : 'calc(var(--topbar-height))';
        period.style.left = visible ? '' : '0';
        period.style.right = visible ? '' : '0';
        period.style.background = visible ? '' : 'var(--bg-elevated)';
        period.style.borderBottom = visible ? '' : '1px solid var(--border)';
        period.style.padding = visible ? '' : '0.75rem 1rem';
        period.style.zIndex = visible ? '' : '100';
    });

    /* ══════════════════════════════════════════
       11. SWIPE-TO-DELETE (Mobile)
           Touch left on a spreadsheet row to
           reveal the red delete button.
    ══════════════════════════════════════════ */
    (function initSwipeToDelete() {
        const SWIPE_THRESHOLD = 55;   // px needed to trigger open
        const SWIPE_CLOSE_BACK = 15;   // px rightward swipe that closes

        let activeRow = null;   // currently swiped-open row
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        /** Inject the delete action element into a row if not there yet */
        function ensureDeleteAction(row) {
            if (row.querySelector('.swipe-delete-action')) return;
            const categoryId = row.dataset.categoryId || '';
            const el = document.createElement('div');
            el.className = 'swipe-delete-action';
            el.setAttribute('data-category-id', categoryId);
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', 'Delete item');
            el.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete`;
            el.addEventListener('click', () => {
                // Delegate to the existing row-delete-btn handler
                const btn = row.querySelector('.row-delete-btn');
                if (btn) {
                    closeSwipe(row, true);
                    setTimeout(() => btn.click(), 60);
                } else {
                    // fallback: fire delete directly
                    const catId = row.dataset.categoryId;
                    if (catId && window.Storage) {
                        const category = Storage.getBudgetCategories().find(c => c.id === catId);
                        const label = category ? category.name : 'this item';
                        Dialog.confirm('Delete "' + label + '" from this month?', {
                            type: 'warning', title: 'Delete Item',
                            confirmLabel: 'Delete', cancelLabel: 'Keep'
                        }).then(ok => {
                            if (!ok) return;
                            if (Storage.deleteBudgetCategory(catId)) {
                                if (window.UI) UI.refreshBudgetSection();
                            }
                        });
                    }
                    closeSwipe(row, true);
                }
            });
            row.appendChild(el);
        }

        function openSwipe(row) {
            if (activeRow && activeRow !== row) closeSwipe(activeRow, true);
            ensureDeleteAction(row);
            row.classList.add('is-swiped-left');
            activeRow = row;
        }

        function closeSwipe(row, instantly = false) {
            if (!row) return;
            if (instantly) {
                row.style.transition = 'none';
                requestAnimationFrame(() => {
                    row.classList.remove('is-swiped-left');
                    requestAnimationFrame(() => { row.style.transition = ''; });
                });
            } else {
                row.classList.remove('is-swiped-left');
            }
            if (activeRow === row) activeRow = null;
        }

        function onTouchStart(e) {
            if (e.touches.length !== 1) return;
            const row = e.target.closest('.spreadsheet-row');
            if (!row) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }

        function onTouchMove(e) {
            if (e.touches.length !== 1) return;
            const row = e.target.closest('.spreadsheet-row');
            if (!row) return;

            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;

            // Only hijack mostly-horizontal swipes
            if (!isSwiping && Math.abs(dy) > Math.abs(dx)) return;
            if (Math.abs(dx) > 8) {
                isSwiping = true;
                e.preventDefault(); // stop page scroll while swiping
            }
        }

        function onTouchEnd(e) {
            if (!isSwiping) {
                // Plain tap — close any open row (unless tapping its delete action)
                if (activeRow && !e.target.closest('.swipe-delete-action')) {
                    closeSwipe(activeRow);
                }
                return;
            }

            const row = e.changedTouches.length
                ? (() => {
                    const el = document.elementFromPoint(
                        e.changedTouches[0].clientX,
                        e.changedTouches[0].clientY
                    );
                    return el ? el.closest('.spreadsheet-row') : null;
                })()
                : null;

            const dx = (e.changedTouches[0] || {}).clientX - touchStartX;

            if (row) {
                if (dx < -SWIPE_THRESHOLD) {
                    openSwipe(row);
                } else if (dx > SWIPE_CLOSE_BACK && activeRow === row) {
                    closeSwipe(row);
                }
            }
            isSwiping = false;
        }

        // Attach to the document (works for dynamically added rows)
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: true });

        // Close active swipe when tapping outside any spreadsheet
        document.addEventListener('touchstart', (e) => {
            if (activeRow && !e.target.closest('.spreadsheet-section')) {
                closeSwipe(activeRow);
            }
        }, { passive: true });

        // Re-inject on DOM mutations (rows are re-rendered by app.js often)
        const bodyContainers = document.querySelectorAll('.spreadsheet-body');
        if (window.MutationObserver && bodyContainers.length) {
            const mo = new MutationObserver(() => {
                // Close stale swiped row if it's been removed
                if (activeRow && !document.contains(activeRow)) activeRow = null;
            });
            bodyContainers.forEach(c => mo.observe(c, { childList: true }));
        }
    })();

    console.log('[nav.js] Dashboard navigation initialised.');

})();
