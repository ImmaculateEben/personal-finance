// Chart.js Integration Module

const ChartManager = {
    donutChart: null,
    allocationChart: null,
    plannedVsActualChart: null,

    _getTextColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--text-secondary').trim() || '#64748b';
    },

    _getGridColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--border-color').trim() || 'rgba(0, 0, 0, 0.08)';
    },

    _baseOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 350
            },
            plugins: {
                legend: {
                    labels: {
                        color: this._getTextColor(),
                        usePointStyle: true,
                        font: {
                            family: "'Inter', sans-serif",
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                }
            }
        };
    },

    _tooltipCurrency() {
        return {
            callbacks: {
                label(context) {
                    const datasetLabel = context.dataset && context.dataset.label ? context.dataset.label + ': ' : '';
                    return datasetLabel + formatCurrency(context.raw || 0);
                }
            }
        };
    },

    _upsertChart(instanceName, ctx, config) {
        if (!ctx || typeof Chart === 'undefined') {
            return;
        }

        if (this[instanceName]) {
            this[instanceName].data = config.data;
            this[instanceName].options = config.options;
            this[instanceName].update();
            return;
        }

        this[instanceName] = new Chart(ctx, config);
    },

    init() {
        this.updateBudgetCharts();
    },

    initDonutChart() {
        const canvas = document.getElementById('donutChart');
        if (!canvas) return;

        const metrics = Storage.getBudgetMetrics();
        const income = metrics.incomePlanned;
        const spent = metrics.actualOutflow;
        const remaining = Math.max(0, roundCurrency(income - spent));
        const overspent = Math.max(0, roundCurrency(spent - income));

        const labels = overspent > 0 ? ['Income Capacity', 'Overspend'] : ['Spent', 'Remaining'];
        const values = overspent > 0 ? [income || 0, overspent] : [spent || 0, remaining || 0];
        const colors = overspent > 0 ? ['#f59e0b', '#ef4444'] : ['#ec4899', '#22c55e'];

        const config = {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                ...this._baseOptions(),
                cutout: '68%',
                plugins: {
                    ...this._baseOptions().plugins,
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const total = context.dataset.data.reduce((sum, n) => sum + n, 0) || 1;
                                const pct = ((context.raw / total) * 100).toFixed(1);
                                return context.label + ': ' + formatCurrency(context.raw || 0) + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        };

        this._upsertChart('donutChart', canvas, config);
    },

    initAllocationChart() {
        const canvas = document.getElementById('allocationChart');
        if (!canvas) return;

        const metrics = Storage.getBudgetMetrics();
        const values = [metrics.variableActual, metrics.fixedActual, metrics.savingsActual, metrics.debtActual];
        const hasData = values.some(v => v > 0);

        const config = {
            type: 'pie',
            data: {
                labels: ['Expenses', 'Bills', 'Savings', 'Debt'],
                datasets: [{
                    data: hasData ? values : [1, 1, 1, 1],
                    backgroundColor: hasData
                        ? ['#ec4899', '#ef4444', '#22c55e', '#8b5cf6']
                        : ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                ...this._baseOptions(),
                plugins: {
                    ...this._baseOptions().plugins,
                    tooltip: hasData ? {
                        callbacks: {
                            label(context) {
                                const total = context.dataset.data.reduce((sum, n) => sum + n, 0) || 1;
                                const pct = ((context.raw / total) * 100).toFixed(1);
                                return context.label + ': ' + formatCurrency(context.raw || 0) + ' (' + pct + '%)';
                            }
                        }
                    } : {
                        callbacks: {
                            label(context) {
                                return context.label + ': no actual data yet';
                            }
                        }
                    }
                }
            }
        };

        this._upsertChart('allocationChart', canvas, config);
    },

    initPlannedVsActualChart() {
        const canvas = document.getElementById('plannedVsActualChart');
        if (!canvas) return;

        const metrics = Storage.getBudgetMetrics();
        const planned = [metrics.variablePlanned, metrics.fixedPlanned, metrics.savingsPlanned, metrics.debtPlanned];
        const actual = [metrics.variableActual, metrics.fixedActual, metrics.savingsActual, metrics.debtActual];

        const base = this._baseOptions();
        const config = {
            type: 'bar',
            data: {
                labels: ['Expenses', 'Bills', 'Savings', 'Debt'],
                datasets: [
                    {
                        label: 'Planned',
                        data: planned,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Actual',
                        data: actual,
                        backgroundColor: '#ec4899',
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                ...base,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: this._getGridColor()
                        },
                        ticks: {
                            color: this._getTextColor(),
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this._getTextColor()
                        }
                    }
                },
                plugins: {
                    ...base.plugins,
                    tooltip: this._tooltipCurrency()
                }
            }
        };

        this._upsertChart('plannedVsActualChart', canvas, config);
    },

    updateBudgetCharts() {
        this.initDonutChart();
        this.initAllocationChart();
        this.initPlannedVsActualChart();
    },

    updateCharts() {
        this.updateBudgetCharts();
    },

    destroyCharts() {
        ['donutChart', 'allocationChart', 'plannedVsActualChart'].forEach(key => {
            if (this[key]) {
                this[key].destroy();
                this[key] = null;
            }
        });
    },

    refreshForTheme() {
        this.updateBudgetCharts();
    },

    getCharts() {
        return {
            donutChart: this.donutChart,
            allocationChart: this.allocationChart,
            plannedVsActualChart: this.plannedVsActualChart
        };
    }
};

window.ChartManager = ChartManager;
