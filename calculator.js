document.addEventListener('DOMContentLoaded', () => {
            const STORAGE_KEY = 'freelanceCalculatorInputs_v11_fixed'; 
            
            const countryConfigs = {
                'SE': {
                    currency: 'SEK',
                    transportPerShift: 79,
                    rates: {
                        vacationPay: 0.12, pension: 0.10, sickPay: 0.03,
                        overheads: 0.15, profit: 0.10,
                        socialSecurity: 0.2897, vat: 0.25
                    },
                    terms: {
                        socialContribution: 'Social Contributions (Egenavgifter)',
                        vatTitle: 'MOMS (VAT at 25%)',
                        vatLabel: 'MOMS',
                        vatInclLabel: 'incl. MOMS'
                    }
                },
                'GB': {
                    currency: 'GBP',
                    transportPerShift: 10,
                    rates: {
                        vacationPay: 0.1207, pension: 0.08, sickPay: 0.03,
                        overheads: 0.15, profit: 0.10,
                        socialSecurity: 0.09,
                        vat: 0.20
                    },
                    terms: {
                        socialContribution: 'National Insurance Contributions',
                        vatTitle: 'VAT (at 20%)',
                        vatLabel: 'VAT',
                        vatInclLabel: 'incl. VAT'
                    }
                },
                'US': {
                    currency: 'USD',
                    transportPerShift: 15,
                    rates: {
                        vacationPay: 0.08, pension: 0.08, sickPay: 0.03,
                        overheads: 0.15, profit: 0.10,
                        socialSecurity: 0.153,
                        vat: 0.00 
                    },
                     terms: {
                        socialContribution: 'Self-Employment Tax',
                        vatTitle: 'Sales Tax',
                        vatLabel: 'Tax',
                        vatInclLabel: 'incl. Tax'
                    }
                }
            };
            let currentConfig = countryConfigs['SE'];

            // State variables
            let state = {
                country: 'SE',
                usSalesTax: 0,
                baseGrossSalary: 0,
                totalBillableHours: 0,
                ob50: 0,
                ob70: 0,
                ob100: 0,
                shifts: 0
            };

            // Hourly component variables
            let hourlyRate = {
                baseSalary: 0, vacationPay: 0, pension: 0, sickPay: 0,
                overheads: 0, socialContributions: 0, profit: 0, total: 0
            };
            
            const rateDisplayInfo = { 
                labels: [
                    'Base "Gross Salary"', 'Vacation Pay', 'Pension Savings', 'Sick Pay Buffer', 'Business Overheads',
                    'Social Contributions', 'Profit Margin'
                ],
            };
            
            const chartColors = { 
                salary: 'rgba(30, 64, 175, 0.9)', vacation: 'rgba(56, 189, 248, 0.9)', 
                pension: 'rgba(14, 165, 233, 0.9)', sickPay: 'rgba(217, 70, 239, 0.9)',
                overheads: 'rgba(79, 70, 229, 0.9)', social: 'rgba(249, 115, 22, 0.9)',   
                profit: 'rgba(34, 197, 94, 0.9)'
            };
            const donutBackgroundColors = [chartColors.salary, chartColors.vacation, chartColors.pension, chartColors.sickPay, chartColors.overheads, chartColors.social, chartColors.profit];
            
            const grossSalaryInputEl = document.getElementById('grossSalaryInput');
            const totalHourlyRateDisplayEl = document.getElementById('totalHourlyRateDisplay');
            const legendContainerEl = document.getElementById('chart-legend');
            const totalHoursSliderEl = document.getElementById('totalHoursSlider');
            const totalHoursNumberInputEl = document.getElementById('totalHoursNumberInput');
            const totalHoursValueTextEl = document.getElementById('totalHoursValueText');
            const standardHoursDisplayEl = document.getElementById('standardHoursDisplay');
            const ob50HoursInputEl = document.getElementById('ob50HoursInput');
            const ob70HoursInputEl = document.getElementById('ob70HoursInput');
            const ob100HoursInputEl = document.getElementById('ob100HoursInput');
            const shiftsWorkedInputEl = document.getElementById('shiftsWorkedInput');
            const transportationIncomeDisplayEl = document.getElementById('transportationIncomeDisplay');
            const monthlyInvoicedEl = document.getElementById('monthlyInvoiced');
            const monthlySalaryEl = document.getElementById('monthlySalary');
            const yearlyInvoicedEl = document.getElementById('yearlyInvoiced');
            const yearlySalaryEl = document.getElementById('yearlySalary');
            const monthlyVacationPayEl = document.getElementById('monthlyVacationPay');
            const yearlyVacationPayEl = document.getElementById('yearlyVacationPay');
            const monthlyPensionSavingsEl = document.getElementById('monthlyPensionSavings');
            const yearlyPensionSavingsEl = document.getElementById('yearlyPensionSavings');
            const monthlySickPayEl = document.getElementById('monthlySickPay');
            const yearlySickPayEl = document.getElementById('yearlySickPay');
            const monthlyOverheadsEl = document.getElementById('monthlyOverheads');
            const yearlyOverheadsEl = document.getElementById('yearlyOverheads');
            const monthlyProfitMarginEl = document.getElementById('monthlyProfitMargin');
            const yearlyProfitMarginEl = document.getElementById('yearlyProfitMargin');
            const monthlySocialContributionsEl = document.getElementById('monthlySocialContributions');
            const yearlySocialContributionsEl = document.getElementById('yearlySocialContributions');
            const monthlyMomsEl = document.getElementById('monthlyMoms');
            const yearlyMomsEl = document.getElementById('yearlyMoms');
            const monthlyInvoicedWithMomsEl = document.getElementById('monthlyInvoicedWithMoms');
            const yearlyInvoicedWithMomsEl = document.getElementById('yearlyInvoicedWithMoms');
            const socialContributionLabelEl = document.getElementById('socialContributionLabel');
            const vatTitleEl = document.getElementById('vatTitle');
            const countrySelectEl = document.getElementById('countrySelect');
            const usSalesTaxContainerEl = document.getElementById('usSalesTaxContainer');
            const usSalesTaxInputEl = document.getElementById('usSalesTaxInput');
            
            const allInputEls = {
                country: countrySelectEl, usSalesTax: usSalesTaxInputEl, baseGrossSalary: grossSalaryInputEl,
                totalBillableHours: totalHoursNumberInputEl, ob50: ob50HoursInputEl, ob70: ob70HoursInputEl,
                ob100: ob100HoursInputEl, shifts: shiftsWorkedInputEl
            };

            const ctxBreakdown = document.getElementById('rateBreakdownChart').getContext('2d');
            const breakdownChart = new Chart(ctxBreakdown, {
                type: 'doughnut', data: { labels: rateDisplayInfo.labels, datasets: [{
                    label: 'SEK/hour', data: [], backgroundColor: donutBackgroundColors,
                    borderWidth: 1, hoverOffset: 10 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: {
                    callbacks: { label: (ctx) => {
                         const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                         const percentage = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                         return `${ctx.label}: ${formatCurrency(ctx.raw, false)} (${percentage}%)`;
                    }}
                }}, cutout: '60%'}
            });

            const ctxComparison = document.getElementById('comparisonChart').getContext('2d');
            const comparisonChart = new Chart(ctxComparison, {
                type: 'bar',
                data: {
                    labels: ['Monthly Composition'],
                    datasets: [
                        { label: 'Total "Gross Salary"', data: [0], backgroundColor: chartColors.salary },
                        { label: 'Vacation Pay', data: [0], backgroundColor: chartColors.vacation },
                        { label: 'Pension Savings', data: [0], backgroundColor: chartColors.pension },
                        { label: 'Sick Pay Buffer', data: [0], backgroundColor: chartColors.sickPay },
                        { label: 'Business Overheads', data: [0], backgroundColor: chartColors.overheads },
                        { label: 'Social Contributions', data: [0], backgroundColor: chartColors.social },
                        { label: 'Business Profit Margin', data: [0], backgroundColor: chartColors.profit }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, indexAxis: 'x',
                    scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => value / 1000 + 'k' } } },
                    plugins: { legend: { position: 'bottom', labels:{boxWidth:15, padding:10} }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } } }
                }
            });

            function saveState() {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }

            function loadState() {
                const savedStateJSON = localStorage.getItem(STORAGE_KEY);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    Object.assign(state, savedState);
                } 
                Object.keys(state).forEach(key => {
                    const el = allInputEls[key];
                    if (el) {
                        el.value = state[key];
                    }
                });
                totalHoursSliderEl.value = state.totalBillableHours;
            }
            
            function updateUI() {
                // Update config based on state
                currentConfig = countryConfigs[state.country];
                updateUIText();
                
                // Recalculate everything based on current state
                calculateStandardHourlyRateComponents();
                updateProjections();
            }

            function updateUIText() {
                socialContributionLabelEl.textContent = currentConfig.terms.socialContribution + ':';
                vatTitleEl.textContent = currentConfig.terms.vatTitle;
                document.querySelectorAll('.vat-label').forEach(el => el.textContent = `${currentConfig.terms.vatLabel} Amount (Monthly)`);
                document.querySelectorAll('.vat-incl-label').forEach(el => el.textContent = `Total Invoiced incl. ${currentConfig.terms.vatLabel} (Monthly)`);
                document.querySelectorAll('.vat-label-yearly').forEach(el => el.textContent = `${currentConfig.terms.vatLabel} Amount (Yearly)`);
                document.querySelectorAll('.vat-incl-label-yearly').forEach(el => el.textContent = `Total Invoiced incl. ${currentConfig.terms.vatLabel} (Yearly)`);
                document.querySelectorAll('span.vat-label').forEach(el => el.textContent = `Excluding ${currentConfig.terms.vatLabel}`);
                
                usSalesTaxContainerEl.classList.toggle('hidden', state.country !== 'US');
            }

            function calculateStandardHourlyRateComponents() {
                hourlyRate.baseSalary = state.baseGrossSalary;
                hourlyRate.vacationPay = hourlyRate.baseSalary * currentConfig.rates.vacationPay;
                hourlyRate.pension = hourlyRate.baseSalary * currentConfig.rates.pension;
                hourlyRate.sickPay = hourlyRate.baseSalary * currentConfig.rates.sickPay;
                hourlyRate.overheads = hourlyRate.baseSalary * currentConfig.rates.overheads;
                const subtotal = hourlyRate.baseSalary + hourlyRate.vacationPay + hourlyRate.pension + hourlyRate.sickPay + hourlyRate.overheads;
                const adjustedForEgen = subtotal / (1 - currentConfig.rates.socialSecurity);
                hourlyRate.socialContributions = adjustedForEgen - subtotal;
                hourlyRate.profit = adjustedForEgen * currentConfig.rates.profit;
                hourlyRate.total = adjustedForEgen + hourlyRate.profit;

                const chartData = [hourlyRate.baseSalary, hourlyRate.vacationPay, hourlyRate.pension, hourlyRate.sickPay, hourlyRate.overheads, hourlyRate.socialContributions, hourlyRate.profit];
                breakdownChart.data.datasets[0].data = chartData;
                breakdownChart.update();
                updateLegend(chartData);
            }
            
            function updateProjections() {
                let ob50Hours = state.ob50, ob70Hours = state.ob70, ob100Hours = state.ob100;
                let totalOB = ob50Hours + ob70Hours + ob100Hours;
                if (totalOB > state.totalBillableHours) {
                    const overage = totalOB - state.totalBillableHours;
                    const inputs = [{el: ob100HoursInputEl, key: 'ob100'}, {el: ob70HoursInputEl, key: 'ob70'}, {el: ob50HoursInputEl, key: 'ob50'}];
                    let remainingOverage = overage;
                    for (const {el, key} of inputs) {
                        let currentVal = state[key];
                        if (currentVal > 0) {
                            const reduction = Math.min(currentVal, remainingOverage);
                            state[key] = currentVal - reduction;
                            el.value = state[key].toFixed(1);
                            remainingOverage -= reduction;
                            if (remainingOverage <= 0) break;
                        }
                    }
                }
                ob50Hours = state.ob50; ob70Hours = state.ob70; ob100Hours = state.ob100;
                const standardHours = Math.max(0, state.totalBillableHours - (ob50Hours + ob70Hours + ob100Hours));
                
                const monthlyTransportationIncome = state.shifts * currentConfig.transportPerShift;
                
                let totalMonthlyGrossSalary = 0, totalMonthlyVacationPay = 0, totalMonthlyPensionSavings = 0, totalMonthlySickPay = 0;
                let totalMonthlyOverheads = 0, totalMonthlyEgenavgifter = 0, totalMonthlyProfit = 0;

                totalMonthlyGrossSalary += standardHours * hourlyRate.baseSalary;
                totalMonthlyVacationPay += standardHours * hourlyRate.vacationPay;
                totalMonthlyPensionSavings += standardHours * hourlyRate.pension;
                totalMonthlySickPay += standardHours * hourlyRate.sickPay;
                totalMonthlyOverheads += standardHours * hourlyRate.overheads;
                totalMonthlyEgenavgifter += standardHours * hourlyRate.socialContributions;
                totalMonthlyProfit += standardHours * hourlyRate.profit;
                
                const multipliers = [{ hours: ob50Hours, m: 1.5 }, { hours: ob70Hours, m: 1.7 }, { hours: ob100Hours, m: 2.0 }];
                multipliers.forEach(({hours, m}) => {
                    if (hours > 0) {
                        totalMonthlyGrossSalary += hours * hourlyRate.baseSalary * m;
                        totalMonthlyVacationPay += hours * hourlyRate.vacationPay * m;
                        totalMonthlyPensionSavings += hours * hourlyRate.pension * m;
                        totalMonthlySickPay += hours * hourlyRate.sickPay * m;
                        totalMonthlyOverheads += hours * hourlyRate.overheads * m;
                        totalMonthlyEgenavgifter += hours * hourlyRate.socialContributions * m;
                        totalMonthlyProfit += hours * hourlyRate.profit * m;
                    }
                });

                const totalMonthlyInvoicedExclMoms = totalMonthlyGrossSalary + totalMonthlyVacationPay + totalMonthlyPensionSavings + totalMonthlySickPay + totalMonthlyOverheads + totalMonthlyEgenavgifter + totalMonthlyProfit + monthlyTransportationIncome;
                
                let effectiveVatRate = currentConfig.rates.vat;
                if (currentConfig.currency === 'USD') {
                    effectiveVatRate = state.usSalesTax / 100;
                }
                const monthlyMomsVal = totalMonthlyInvoicedExclMoms * effectiveVatRate;
                
                renderDOMValues({
                    standardHours, monthlyTransportationIncome, totalMonthlyInvoicedExclMoms,
                    totalMonthlyGrossSalary, totalMonthlyVacationPay, totalMonthlyPensionSavings, totalMonthlySickPay,
                    totalMonthlyOverheads, totalMonthlyEgenavgifter, totalMonthlyProfit, monthlyMomsVal
                });
            }
            
            function renderDOMValues(data) {
                totalHoursValueTextEl.textContent = state.totalBillableHours.toFixed(1);
                standardHoursDisplayEl.textContent = data.standardHours.toFixed(1);
                totalHourlyRateDisplayEl.textContent = `${formatCurrency(hourlyRate.total, false)}`;
                transportationIncomeDisplayEl.textContent = formatCurrency(data.monthlyTransportationIncome);
                
                monthlyInvoicedEl.textContent = formatCurrency(data.totalMonthlyInvoicedExclMoms);
                yearlyInvoicedEl.textContent = formatCurrency(data.totalMonthlyInvoicedExclMoms * 12);
                monthlySalaryEl.textContent = formatCurrency(data.totalMonthlyGrossSalary);
                yearlySalaryEl.textContent = formatCurrency(data.totalMonthlyGrossSalary * 12);
                monthlyVacationPayEl.textContent = formatCurrency(data.totalMonthlyVacationPay);
                yearlyVacationPayEl.textContent = formatCurrency(data.totalMonthlyVacationPay * 12);
                monthlyPensionSavingsEl.textContent = formatCurrency(data.totalMonthlyPensionSavings);
                yearlyPensionSavingsEl.textContent = formatCurrency(data.totalMonthlyPensionSavings * 12);
                monthlySickPayEl.textContent = formatCurrency(data.totalMonthlySickPay);
                yearlySickPayEl.textContent = formatCurrency(data.totalMonthlySickPay * 12);
                monthlyOverheadsEl.textContent = formatCurrency(data.totalMonthlyOverheads);
                yearlyOverheadsEl.textContent = formatCurrency(data.totalMonthlyOverheads * 12);
                monthlyProfitMarginEl.textContent = formatCurrency(data.totalMonthlyProfit);
                yearlyProfitMarginEl.textContent = formatCurrency(data.totalMonthlyProfit * 12);
                monthlySocialContributionsEl.textContent = formatCurrency(data.totalMonthlyEgenavgifter);
                yearlySocialContributionsEl.textContent = formatCurrency(data.totalMonthlyEgenavgifter * 12);

                monthlyMomsEl.textContent = formatCurrency(data.monthlyMomsVal);
                yearlyMomsEl.textContent = formatCurrency(data.monthlyMomsVal * 12);
                monthlyInvoicedWithMomsEl.textContent = formatCurrency(data.totalMonthlyInvoicedExclMoms + data.monthlyMomsVal);
                yearlyInvoicedWithMomsEl.textContent = formatCurrency((data.totalMonthlyInvoicedExclMoms + data.monthlyMomsVal) * 12);

                comparisonChart.data.datasets[0].data[0] = data.totalMonthlyGrossSalary;
                comparisonChart.data.datasets[1].data[0] = data.totalMonthlyVacationPay;
                comparisonChart.data.datasets[2].data[0] = data.totalMonthlyPensionSavings;
                comparisonChart.data.datasets[3].data[0] = data.totalMonthlySickPay;
                comparisonChart.data.datasets[4].data[0] = data.totalMonthlyOverheads;
                comparisonChart.data.datasets[5].data[0] = data.totalMonthlyEgenavgifter;
                comparisonChart.data.datasets[6].data[0] = data.totalMonthlyProfit;
                comparisonChart.update();
            }
            
            function updateLegend(chartData) {
                legendContainerEl.innerHTML = ''; 
                rateDisplayInfo.labels.forEach((label, index) => {
                    const li = document.createElement('li'); li.className = 'flex items-center';
                    const value = chartData[index] || 0; 
                    const percentage = hourlyRate.total > 0 ? ((value / hourlyRate.total) * 100).toFixed(1) : 0;
                    li.innerHTML = `<span class="w-3 h-3 rounded-full mr-2" style="background-color: ${donutBackgroundColors[index]}"></span>
                                    <span class="flex-grow">${label}</span>
                                    <span class="ml-auto font-medium text-right">${value.toFixed(2)} (${percentage}%)</span>`;
                    legendContainerEl.appendChild(li);
                });
            }
            const formatCurrency = (value, includeCurrencyCode = true) => {
                return new Intl.NumberFormat(undefined, {
                    style: 'currency', currency: currentConfig.currency, 
                    minimumFractionDigits: 0, maximumFractionDigits: 0
                }).format(value);
            };

            function initialize() {
                loadState();

                const handleInput = (key, value) => {
                    if (key === 'totalBillableHours' || key === 'totalHoursSlider') {
                        const numValue = parseFloat(value) || 0;
                        state.totalBillableHours = numValue;
                        totalHoursSliderEl.value = numValue;
                        totalHoursNumberInputEl.value = numValue;
                    } else if (allInputEls[key].type === 'select-one') {
                        state[key] = value;
                    } else {
                        state[key] = parseFloat(value) || 0;
                    }
                    updateUI();
                    saveState();
                };
                
                Object.keys(allInputEls).forEach(key => {
                    allInputEls[key].addEventListener('input', (e) => handleInput(key, e.target.value));
                });

                totalHoursSliderEl.addEventListener('input', (e) => handleInput('totalHoursSlider', e.target.value));
                
                updateUI();
            }

            initialize();
        });