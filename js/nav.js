/**
 * nav.js — Dashboard navigation, tab switching, sidebar, FAB,
 * dark-mode toggle, collapsible sections, and budget health ring.
 * Runs after app.js has initialised.
 */

;(function () {
    'use strict';

    /* ── Helpers ──────────────────────────────────────────── */
    const $ = (id) => document.getElementById(id);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* ══════════════════════════════════════════
       1.  TAB / PANEL SWITCHING
    ══════════════════════════════════════════ */
    const panels      = $$('.tab-panel');
    const navItems    = $$('.nav-item[data-panel]');
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
        try { sessionStorage.setItem('financeActivePanel', targetPanel); } catch (_) {}

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
    } catch (_) {}

    /* ══════════════════════════════════════════
       2.  MOBILE SIDEBAR TOGGLE
    ══════════════════════════════════════════ */
    const sidebarToggleBtn = $('sidebarToggleBtn');
    const sidebar          = $('appSidebar');
    const overlay          = $('sidebarOverlay');

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
    const darkIcon   = $('darkModeIcon');

    const MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    const SUN_PATH  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

    let isLightMode = false;

    function applyLightMode(light) {
        isLightMode = light;
        document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');

        if (darkIcon) {
            darkIcon.innerHTML = light ? MOON_PATH : SUN_PATH;
        }
        if (darkToggle) {
            darkToggle.setAttribute('title', light ? 'Switch to dark mode' : 'Switch to light mode');
            darkToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
        }

        if (light) {
            document.documentElement.style.setProperty('--bg-base', '#f1f5f9');
            document.documentElement.style.setProperty('--bg-primary', '#f1f5f9');
            document.documentElement.style.setProperty('--bg-secondary', '#e8eef5');
            document.documentElement.style.setProperty('--bg-tertiary', '#dde5ef');
            document.documentElement.style.setProperty('--bg-elevated', '#ffffff');
            document.documentElement.style.setProperty('--bg-glass', 'rgba(255,255,255,0.7)');
            document.documentElement.style.setProperty('--bg-glass-hover', 'rgba(255,255,255,0.9)');
            document.documentElement.style.setProperty('--text-primary', '#0f172a');
            document.documentElement.style.setProperty('--text-secondary', '#475569');
            document.documentElement.style.setProperty('--text-muted', '#94a3b8');
            document.documentElement.style.setProperty('--border', 'rgba(0,0,0,0.08)');
            document.documentElement.style.setProperty('--border-color', 'rgba(0,0,0,0.08)');
            document.documentElement.style.setProperty('--border-strong', 'rgba(0,0,0,0.14)');
            document.documentElement.style.setProperty('--glass-border', 'rgba(0,0,0,0.10)');
        } else {
            // Remove inline overrides to restore dark variables
            const lightProps = [
                '--bg-base','--bg-primary','--bg-secondary','--bg-tertiary','--bg-elevated',
                '--bg-glass','--bg-glass-hover','--text-primary','--text-secondary','--text-muted',
                '--border','--border-color','--border-strong','--glass-border'
            ];
            lightProps.forEach(p => document.documentElement.style.removeProperty(p));
        }

        try { localStorage.setItem('financeOSLightMode', light ? '1' : '0'); } catch (_) {}
    }

    // Restore
    try {
        const stored = localStorage.getItem('financeOSLightMode');
        if (stored === '1') applyLightMode(true);
        else applyLightMode(false);
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

        const incomeEl   = $('summaryTotalIncome');
        const remainingEl = $('summaryRemaining');
        if (!incomeEl || !remainingEl) return;

        const parseVal = el => {
            const raw = el.textContent.replace(/[^0-9.-]/g, '');
            return parseFloat(raw) || 0;
        };

        const income    = parseVal(incomeEl);
        const remaining = parseVal(remainingEl);

        let pct = income > 0 ? Math.min(Math.max(remaining / income, 0), 1) : 0;
        const offset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
        healthRing.style.strokeDashoffset = offset;

        // Colour: red < 20%, amber < 50%, teal otherwise
        let colour = 'var(--success-color)';
        if (pct < 0.2)      colour = 'var(--danger-color)';
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

    console.log('[nav.js] Dashboard navigation initialised.');

})();
