// Apply the saved UI theme preset before styles paint to reduce theme flash.
(function themeBootstrap() {
    try {
        var root = document.documentElement;
        if (!root) return;

        var raw = localStorage.getItem('finance_preferences');
        if (!raw) return;

        var prefs = JSON.parse(raw);
        if (!prefs || typeof prefs !== 'object') return;

        var validPresets = { corporate: true, warm: true, midnight: true };
        var preset = typeof prefs.uiThemePreset === 'string' ? prefs.uiThemePreset.toLowerCase() : '';
        if (validPresets[preset]) {
            root.setAttribute('data-ui-theme', preset);
        }

        if (prefs.theme === 'dark' || prefs.theme === 'light') {
            root.setAttribute('data-theme', prefs.theme);
        }
    } catch (_) {
        // Ignore localStorage/JSON access failures and continue with defaults.
    }
})();
