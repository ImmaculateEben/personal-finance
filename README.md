# Personal Finance Dashboard

A responsive personal finance budgeting dashboard built with vanilla JavaScript, HTML, and CSS.

## What It Does

- Plan monthly budgets by category (`Income`, `Expenses`, `Bills`, `Savings`, `Debt`)
- Track planned vs actual values for each month
- Switch between months and years (data is stored per period)
- View charts for budget health, allocation, and planned-vs-actual totals
- Add, duplicate, edit, and delete budget line items inline
- Write month notes (auto-saved locally)
- Export/import local backups as JSON
- Copy the previous month's budget into the current month
- Reset a month or clear all local data

## Security / Reliability Improvements

- Input sanitization for names, notes, and imported JSON data
- Safer localStorage parsing/normalization with schema validation
- Per-month/per-year budget storage (fixes month selector not affecting data)
- Reduced XSS risk in budget row rendering
- Content Security Policy and stricter browser security meta tags in `index.html`
- Event delegation for spreadsheet editing (prevents duplicate listeners on re-render)

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Chart.js
- LocalStorage (browser-only persistence)

## Getting Started

1. Clone the repository
2. Open `index.html` in a browser

No build step or backend required.

## Notes

- All data is stored in your browser.
- Use the **Export Backup** button before clearing data or moving to another device/browser.
