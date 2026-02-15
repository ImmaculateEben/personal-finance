// Utility Functions

/**
 * Generate a unique ID using UUID v4
 * @returns {string} A unique identifier
 */
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format currency to display
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (optional, defaults to USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currencyCode) {
    const code = currencyCode || Storage.getCurrency() || 'USD';
    const currencyInfo = Storage.getCurrencyInfo ? Storage.getCurrencyInfo(code) : { code: code, symbol: code };
    
    // Get locale based on currency
    const locales = getLocalesForCurrency(code);
    
    try {
        return new Intl.NumberFormat(locales, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        // Fallback for currencies without proper locale support
        return currencyInfo.symbol + ' ' + amount.toLocaleString(locales, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

/**
 * Get appropriate locales for a currency
 * @param {string} currencyCode - Currency code
 * @returns {string} Locale string
 */
function getLocalesForCurrency(currencyCode) {
    const currencyLocales = {
        'USD': 'en-US',
        'EUR': 'de-DE',
        'GBP': 'en-GB',
        'JPY': 'ja-JP',
        'CNY': 'zh-CN',
        'INR': 'en-IN',
        'NGN': 'en-NG',
        'BRL': 'pt-BR',
        'KRW': 'ko-KR',
        'AUD': 'en-AU',
        'CAD': 'en-CA',
        'CHF': 'de-CH',
        'MXN': 'es-MX',
        'ZAR': 'en-ZA'
    };
    return currencyLocales[currencyCode] || 'en-US';
}

/**
 * Format date to display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

/**
 * Format date for input fields
 * @param {Date} date - Date object
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string} Today's date
 */
function getTodayDate() {
    return formatDateForInput(new Date());
}

/**
 * Get current month and year
 * @returns {object} { month, year }
 */
function getCurrentMonth() {
    const now = new Date();
    return {
        month: now.getMonth(),
        year: now.getFullYear()
    };
}

/**
 * Debounce function to limit execution rate
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate amount is a positive number
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid positive number
 */
function isValidAmount(amount) {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           amount > 0 && 
           isFinite(amount);
}

/**
 * Clamp a number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Convert RGB to Hex
 * @param {string} rgb - RGB string
 * @returns {string} Hex color
 */
function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return rgb;
    return '#' + result.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Get contrasting text color (black or white) for a background color
 * @param {string} hexColor - Hex color
 * @returns {string} 'black' or 'white'
 */
function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Parse query string to object
 * @returns {object} Query parameters
 */
function parseQueryString() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Create query string from object
 * @param {object} obj - Object to convert
 * @returns {string} Query string
 */
function createQueryString(obj) {
    return new URLSearchParams(obj).toString();
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} True if empty
 */
function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Get random color from predefined palette
 * @param {number} index - Color index
 * @returns {string} Hex color
 */
function getChartColor(index) {
    const colors = [
        '#3b82f6', // blue
        '#22c55e', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#ec4899', // pink
        '#84cc16', // lime
        '#f97316', // orange
        '#6366f1'  // indigo
    ];
    return colors[index % colors.length];
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Property key
 * @returns {object} Grouped object
 */
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const value = typeof key === 'function' ? key(item) : item[key];
        (groups[value] = groups[value] || []).push(item);
        return groups;
    }, {});
}

/**
 * Calculate sum of array values
 * @param {Array} array - Array of numbers
 * @returns {number} Sum
 */
function sum(array) {
    return array.reduce((acc, val) => acc + (val || 0), 0);
}

/**
 * Calculate average of array values
 * @param {Array} array - Array of numbers
 * @returns {number} Average
 */
function average(array) {
    if (array.length === 0) return 0;
    return sum(array) / array.length;
}
