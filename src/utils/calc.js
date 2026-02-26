/**
 * calc.js
 * 純粋計算ロジックのみ。副作用なし・外部依存なし。
 * 引数として必要なデータを受け取り、結果を返す純関数。
 */

// ─── カテゴリ定数 ───────────────────────────────────────────────────────────
export const DEFAULT_EXPENSE_CATEGORIES = [
  '食費', '住居費', '光熱費', '通信費', '交通費',
  '娯楽費', '医療費', '教育費', '被服費', 'その他'
];
export const DEFAULT_INCOME_CATEGORIES = [
  '給料', 'ボーナス', '副業', '投資収益', '年金', 'その他'
];

export const BENCHMARK_DATA = {
  '20s': { average: 1760000, median: 200000 },
  '30s': { average: 5270000, median: 2000000 },
  '40s': { average: 8520000, median: 3000000 },
  '50s': { average: 13470000, median: 7000000 },
  '60s': { average: 17270000, median: 9000000 }
};

export const RISK_PROFILES = {
  conservative: { returnRate: 3, volatility: 0.05, monthlyInvestment: 30000, monthlySavings: 30000, useLumpSum: false },
  moderate:     { returnRate: 5, volatility: 0.10, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: false },
  aggressive:   { returnRate: 7, volatility: 0.18, monthlyInvestment: 80000, monthlySavings: 10000, useLumpSum: true  }
};

// ─── カテゴリ構築 ────────────────────────────────────────────────────────────
export function buildCategories(defaults, deleted, renamed, custom, orderedOrig) {
  const activeDefs = (orderedOrig && orderedOrig.length > 0 ? orderedOrig : defaults)
    .filter(d => !deleted.includes(d))
    .map(d => renamed[d] || d);
  return [...activeDefs, ...custom];
}

// ─── 年齢グループ ─────────────────────────────────────────────────────────────
export function getAgeGroup(age) {
  const a = age ?? 25;
  if (a < 30) return '20s';
  if (a < 40) return '30s';
  if (a < 50) return '40s';
  if (a < 60) return '50s';
  return '60s';
}

// ─── ベンチマーク計算 ─────────────────────────────────────────────────────────
export function calculateBenchmark(assetData, targetAge) {
  const ageGroup = getAgeGroup(targetAge);
  const benchmark = BENCHMARK_DATA[ageGroup];
  const safe = (v) => (isNaN(Number(v)) ? 0 : Number(v));
  const myTotal = safe(assetData.savings) + safe(assetData.investments)
    + safe(assetData.nisa) + safe(assetData.dryPowder);
  const avgTotal = benchmark.average;
  const medianTotal = benchmark.median;
  const difference = myTotal - avgTotal;
  const percentile = myTotal >= avgTotal
    ? 50 + Math.min((difference / avgTotal * 50), 49.9)
    : 50 - Math.min((Math.abs(difference) / avgTotal * 50), 49.9);
  return {
    myTotal, avgTotal, medianTotal, difference,
    percentile: Math.max(0.1, Math.min(99.9, isNaN(percentile) ? 0 : percentile)),
    isAboveAverage: difference >= 0,
    isAboveMedian: myTotal >= medianTotal,
    ageGroup, benchmark
  };
}

// ─── 引き落とし日計算 ─────────────────────────────────────────────────────────
export function getSettlementDate(txDate, cardId, creditCards) {
  const resolvedId = cardId ? String(cardId) : (creditCards[0] ? String(creditCards[0].id) : null);
  const card = creditCards.find(c => String(c.id) === String(resolvedId)) || creditCards[0];
  const d = new Date(txDate + 'T00:00:00');
  if (!card) return new Date(d.getFullYear(), d.getMonth() + 1, 26);

  const closingDay = card.closingDay;
  const paymentMonth = card.paymentMonth !== undefined ? card.paymentMonth : 1;
  const paymentDay = card.paymentDay;

  let year = d.getFullYear();
  let month = d.getMonth();
  const isEndOfMonth = closingDay >= 28;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const effectiveClosingDay = isEndOfMonth ? lastDayOfMonth : closingDay;
  if (d.getDate() > effectiveClosingDay) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  month += paymentMonth;
  if (month > 11) { month -= 12; year += 1; }

  let result = new Date(year, month, paymentDay);
  const nonBizRule = card.nonBusinessDay || 'next';
  if (nonBizRule !== 'none') {
    const dow = result.getDay();
    if (dow === 0 || dow === 6) {
      result = nonBizRule === 'next'
        ? new Date(result.getTime() + (dow === 0 ? 1 : 2) * 86400000)
        : new Date(result.getTime() - (dow === 6 ? 1 : 2) * 86400000);
    }
  }
  return result;
}

// ─── 月次収支計算 ─────────────────────────────────────────────────────────────
export function calculateMonthlyBalance(yearMonth, transactions, recurringTransactions) {
  const monthTransactions = transactions.filter(t => t.date.startsWith(yearMonth));
  const investingRecurringIds = new Set(
    recurringTransactions
      .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
      .map(r => r.id)
  );

  const plIncome = monthTransactions
    .filter(t => t.amount > 0 && !t.isSettlement)
    .reduce((sum, t) => sum + t.amount, 0);

  const plExpense = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && !t.isSettlement && !investingRecurringIds.has(t.recurringId))
    .reduce((sum, t) => {
      let unsettledSplit = 0;
      if (t.isSplit && t.splitMembers) {
        unsettledSplit = t.splitMembers.filter(m => !m.settled).reduce((s, m) => s + Number(m.amount), 0);
      } else if (t.isSplit && !t.splitSettled) {
        unsettledSplit = t.splitAmount || 0;
      }
      return sum + t.amount + unsettledSplit;
    }, 0));

  const investmentTransfer = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && t.recurringId && investingRecurringIds.has(t.recurringId))
    .reduce((sum, t) => sum + t.amount, 0));

  const cfIncome = monthTransactions
    .filter(t => t.amount > 0 && t.settled)
    .reduce((sum, t) => sum + t.amount, 0);

  const cfExpense = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && t.settled && !investingRecurringIds.has(t.recurringId))
    .reduce((sum, t) => sum + t.amount, 0));

  const unsettledCredit = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && !t.settled && t.paymentMethod === 'credit' && !t.isSettlement && !investingRecurringIds.has(t.recurringId))
    .reduce((sum, t) => sum + t.amount, 0));

  return {
    plIncome, plExpense, plBalance: plIncome - plExpense,
    cfIncome, cfExpense, cfBalance: cfIncome - cfExpense,
    unsettledCredit, investmentTransfer
  };
}

// ─── 未締め月リスト ───────────────────────────────────────────────────────────
export function getUnclosedMonths(transactions, monthlyHistory) {
  const result = [];
  const today = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyHistory[ym]) continue;
    if (transactions.some(t => t.date.startsWith(ym))) result.push(ym);
  }
  return result;
}

// ─── 予算分析 ─────────────────────────────────────────────────────────────────
export function calculateBudgetAnalysis(currentBalance, monthlyBudget, simulationSettings, transactions, currentMonth) {
  const actualIncome = currentBalance.plIncome;
  const actualExpense = currentBalance.plExpense;
  const actualCF = currentBalance.cfBalance;
  const totalBudgetExpense = Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0);
  const plannedSurplus = monthlyBudget.income - totalBudgetExpense;
  const actualSurplus = actualIncome - actualExpense;
  const plannedTotal = simulationSettings.monthlyInvestment + simulationSettings.monthlySavings;
  const surplusGap = actualSurplus - plannedSurplus;
  const investmentGap = plannedTotal - actualCF;
  const needsWithdrawal = investmentGap > 0;

  const categoryComparison = {};
  Object.keys(monthlyBudget.expenses).forEach(category => {
    const budgeted = monthlyBudget.expenses[category];
    const actual = transactions
      .filter(t => t.date.startsWith(currentMonth) && t.category === category && t.amount < 0 && !t.isSettlement)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    categoryComparison[category] = { budgeted, actual, difference: actual - budgeted, percentage: budgeted > 0 ? (actual / budgeted * 100) : 0 };
  });

  return {
    income: { budgeted: monthlyBudget.income, actual: actualIncome, difference: actualIncome - monthlyBudget.income },
    expense: { budgeted: totalBudgetExpense, actual: actualExpense, difference: actualExpense - totalBudgetExpense },
    surplus: { planned: plannedSurplus, actual: actualSurplus, gap: surplusGap },
    cashflow: { actual: actualCF, unsettledCredit: currentBalance.unsettledCredit },
    investment: { planned: plannedTotal, available: actualCF, gap: investmentGap, needsWithdrawal, withdrawalAmount: needsWithdrawal ? investmentGap : 0 },
    categoryComparison
  };
}

// ─── カテゴリ別支出 ───────────────────────────────────────────────────────────
export function calculateCategoryExpenses(transactions, currentMonth, recurringTransactions) {
  const investRecurringIds = new Set(
    recurringTransactions
      .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
      .map(r => r.id)
  );
  const monthTxns = transactions.filter(t =>
    t.date.startsWith(currentMonth) && t.amount < 0 && !t.isSettlement &&
    !(t.recurringId && investRecurringIds.has(t.recurringId))
  );
  const totals = monthTxns.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  return Object.entries(totals).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

// ─── カレンダー計算 ───────────────────────────────────────────────────────────
export function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).getDay();
}

export function getTransactionsForDay(transactions, yearMonth, day) {
  const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
  return transactions.filter(t => t.date === dateStr);
}

export function getDayBalance(transactions, yearMonth, day) {
  const dayTxns = getTransactionsForDay(transactions, yearMonth, day).filter(t => !t.isSettlement);
  const income = dayTxns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expense = Math.abs(dayTxns.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  return { income, expense, balance: income - expense };
}

// ─── 直近6ヶ月トレンド ───────────────────────────────────────────────────────
export function getLast6MonthsTrend(transactions, recurringTransactions) {
  const trends = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const balance = calculateMonthlyBalance(yearMonth, transactions, recurringTransactions);
    trends.push({ month: date.toLocaleDateString('ja-JP', { month: 'short' }), PL: balance.plBalance });
  }
  return trends;
}

// ─── シミュレーション計算 ─────────────────────────────────────────────────────
export function calculateSimulation(simulationSettings, assetData, lifeEvents) {
  const { years, monthlyInvestment, monthlySavings, savingsInterestRate, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumMonths } = simulationSettings;
  const monthlyRate = returnRate / 100 / 12;
  const savingsMonthlyRate = savingsInterestRate / 100 / 12;
  const TAX_RATE = 0.20315;
  const NISA_TSUMITATE_LIMIT = 3600000;
  const NISA_GROWTH_LIMIT = 2400000;
  const NISA_TOTAL_LIMIT = 18000000;

  let results = [];
  let regularInvestment = assetData.investments;
  let nisaInvestment = assetData.nisa || 0;
  let savings = assetData.savings;
  let dryPowder = assetData.dryPowder || 0;
  let cumulativeTaxSaved = 0;
  let nisaTotalUsed = nisaInvestment;

  for (let year = 1; year <= years; year++) {
    let nisaUsedThisYear = 0;
    let yearlyProfit = 0;

    for (let month = 1; month <= 12; month++) {
      if (monthlySavings > 0) savings += monthlySavings;
      savings += savings * savingsMonthlyRate;

      let currentMonthInvestment = 0;
      if (monthlyInvestment > 0) currentMonthInvestment += monthlyInvestment;
      if (useLumpSum && lumpSumMonths.includes(month)) currentMonthInvestment += lumpSumAmount;

      if (currentMonthInvestment > 0) {
        if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + (useLumpSum ? NISA_GROWTH_LIMIT : 0))) {
          const availableYearlySpace = (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT) - nisaUsedThisYear;
          const nisaSpace = Math.min(currentMonthInvestment, NISA_TOTAL_LIMIT - nisaTotalUsed, availableYearlySpace);
          nisaInvestment += nisaSpace;
          nisaTotalUsed += nisaSpace;
          nisaUsedThisYear += nisaSpace;
          const remaining = currentMonthInvestment - nisaSpace;
          if (remaining > 0) regularInvestment += remaining;
        } else {
          regularInvestment += currentMonthInvestment;
        }
      }

      const nisaMonthlyProfit = nisaInvestment * monthlyRate;
      const regularMonthlyProfit = regularInvestment * monthlyRate;
      nisaInvestment += nisaMonthlyProfit;
      const regularTax = regularMonthlyProfit * TAX_RATE;
      regularInvestment += (regularMonthlyProfit - regularTax);
      yearlyProfit += nisaMonthlyProfit + regularMonthlyProfit;
      cumulativeTaxSaved += nisaMonthlyProfit * TAX_RATE;

      const currentDate = new Date();
      currentDate.setFullYear(currentDate.getFullYear() + year - 1);
      currentDate.setMonth(month - 1);
      const yearMonth = currentDate.toISOString().slice(0, 7);

      lifeEvents.filter(e => e.date === yearMonth).forEach(event => {
        if (dryPowder >= event.amount) { dryPowder -= event.amount; }
        else if (savings >= event.amount) { savings -= event.amount; }
        else {
          const fromSavings = savings;
          const remaining = event.amount - fromSavings;
          savings = 0;
          if (regularInvestment >= remaining) { regularInvestment -= remaining; }
          else {
            const fromRegular = regularInvestment;
            regularInvestment = 0;
            nisaInvestment = Math.max(0, nisaInvestment - (remaining - fromRegular));
          }
        }
      });
    }

    const totalValue = Number(savings) + Number(regularInvestment) + Number(nisaInvestment) + Number(dryPowder);
    const peerAverage = 3500000 * Math.pow(1.065, year);
    const diff = totalValue - peerAverage;
    const outperformRate = ((totalValue / peerAverage) - 1) * 100;
    const ratio = totalValue / peerAverage;
    let percentile = 50 / Math.pow(ratio, 2);
    percentile = Math.max(0.1, Math.min(99, percentile));

    results.push({
      year,
      totalValue: Math.round(totalValue),
      savings: Math.round(savings),
      regularInvestment: Math.round(regularInvestment),
      nisaInvestment: Math.round(nisaInvestment),
      dryPowder: Math.round(dryPowder),
      peerAverage: Math.round(peerAverage),
      diff: Math.round(diff),
      outperformRate: outperformRate.toFixed(1),
      percentile: percentile.toFixed(1),
      nisaUsed: Math.round(nisaTotalUsed),
      taxSaved: Math.round(cumulativeTaxSaved),
      yearlyProfit: Math.round(yearlyProfit)
    });
  }
  return results;
}

// ─── モンテカルロシミュレーション ────────────────────────────────────────────
export function runMonteCarloSimulation(simulationSettings, assetData, lifeEvents, numSimulations = 100) {
  const { years, monthlyInvestment, monthlySavings, savingsInterestRate, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumMonths, riskProfile } = simulationSettings;
  const volatility = RISK_PROFILES[riskProfile]?.volatility || 0.10;
  const monthlyRate = returnRate / 100 / 12;
  const savingsMonthlyRate = savingsInterestRate / 100 / 12;
  const NISA_TSUMITATE_LIMIT = 3600000;
  const NISA_GROWTH_LIMIT = 2400000;
  const NISA_TOTAL_LIMIT = 18000000;

  let allSimulations = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    let regularInvestment = assetData.investments;
    let nisaInvestment = assetData.nisa || 0;
    let savings = assetData.savings;
    let dryPowder = assetData.dryPowder || 0;
    let nisaUsedThisYear = 0;
    let nisaTotalUsed = nisaInvestment;
    let simulationPath = [];

    for (let year = 1; year <= years; year++) {
      nisaUsedThisYear = 0;
      for (let month = 1; month <= 12; month++) {
        if (monthlySavings > 0) savings += monthlySavings;
        savings += savings * savingsMonthlyRate;
        if (monthlyInvestment > 0) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < NISA_TSUMITATE_LIMIT) {
            const nisaSpace = Math.min(monthlyInvestment, NISA_TOTAL_LIMIT - nisaTotalUsed, NISA_TSUMITATE_LIMIT - nisaUsedThisYear);
            nisaInvestment += nisaSpace; nisaTotalUsed += nisaSpace; nisaUsedThisYear += nisaSpace;
            const remaining = monthlyInvestment - nisaSpace;
            if (remaining > 0) regularInvestment += remaining;
          } else { regularInvestment += monthlyInvestment; }
        }
        if (useLumpSum && lumpSumMonths.includes(month)) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT && nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT)) {
            const availableGrowth = NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT - nisaUsedThisYear;
            const nisaSpace = Math.min(lumpSumAmount, NISA_TOTAL_LIMIT - nisaTotalUsed, availableGrowth);
            nisaInvestment += nisaSpace; nisaTotalUsed += nisaSpace; nisaUsedThisYear += nisaSpace;
            const remaining = lumpSumAmount - nisaSpace;
            if (remaining > 0) regularInvestment += remaining;
          } else { regularInvestment += lumpSumAmount; }
        }
        const randomReturn = monthlyRate + (Math.random() - 0.5) * 2 * volatility / Math.sqrt(12);
        nisaInvestment += nisaInvestment * randomReturn;
        regularInvestment += regularInvestment * randomReturn;

        const currentDate = new Date();
        currentDate.setFullYear(currentDate.getFullYear() + year - 1);
        currentDate.setMonth(month - 1);
        const yearMonth = currentDate.toISOString().slice(0, 7);
        lifeEvents.filter(e => e.date === yearMonth).forEach(event => {
          if (dryPowder >= event.amount) dryPowder -= event.amount;
          else if (savings >= event.amount) savings -= event.amount;
          else { const fromSavings = savings; savings = 0; if (regularInvestment >= event.amount - fromSavings) regularInvestment -= event.amount - fromSavings; else regularInvestment = 0; }
        });
      }
      simulationPath.push({ year, totalValue: Math.round(savings + regularInvestment + nisaInvestment + dryPowder) });
    }
    allSimulations.push(simulationPath);
  }

  const statistics = [];
  for (let year = 0; year < years; year++) {
    const yearValues = allSimulations.map(sim => sim[year].totalValue);
    const sorted = [...yearValues].sort((a, b) => a - b);
    statistics.push({
      year: year + 1,
      average: Math.round(yearValues.reduce((a, b) => a + b, 0) / numSimulations),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      p25: Math.round(sorted[Math.floor(numSimulations * 0.25)]),
      p75: Math.round(sorted[Math.floor(numSimulations * 0.75)])
    });
  }
  return statistics;
}

// ─── 定期取引の日付リスト生成（副作用なし） ──────────────────────────────────
export function getRecurringTargetDates(recurring, currentMonth) {
  const recurrenceType = recurring.recurrenceType || 'monthly-date';
  let targetDates = [];

  if (recurrenceType === 'monthly-date') {
    targetDates.push(`${currentMonth}-${String(recurring.day).padStart(2, '0')}`);
  } else if (recurrenceType === 'monthly-weekday') {
    const [year, month] = currentMonth.split('-').map(Number);
    const weekdayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetWeekday = weekdayMap[recurring.weekday];
    let occurrenceCount = 0;
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1) break;
      if (date.getDay() === targetWeekday) {
        occurrenceCount++;
        if (recurring.weekNumber !== -1 && occurrenceCount === recurring.weekNumber) {
          targetDates.push(date.toISOString().slice(0, 10));
          break;
        }
      }
    }
    if (recurring.weekNumber === -1 && occurrenceCount > 0) {
      for (let day = 31; day >= 1; day--) {
        const date = new Date(year, month - 1, day);
        if (date.getMonth() !== month - 1) continue;
        if (date.getDay() === targetWeekday) { targetDates.push(date.toISOString().slice(0, 10)); break; }
      }
    }
  } else if (recurrenceType === 'weekly') {
    const [year, month] = currentMonth.split('-').map(Number);
    const weekdayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetWeekday = weekdayMap[recurring.weekday];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1) break;
      if (date.getDay() === targetWeekday) {
        const startDate = new Date(recurring.startDate || '2026-01-01');
        const weeksDiff = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
        if (weeksDiff % (recurring.interval || 1) === 0) targetDates.push(date.toISOString().slice(0, 10));
      }
    }
  }
  return targetDates;
}
