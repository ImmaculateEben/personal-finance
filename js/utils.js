// Utility Functions

/**
 * Generate a unique ID using UUID v4
 * @returns {string} A unique identifier
 */
function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
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
    const parsed = typeof amount === 'number' ? amount : parseFloat(amount);
    return typeof parsed === 'number' &&
           !isNaN(parsed) &&
           parsed > 0 &&
           isFinite(parsed);
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
    if (!str) return '';
    return String(str).replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Round to 2 decimal places for currency-safe display/storage
 * @param {number|string} value
 * @returns {number}
 */
function roundCurrency(value) {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    if (!isFinite(parsed)) return 0;
    return Math.round(parsed * 100) / 100;
}

/**
 * Coerce a value to a number with bounds
 * @param {number|string} value
 * @param {object} options
 * @returns {number}
 */
function toNumber(value, options = {}) {
    const {
        fallback = 0,
        min = Number.NEGATIVE_INFINITY,
        max = Number.POSITIVE_INFINITY
    } = options;

    const parsed = typeof value === 'number' ? value : parseFloat(value);
    if (!isFinite(parsed)) return fallback;
    return clamp(roundCurrency(parsed), min, max);
}

/**
 * Escape HTML special characters to prevent markup injection
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sanitize user text input for storage/rendering
 * @param {string} value
 * @param {object} options
 * @returns {string}
 */
function sanitizeText(value, options = {}) {
    const {
        maxLength = 80,
        fallback = '',
        trim = true
    } = options;

    let result = String(value ?? '');
    result = result.replace(/[\u0000-\u001F\u007F]/g, ' ');
    result = result.replace(/\s+/g, ' ');
    if (trim) result = result.trim();
    if (maxLength > 0) {
        result = result.slice(0, maxLength);
    }
    return result || fallback;
}

/**
 * Normalize a hex color string
 * @param {string} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeHexColor(value, fallback = '#4299e1') {
    const color = String(value ?? '').trim();
    return /^#([0-9a-fA-F]{6})$/.test(color) ? color.toLowerCase() : fallback;
}

/**
 * Validate a YYYY-MM-DD date string
 * @param {string} value
 * @returns {boolean}
 */
function isValidDateInput(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && formatDateForInput(date) === value;
}

/**
 * Convert bytes to base64
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
}

/**
 * Convert base64 to bytes
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Check if Web Crypto API (subtle) is available
 * @returns {boolean}
 */
function supportsWebCrypto() {
    return typeof crypto !== 'undefined' && !!crypto.subtle;
}

/**
 * Derive AES-GCM key from a passphrase using PBKDF2
 * @param {string} passphrase
 * @param {Uint8Array} salt
 * @param {number} iterations
 * @returns {Promise<CryptoKey>}
 */
async function deriveBackupKey(passphrase, salt, iterations = 250000) {
    if (!supportsWebCrypto()) {
        throw new Error('Web Crypto is not available');
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(String(passphrase)),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt JSON backup plaintext with a passphrase
 * @param {string} plaintext
 * @param {string} passphrase
 * @returns {Promise<object>}
 */
async function encryptBackupJson(plaintext, passphrase) {
    const safePassphrase = String(passphrase || '');
    if (!safePassphrase) {
        throw new Error('Passphrase is required');
    }

    if (!supportsWebCrypto()) {
        throw new Error('Web Crypto is not available in this browser');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 250000;
    const key = await deriveBackupKey(safePassphrase, salt, iterations);
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(String(plaintext))
    );

    return {
        app: 'personal-finance-dashboard-backup',
        encryptedBackup: true,
        encryptionVersion: 1,
        exportedAt: new Date().toISOString(),
        encryption: {
            algorithm: 'AES-GCM',
            iv: bytesToBase64(iv),
            kdf: 'PBKDF2',
            hash: 'SHA-256',
            iterations,
            salt: bytesToBase64(salt)
        },
        payload: bytesToBase64(new Uint8Array(ciphertext))
    };
}

/**
 * Decrypt encrypted backup wrapper to plaintext JSON
 * @param {object} encryptedBackup
 * @param {string} passphrase
 * @returns {Promise<string>}
 */
async function decryptBackupJson(encryptedBackup, passphrase) {
    if (!encryptedBackup || typeof encryptedBackup !== 'object' || !encryptedBackup.encryptedBackup) {
        throw new Error('Invalid encrypted backup format');
    }
    if (!supportsWebCrypto()) {
        throw new Error('Web Crypto is not available in this browser');
    }

    const encryption = encryptedBackup.encryption || {};
    const iterations = toNumber(encryption.iterations, { fallback: 250000, min: 100000, max: 2000000 });
    const salt = base64ToBytes(String(encryption.salt || ''));
    const iv = base64ToBytes(String(encryption.iv || ''));
    const payloadBytes = base64ToBytes(String(encryptedBackup.payload || ''));

    if (salt.length < 8 || iv.length !== 12 || payloadBytes.length === 0) {
        throw new Error('Encrypted backup is malformed');
    }

    const key = await deriveBackupKey(String(passphrase || ''), salt, iterations);
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            payloadBytes
        );
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('Failed to decrypt backup. Check the passphrase.');
    }
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
