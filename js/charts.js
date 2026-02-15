// Chart.js Integration Module

const ChartManager = {
    barChart: null,
    pieChart: null,
    donutChart: null,
    allocationChart: null,
    plannedVsActualChart: null,
    
    // Chart colors for budget categories (soft pinks and purples palette)
    budgetColors: {
        variable: ['#ec4899', '#f97316', '#f59e0b', '#eab308'],
        fixed: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
        savings: ['#22c55e', '#16a34a', '#15803d', '#166534'],
        debt: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
        income: ['#22c55e', '#84cc16', '#06b6d4']
    },
    
    // Chart.js default configuration
    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    usePointStyle: true,
                    padding: 15
                }
            }
        }
    },
    
    /**
     * Get responsive options based on screen size
     */
    getResponsiveOptions() {
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        const fontSize = isSmallMobile ? 9 : (isMobile ? 10 : 12);
        const padding = isSmallMobile ? 10 : (isMobile ? 12 : 15);
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: fontSize
                        },
                        usePointStyle: true,
                        padding: padding,
                        boxWidth: isMobile ? 6 : 8
                    }
                }
            }
        };
    },
    
    /**
     * Initialize charts
     */
    init() {
        this.initDonutChart();
        this.initAllocationChart();
        this.initPlannedVsActualChart();
    },
    
    /**
     * Initialize or update the bar chart (Income vs Expenses)
     */
    initBarChart() {
        const ctx = document.getElementById('barChart');
        if (!ctx) return;
        
        const monthlyData = TransactionManager.getMonthlyData(6);
        
        const data = {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    backgroundColor: '#22c55e',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        };
        
        const options = {
            ...this.getResponsiveOptions(),
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif"
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                ...this.getResponsiveOptions().plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        };
        
        if (this.barChart) {
            this.barChart.data = data;
            this.barChart.options = options;
            this.barChart.update();
        } else {
            this.barChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options
            });
        }
    },
    
    /**
     * Initialize or update the pie chart (Expenses by Category)
     */
    initPieChart() {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        const categoryData = TransactionManager.getExpensesByCategory();
        
        const categories = Storage.getCategories();
        const categoryColors = {};
        categories.forEach(c => {
            categoryColors[c.name] = c.color;
        });
        
        const labels = categoryData.map(d => d.category);
        const data = categoryData.map(d => d.total);
        const colors = categoryData.map(d => 
            categoryColors[d.category] || getChartColor(Math.random() * 10)
        );
        
        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: 'transparent',
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
        
        const options = {
            ...this.getResponsiveOptions(),
            cutout: '60%',
            plugins: {
                ...this.getResponsiveOptions().plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return formatCurrency(context.raw) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        };
        
        if (this.pieChart) {
            this.pieChart.data = chartData;
            this.pieChart.options = options;
            this.pieChart.update();
        } else {
            this.pieChart = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: options
            });
        }
    },
    
    /**
     * Initialize or update the donut chart (Budget Spent vs Remaining)
     */
    initDonutChart() {
        const ctx = document.getElementById('donutChart');
        if (!ctx) return;
        
        const monthlyIncome = Storage.getMonthlyIncome();
        const totalSpent = Storage.getTotalActual();
        const remaining = Math.max(0, monthlyIncome - totalSpent);
        
        const chartData = {
            labels: ['Spent', 'Remaining'],
            datasets: [{
                data: [totalSpent, remaining],
                backgroundColor: ['#ef4444', '#22c55e'],
                borderColor: 'transparent',
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
        
        const options = {
            ...this.getResponsiveOptions(),
            cutout: '70%',
            plugins: {
                ...this.getResponsiveOptions().plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = monthlyIncome > 0 ? 
                                ((context.raw / monthlyIncome) * 100).toFixed(1) : 0;
                            return formatCurrency(context.raw) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        };
        
        if (this.donutChart) {
            this.donutChart.data = chartData;
            this.donutChart.options = options;
            this.donutChart.update();
        } else {
            this.donutChart = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: options
            });
        }
    },
    
    /**
     * Initialize or update the allocation pie chart (Variable vs Fixed vs Savings vs Debt)
     */
    initAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;
        
        // Get values from header summary
        const headerExpenses = document.getElementById('headerExpenses').textContent;
        const headerBills = document.getElementById('headerBills').textContent;
        const headerSavings = document.getElementById('headerSavings').textContent;
        const headerDebt = document.getElementById('headerDebt').textContent;
        
        // Parse the currency values
        const parseCurrency = (str) => {
            return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
        };
        
        const allocation = {
            variable: parseCurrency(headerExpenses),
            fixed: parseCurrency(headerBills),
            savings: parseCurrency(headerSavings),
            debt: parseCurrency(headerDebt)
        };
        
        const chartData = {
            labels: ['Expenses', 'Bills', 'Savings', 'Debt'],
            datasets: [{
                data: [
                    allocation.variable,
                    allocation.fixed,
                    allocation.savings,
                    allocation.debt
                ],
                backgroundColor: ['#ec4899', '#ef4444', '#22c55e', '#8b5cf6'],
                borderColor: 'transparent',
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
        
        const options = {
            ...this.getResponsiveOptions(),
            cutout: '55%',
            plugins: {
                ...this.getResponsiveOptions().plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? 
                                ((context.raw / total) * 100).toFixed(1) : 0;
                            return formatCurrency(context.raw) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        };
        
        if (this.allocationChart) {
            this.allocationChart.data = chartData;
            this.allocationChart.options = options;
            this.allocationChart.update();
        } else {
            this.allocationChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: options
            });
        }
    },
    
    /**
     * Initialize or update the planned vs actual bar chart
     */
    initPlannedVsActualChart() {
        const ctx = document.getElementById('plannedVsActualChart');
        if (!ctx) return;
        
        // Get planned values from budget categories
        const categories = Storage.getBudgetCategories();
        let plannedExpenses = 0, plannedBills = 0, plannedSavings = 0, plannedDebt = 0;
        let actualExpenses = 0, actualBills = 0, actualSavings = 0, actualDebt = 0;
        
        categories.forEach(cat => {
            if (cat.type === 'variable') {
                plannedExpenses += cat.planned || 0;
                actualExpenses += cat.actual || 0;
            } else if (cat.type === 'fixed') {
                plannedBills += cat.planned || 0;
                actualBills += cat.actual || 0;
            } else if (cat.type === 'savings') {
                plannedSavings += cat.planned || 0;
                actualSavings += cat.actual || 0;
            } else if (cat.type === 'debt') {
                plannedDebt += cat.planned || 0;
                actualDebt += cat.actual || 0;
            }
        });
        
        const chartData = {
            labels: ['Expenses', 'Bills', 'Savings', 'Debt'],
            datasets: [
                {
                    label: 'Planned',
                    data: [plannedExpenses, plannedBills, plannedSavings, plannedDebt],
                    backgroundColor: '#8b5cf6',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                },
                {
                    label: 'Actual',
                    data: [actualExpenses, actualBills, actualSavings, actualDebt],
                    backgroundColor: '#ec4899',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }
            ]
        };
        
        const options = {
            ...this.getResponsiveOptions(),
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                ...this.getResponsiveOptions().plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        };
        
        if (this.plannedVsActualChart) {
            this.plannedVsActualChart.data = chartData;
            this.plannedVsActualChart.options = options;
            this.plannedVsActualChart.update();
        } else {
            this.plannedVsActualChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: options
            });
        }
    },
    
    /**
     * Update all budget charts
     */
    updateBudgetCharts() {
        this.initDonutChart();
        this.initAllocationChart();
        this.initPlannedVsActualChart();
    },
    
    /**
     * Update all charts
     */
    updateCharts() {
        this.updateBudgetCharts();
    },
    
    /**
     * Update bar chart only
     */
    updateBarChart() {
        this.initBarChart();
    },
    
    /**
     * Update pie chart only
     */
    updatePieChart() {
        this.initPieChart();
    },
    
    /**
     * Destroy all charts
     */
    destroyCharts() {
        if (this.barChart) {
            this.barChart.destroy();
            this.barChart = null;
        }
        if (this.pieChart) {
            this.pieChart.destroy();
            this.pieChart = null;
        }
        if (this.donutChart) {
            this.donutChart.destroy();
            this.donutChart = null;
        }
        if (this.allocationChart) {
            this.allocationChart.destroy();
            this.allocationChart = null;
        }
        if (this.plannedVsActualChart) {
            this.plannedVsActualChart.destroy();
            this.plannedVsActualChart = null;
        }
    },
    
    /**
     * Refresh charts with dark/light mode
     * @param {string} theme - 'light' or 'dark'
     */
    refreshForTheme(theme) {
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        
        if (this.barChart) {
            this.barChart.options.scales.y.grid.color = gridColor;
            this.barChart.update();
        }
        
        if (this.plannedVsActualChart) {
            this.plannedVsActualChart.options.scales.x.grid.color = gridColor;
            this.plannedVsActualChart.update();
        }
    },
    
    /**
     * Get chart instance references
     * @returns {object} Chart instances
     */
    getCharts() {
        return {
            barChart: this.barChart,
            pieChart: this.pieChart,
            donutChart: this.donutChart,
            allocationChart: this.allocationChart,
            plannedVsActualChart: this.plannedVsActualChart
        };
    }
};

// Export for use in other modules
window.ChartManager = ChartManager;
