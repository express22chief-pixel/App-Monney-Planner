/**
 * calc.js
 * 純粋計算ロジックのみ。副作用なし・外部依存なし。
 * 引数として必要なデータを受け取り、結果を返す純関数。
 */

// --- カテゴリ定数 -----------------------------------------------------------
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

// --- カテゴリ構築 ------------------------------------------------------------
export function buildCategories(defaults, deleted, renamed, custom, orderedOrig) {
  const activeDefs = (orderedOrig && orderedOrig.length > 0 ? orderedOrig : defaults)
    .filter(d => !deleted.includes(d))
    .map(d => renamed[d] || d);
  return [...activeDefs, ...custom];
}

// --- 年齢グループ -------------------------------------------------------------
export function getAgeGroup(age) {
  const a = age ?? 25;
  if (a < 30) return '20s';
  if (a < 40) return '30s';
  if (a < 50) return '40s';
  if (a < 60) return '50s';
  return '60s';
}

// --- ベンチマーク計算 ---------------------------------------------------------
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

// --- 引き落とし日計算 ---------------------------------------------------------
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

// --- 月次収支計算 -------------------------------------------------------------
export function calculateMonthlyBalance(yearMonth, transactions, recurringTransactions) {
  const monthTransactions = transactions.filter(t => t.date.startsWith(yearMonth));
  const investingRecurringIds = new Set(
    recurringTransactions
      .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
      .map(r => r.id)
  );

  const plIncome = monthTransactions
    .filter(t => t.amount > 0 && !t.isSettlement && t.type !== 'transfer' && !t.isTransfer)
    .reduce((sum, t) => sum + t.amount, 0);

  const plExpense = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && !t.isSettlement && t.type !== 'transfer' && !t.isTransfer && !investingRecurringIds.has(t.recurringId))
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
    .filter(t => t.amount > 0 && t.settled && t.type !== 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const cfExpense = Math.abs(monthTransactions
    .filter(t => t.amount < 0 && t.settled && t.type !== 'transfer' && !investingRecurringIds.has(t.recurringId))
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

// --- 未締め月リスト -----------------------------------------------------------
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

// --- 予算分析 -----------------------------------------------------------------
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

// --- カテゴリ別支出 -----------------------------------------------------------
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

// --- カレンダー計算 -----------------------------------------------------------
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

// --- 直近6ヶ月トレンド -------------------------------------------------------
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

// --- シミュレーション計算 -----------------------------------------------------
export function calculateSimulation(simulationSettings, assetData, lifeEvents) {
  const { years, monthlyInvestment, monthlySavings, savingsInterestRate, returnRate, useNisa, useLumpSum, lumpSumAmount, lumpSumMonths,
    inflationRate = 0, incomeGrowthRate = 0 } = simulationSettings;
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
    // 収入成長率による積立・貯金の増加
    const growthMultiplier = Math.pow(1 + incomeGrowthRate / 100, year - 1);
    const yearlyMonthlyInvestment = Math.round(monthlyInvestment * growthMultiplier);
    const yearlyMonthlySavings = Math.round(monthlySavings * growthMultiplier);

    for (let month = 1; month <= 12; month++) {
      if (yearlyMonthlySavings > 0) savings += yearlyMonthlySavings;
      savings += savings * savingsMonthlyRate;

      let currentMonthInvestment = 0;
      if (yearlyMonthlyInvestment > 0) currentMonthInvestment += yearlyMonthlyInvestment;
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
    const realValue = inflationRate > 0 ? Math.round(totalValue / Math.pow(1 + inflationRate / 100, year)) : totalValue;
    const peerAverage = 3500000 * Math.pow(1.065, year);
    const diff = totalValue - peerAverage;
    const outperformRate = ((totalValue / peerAverage) - 1) * 100;
    const ratio = totalValue / peerAverage;
    let percentile = 50 / Math.pow(ratio, 2);
    percentile = Math.max(0.1, Math.min(99, percentile));

    results.push({
      year,
      totalValue: Math.round(totalValue),
      realValue: Math.round(realValue),
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

// --- モンテカルロシミュレーション --------------------------------------------
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

// --- 定期取引の日付リスト生成（副作用なし） ----------------------------------
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

// --- 取り崩しシミュレーション -------------------------------------------------
/**
 * 積み立てフェーズ終了後、取り崩しフェーズをシミュレーション。
 * @param {number} principal - 取り崩し開始時の資産額
 * @param {object} withdrawalSettings - { monthlyWithdrawal, returnRate, inflationRate, years }
 * @returns {{ results: Array, depletedYear: number|null, finalValue: number }}
 */
export function calculateWithdrawalSimulation(principal, withdrawalSettings) {
  const { monthlyWithdrawal, returnRate, inflationRate = 2, years } = withdrawalSettings;
  const monthlyRate = returnRate / 100 / 12;
  const monthlyInflation = inflationRate / 100 / 12;
  const TAX_RATE = 0.20315;

  let balance = principal;
  let depletedYear = null;
  let cumulativeWithdrawn = 0;
  const results = [];

  for (let year = 1; year <= years; year++) {
    // インフレ調整後の実質取り崩し額（毎年上昇）
    const inflationMultiplier = Math.pow(1 + inflationRate / 100, year - 1);
    const adjustedMonthlyWithdrawal = monthlyWithdrawal * inflationMultiplier;

    let yearStartBalance = balance;
    for (let month = 1; month <= 12; month++) {
      if (balance <= 0) { balance = 0; break; }
      // 運用益（税引き後）
      const profit = balance * monthlyRate;
      const afterTaxProfit = profit * (1 - TAX_RATE);
      balance += afterTaxProfit;
      // 取り崩し
      const withdrawal = Math.min(balance, adjustedMonthlyWithdrawal);
      balance -= withdrawal;
      cumulativeWithdrawn += withdrawal;
    }

    if (balance <= 0 && depletedYear === null) depletedYear = year;

    results.push({
      year,
      balance: Math.round(Math.max(0, balance)),
      yearStartBalance: Math.round(yearStartBalance),
      monthlyWithdrawal: Math.round(adjustedMonthlyWithdrawal),
      cumulativeWithdrawn: Math.round(cumulativeWithdrawn),
      realValue: Math.round(Math.max(0, balance) / Math.pow(1 + inflationRate / 100, year)),
    });

    if (balance <= 0) break;
  }

  // ループが years 回全部回りきった場合は持続可能
  const completed = results.length === years && (results[results.length - 1]?.balance ?? 0) > 0;

  return {
    results,
    depletedYear,
    finalValue: Math.round(Math.max(0, balance)),
    sustainableYears: depletedYear
      ? depletedYear
      : completed
        ? `${years}年以上`
        : results.length,
  };
}

// --- 住宅ローン計算ユーティリティ --------------------------------------------

/** 元利均等返済の月返済額 */
export function calcMonthlyPayment(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

/** 変動金利シナリオの金利スケジュール生成 */
export function buildRateSchedule(baseRate, scenario, totalMonths) {
  const schedule = [];
  for (let m = 0; m < totalMonths; m++) {
    const year = Math.floor(m / 12);
    let rate = baseRate;
    if (scenario === 'neutral') {
      if (year >= 10) rate = baseRate + 2.0;
      else if (year >= 5) rate = baseRate + 1.0;
    } else if (scenario === 'pessimistic') {
      const increase = Math.min(year >= 3 ? (year - 2) * 0.5 : 0, 3.0);
      rate = baseRate + increase;
    }
    schedule.push(Math.max(0.1, rate));
  }
  return schedule;
}

/** ローン控除額の計算（年別） */
export function calcMortgageTaxCredit(loanBalance, propertyType, annualIncome, year) {
  if (year > 13) return 0;
  const limits = {
    'new_eco':  { rate: 0.007, max: 350000 },
    'new_other':{ rate: 0.007, max: 210000 },
    'used':     { rate: 0.007, max: 140000 },
  };
  const limit = limits[propertyType] || limits['new_other'];
  // 年収2000万超は対象外
  if (annualIncome > 20000000) return 0;
  // 年末残高 × 0.7%、上限あり
  return Math.min(loanBalance * limit.rate, limit.max);
}

/** 不動産時価の計算 */
export function calcPropertyValue(purchasePrice, landRatio, depreciationRate, years, landAppreciationRate = 0) {
  // 土地部分は地価変動率に連動、建物部分は減価
  const landValue = purchasePrice * landRatio * Math.pow(1 + landAppreciationRate / 100, years);
  const buildingValue = purchasePrice * (1 - landRatio);
  const depreciatedBuilding = buildingValue * Math.pow(1 - depreciationRate / 100, years);
  return Math.max(0, landValue + depreciatedBuilding);
}

// --- 持ち家 vs 賃貸 比較シミュレーション ------------------------------------
/**
 * @param {object} p - housing params
 * @param {object} s - simulation base settings
 */
export function calculateHousingComparison(p, s) {
  const {
    propertyPrice, downPayment, loanMonths, interestRate, rateType,
    managementFee, propertyTax, propertyType, landRatio, depreciationRate, landAppreciationRate = 0,
    monthlyRent, renewalFee, rentInflationRate,
    annualIncome, compareYears,
    prepaymentYearly = 0,
    renovationCycles = 0,
  } = p;
  const {
    returnRate,
    assetData,
    incomeGrowthRate = 0,
    monthlyIncome    = 0,
  } = s;

  const principal     = propertyPrice - downPayment;
  const totalMonths   = loanMonths;
  const compareMonths = compareYears * 12;
  const investRate    = returnRate / 100 / 12;
  const TAX_RATE      = 0.20315;

  const rateSchedules = {
    fixed:       Array(compareMonths).fill(interestRate),
    optimistic:  buildRateSchedule(interestRate, 'optimistic', compareMonths),
    neutral:     buildRateSchedule(interestRate, 'neutral',    compareMonths),
    pessimistic: buildRateSchedule(interestRate, 'pessimistic',compareMonths),
  };

  const scenarios = rateType === 'fixed'
    ? [{ key: 'fixed', label: '固定金利', color: '#3b82f6' }]
    : [
        { key: 'optimistic',  label: '変動（楽観）', color: '#10b981' },
        { key: 'neutral',     label: '変動（中立）', color: '#f59e0b' },
        { key: 'pessimistic', label: '変動（悲観）', color: '#ef4444' },
      ];

  const acquisitionCost = propertyPrice * 0.03;
  const saleCost        = propertyPrice * 0.03;

  // -- 購入シナリオ ----------------------------------------------------------
  const buyResults = scenarios.map(scenario => {
    let loanBalance     = principal;
    let financialAssets = assetData
      ? (assetData.savings + assetData.investments + assetData.nisa + assetData.dryPowder)
      : 0;
    financialAssets -= downPayment + acquisitionCost;

    let totalInterest  = 0;
    let totalTaxCredit = 0;
    let totalPrepay    = 0;
    const yearlyData   = [];

    for (let year = 1; year <= compareYears; year++) {
      const incomeGrowthMult = Math.pow(1 + incomeGrowthRate / 100, year - 1);
      const extraMgmt = (renovationCycles > 0 && year >= 15) ? renovationCycles : 0;
      let yearInterest = 0;

      for (let m = 0; m < 12; m++) {
        const monthIdx       = (year - 1) * 12 + m;
        if (monthIdx >= compareMonths) break;
        const rate           = rateSchedules[scenario.key][monthIdx];
        const monthlyPayment = loanBalance > 0
          ? calcMonthlyPayment(loanBalance, rate, Math.max(1, totalMonths - monthIdx))
          : 0;
        const monthInterest  = loanBalance * (rate / 100 / 12);
        const monthPrincipal = Math.min(loanBalance, monthlyPayment - monthInterest);
        yearInterest  += monthInterest;
        totalInterest += monthInterest;
        loanBalance    = Math.max(0, loanBalance - monthPrincipal);

        const buyMonthlyTotal = monthlyPayment + managementFee + extraMgmt + propertyTax / 12;
        const rentThisMonth   = monthlyRent * Math.pow(1 + rentInflationRate / 100, year - 1);
        const surplus         = Math.max(0, (rentThisMonth * incomeGrowthMult) - buyMonthlyTotal);

        if (financialAssets > 0) {
          financialAssets += financialAssets * investRate * (1 - TAX_RATE);
        }
        financialAssets += surplus;
      }

      // 繰り上げ返済（年1回、年末）
      if (prepaymentYearly > 0 && loanBalance > 0) {
        const actual     = Math.min(prepaymentYearly, loanBalance);
        loanBalance     -= actual;
        financialAssets -= actual;
        totalPrepay     += actual;
      }

      const taxCredit   = calcMortgageTaxCredit(loanBalance, propertyType, annualIncome, year);
      totalTaxCredit   += taxCredit;
      financialAssets  += taxCredit;

      const propertyValue = calcPropertyValue(propertyPrice, landRatio, depreciationRate, year, landAppreciationRate);
      const saleCostAdj   = year === compareYears ? saleCost : 0;
      const netAssets     = financialAssets + propertyValue - loanBalance - saleCostAdj;

      yearlyData.push({
        year,
        financialAssets: Math.round(financialAssets),
        propertyValue:   Math.round(propertyValue),
        loanBalance:     Math.round(loanBalance),
        netAssets:       Math.round(netAssets),
        yearInterest:    Math.round(yearInterest),
        taxCredit:       Math.round(taxCredit),
        runningCost:     Math.round((managementFee + extraMgmt) * 12 + propertyTax),
      });
    }

    const last = yearlyData[yearlyData.length - 1];
    return {
      ...scenario,
      yearlyData,
      totalInterest:   Math.round(totalInterest),
      totalTaxCredit:  Math.round(totalTaxCredit),
      totalRepayment:  Math.round(principal + totalInterest),
      totalPrepay:     Math.round(totalPrepay),
      acquisitionCost: Math.round(acquisitionCost),
      saleCost:        Math.round(saleCost),
      finalNetAssets:  last.netAssets,
      finalProperty:   last.propertyValue,
      finalLoan:       last.loanBalance,
    };
  });

  // -- 賃貸+投資シナリオ -------------------------------------------------------
  const refBuy   = buyResults.find(r => r.key === 'fixed' || r.key === 'neutral') || buyResults[0];
  const refRates = rateSchedules[refBuy.key];

  let rentAssets    = assetData
    ? (assetData.savings + assetData.investments + assetData.nisa + assetData.dryPowder)
    : 0;
  rentAssets       += downPayment + acquisitionCost;
  let totalRentPaid = 0;
  const rentYearlyData = [];

  for (let year = 1; year <= compareYears; year++) {
    const incomeGrowthMult = Math.pow(1 + incomeGrowthRate / 100, year - 1);
    const inflationMult    = Math.pow(1 + rentInflationRate / 100, year - 1);
    const currentRent      = monthlyRent * inflationMult;
    const renewal          = year % 2 === 0 ? renewalFee * inflationMult : 0;
    const extraMgmt        = (renovationCycles > 0 && year >= 15) ? renovationCycles : 0;

    // 購入側の年初ローン残高（月次で正確に追う）
    const yearStartLoanBal = year === 1 ? principal : (refBuy.yearlyData[year - 2]?.loanBalance || 0);

    for (let m = 0; m < 12; m++) {
      const monthIdx   = (year - 1) * 12 + m;
      const rate       = refRates[Math.min(monthIdx, refRates.length - 1)];
      // 月次で残高を再計算（年内の元本返済を追う）
      const refMonthly = yearStartLoanBal > 0
        ? calcMonthlyPayment(yearStartLoanBal, rate, Math.max(1, loanMonths - (year - 1) * 12))
        : 0;
      const refMonthlyTotal = refMonthly + managementFee + extraMgmt + propertyTax / 12;

      const renewalThisMonth = m === 11 ? renewal : 0;
      const rentTotal        = currentRent + renewalThisMonth;
      const surplus          = Math.max(0, (refMonthlyTotal * incomeGrowthMult) - rentTotal);

      rentAssets += rentAssets * investRate * (1 - TAX_RATE) + surplus;
    }
    totalRentPaid += currentRent * 12 + renewal;

    rentYearlyData.push({
      year,
      netAssets:     Math.round(rentAssets),
      monthlyRent:   Math.round(currentRent),
      totalRentPaid: Math.round(totalRentPaid),
    });
  }

  // -- サマリー ---------------------------------------------------------------
  const rentFinal = rentYearlyData[rentYearlyData.length - 1]?.netAssets || 0;
  const buyFinal  = refBuy.finalNetAssets;
  const diff      = rentFinal - buyFinal;

  return {
    buyScenarios: buyResults,
    rentScenario: {
      yearlyData:     rentYearlyData,
      finalNetAssets: rentFinal,
      totalRentPaid:  Math.round(totalRentPaid),
    },
    summary: {
      winner:    diff > 0 ? 'rent' : 'buy',
      diff:      Math.abs(diff),
      buyFinal,
      rentFinal,
      crossoverYear: (() => {
        for (let i = 1; i < compareYears; i++) {
          const prevBuy  = refBuy.yearlyData[i-1]?.netAssets || 0;
          const prevRent = rentYearlyData[i-1]?.netAssets   || 0;
          const curBuy   = refBuy.yearlyData[i]?.netAssets   || 0;
          const curRent  = rentYearlyData[i]?.netAssets      || 0;
          if ((prevBuy - prevRent) * (curBuy - curRent) < 0) return i + 1;
        }
        return null;
      })(),
    },
  };
}


// ============================================================================
// ライフプランシミュレーション
// ============================================================================
/**
 * calculateLifePlanSimulation
 *
 * 現在年齢〜想定寿命まで、ライフフェーズをまたいで資産推移を計算する。
 *
 * フェーズ1: 現在 〜 リタイア  → 収入あり・積立あり
 * フェーズ2: リタイア 〜 寿命  → 年金収入・取り崩し
 *
 * @param {object} lifePlan   - ライフプラン設定
 * @param {object} simSettings - 既存 simulationSettings（投資設定を流用）
 * @param {object} assetData  - 現在の資産
 * @param {Array}  lifeEvents - ライフイベント一覧
 * @param {object} housingParams - 住宅購入パラメータ（null なら賃貸継続）
 * @returns {{ byAge: Array, summary: object }}
 */
export function calculateLifePlanSimulation(lifePlan, simSettings, assetData, lifeEvents, housingParams) {
  const {
    currentAge               = 30,
    retirementAge            = 65,
    lifeExpectancy           = 90,
    annualIncome             = 6000000,
    incomeGrowthRate         = 1,
    monthlyExpense           = 200000,
    retirementMonthlyIncome  = 150000,
    retirementMonthlyExpense = 200000,
  } = lifePlan;

  const {
    returnRate          = 5,
    useNisa             = true,
    monthlyInvestment   = 30000,
    savingsInterestRate = 0.2,
  } = simSettings;

  const TAX_RATE             = 0.20315;
  const NISA_TSUMITATE_LIMIT = 3600000;
  const NISA_GROWTH_LIMIT    = 2400000;
  const NISA_TOTAL_LIMIT     = 18000000;
  const monthlyRate          = returnRate / 100 / 12;
  const savingsMonthlyRate   = savingsInterestRate / 100 / 12;
  const totalYears           = lifeExpectancy - currentAge;
  const workYears            = Math.max(0, retirementAge - currentAge);
  const nowYear              = new Date().getFullYear();

  // 住宅設定
  // housingParams があれば「現時点で住宅購入済み」として扱う
  // 購入年齢はライフイベントの type==='housing' から取得、なければ currentAge
  let loanBalance         = 0;
  let loanRemainingMonths = 0;
  let housingPurchaseAge  = null;

  if (housingParams) {
    // ライフイベントに住宅購入イベントがあればその年齢を使う
    const housingEvent = lifeEvents.find(e => e.type === 'housing');
    if (housingEvent) {
      const evYear = parseInt(housingEvent.date?.slice(0, 4));
      housingPurchaseAge = currentAge + (evYear - nowYear);
    } else {
      // ライフイベントにない場合は「今すぐ購入」として currentAge を使う
      housingPurchaseAge = currentAge;
      const dp        = housingParams.downPayment || 0;
      const principal = (housingParams.propertyPrice || 0) - dp;
      loanBalance         = Math.max(0, principal);
      loanRemainingMonths = housingParams.loanMonths || 360;
    }
  }

  // 初期資産
  let savings       = assetData?.savings     || 0;
  let regularInvest = assetData?.investments || 0;
  let nisaInvest    = assetData?.nisa        || 0;
  let dryPowder     = assetData?.dryPowder   || 0;
  let nisaTotalUsed = nisaInvest;

  // 住宅購入済みの場合は頭金・諸費用を即座に控除
  if (housingParams && housingPurchaseAge === currentAge) {
    const dp      = housingParams.downPayment || 0;
    const acqCost = (housingParams.propertyPrice || 0) * 0.03;
    const total   = dp + acqCost;
    if (savings >= total)        { savings    -= total; }
    else if (dryPowder >= total)  { dryPowder  -= total; }
    else { savings = Math.max(0, savings - total); }
  }

  const byAge      = [];
  let depletionAge = null;

  // ── ヘルパー: 資産から金額を引く ────────────────────────────────────
  function deductAssets(amount) {
    if (amount <= 0) return;
    if (dryPowder >= amount)    { dryPowder    -= amount; return; }
    amount -= dryPowder; dryPowder = 0;
    if (savings >= amount)      { savings      -= amount; return; }
    amount -= savings; savings = 0;
    if (regularInvest >= amount){ regularInvest -= amount; return; }
    amount -= regularInvest; regularInvest = 0;
    nisaInvest = Math.max(0, nisaInvest - amount);
  }

  for (let y = 0; y < totalYears; y++) {
    const age       = currentAge + y;
    const isRetired = age >= retirementAge;
    const workYear  = Math.min(y, workYears - 1);
    const growthMult = isRetired ? 0 : Math.pow(1 + incomeGrowthRate / 100, workYear);
    let nisaUsedThisYear = 0;

    // ── ライフイベント：住宅購入（この年齢で発生）──────────────────────
    if (housingParams && housingPurchaseAge === age && age !== currentAge) {
      const dp        = housingParams.downPayment || 0;
      const acqCost   = (housingParams.propertyPrice || 0) * 0.03;
      const principal = (housingParams.propertyPrice || 0) - dp;
      deductAssets(dp + acqCost);
      loanBalance         = Math.max(0, principal);
      loanRemainingMonths = housingParams.loanMonths || 360;
    }

    // ── 月次ループ ──────────────────────────────────────────────────────
    for (let m = 0; m < 12; m++) {

      // ローン返済（元利均等）
      if (loanBalance > 0 && loanRemainingMonths > 0) {
        const rate  = (housingParams?.interestRate || 0.5) / 100 / 12;
        const mp    = calcMonthlyPayment(loanBalance, housingParams?.interestRate || 0.5, loanRemainingMonths);
        const mi    = loanBalance * rate;
        const mprin = Math.min(loanBalance, Math.max(0, mp - mi));
        loanBalance         = Math.max(0, loanBalance - mprin);
        loanRemainingMonths = Math.max(0, loanRemainingMonths - 1);
        // ローン返済額は月間支出 monthlyExpense に含まれているとして別途控除
        deductAssets(mp);
      }

      if (!isRetired) {
        // 現役フェーズ
        const monthlyGross = (annualIncome * growthMult) / 12;
        const monthlyNet   = monthlyGross * 0.8; // 手取り80%

        // 住宅コスト：ローン中は mp 分を deductAssets で払済、賃貸は生活費に含む
        const livingCost = monthlyExpense;
        const invest     = Math.min(
          monthlyInvestment * growthMult,
          Math.max(0, monthlyNet - livingCost)
        );
        const surplus    = Math.max(0, monthlyNet - livingCost - invest);

        savings += surplus + savings * savingsMonthlyRate;

        if (invest > 0) {
          if (useNisa && nisaTotalUsed < NISA_TOTAL_LIMIT &&
              nisaUsedThisYear < (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT)) {
            const space = Math.min(
              invest,
              NISA_TOTAL_LIMIT - nisaTotalUsed,
              (NISA_TSUMITATE_LIMIT + NISA_GROWTH_LIMIT) - nisaUsedThisYear
            );
            nisaInvest    += space;
            nisaTotalUsed += space;
            nisaUsedThisYear += space;
            if (invest - space > 0) regularInvest += invest - space;
          } else {
            regularInvest += invest;
          }
        }
      } else {
        // リタイア後フェーズ
        const cf = retirementMonthlyIncome - retirementMonthlyExpense;
        if (cf >= 0) {
          savings += cf;
        } else {
          deductAssets(-cf);
        }
      }

      // 運用益
      const nisaProfit    = nisaInvest    * monthlyRate;
      const regularProfit = regularInvest * monthlyRate;
      nisaInvest    += nisaProfit;
      regularInvest += regularProfit * (1 - TAX_RATE);
    }

    // ── ライフイベント：住宅以外（年次処理）────────────────────────────
    lifeEvents.forEach(event => {
      if (event.type === 'housing') return; // 住宅は上で処理済み
      const evYear = parseInt(event.date?.slice(0, 4));
      const evAge  = currentAge + (evYear - nowYear);
      if (evAge !== age) return;
      deductAssets(event.amount || 0);
    });

    // 不動産価値
    let propertyValue = 0;
    if (housingParams && housingPurchaseAge !== null && age >= housingPurchaseAge) {
      const yearsOwned = age - housingPurchaseAge;
      propertyValue = calcPropertyValue(
        housingParams.propertyPrice || 0,
        housingParams.landRatio     || 0.2,
        housingParams.depreciationRate || 1,
        yearsOwned,
        housingParams.landAppreciationRate || 0
      );
    }

    const totalAssets = Math.max(0, savings) + Math.max(0, regularInvest) +
                        Math.max(0, nisaInvest) + Math.max(0, dryPowder);
    const netWorth    = totalAssets + propertyValue - loanBalance;

    if (netWorth <= 0 && depletionAge === null && age >= retirementAge) {
      depletionAge = age;
    }

    byAge.push({
      age,
      totalAssets:   Math.round(totalAssets),
      netWorth:      Math.round(netWorth),
      savings:       Math.round(Math.max(0, savings)),
      regularInvest: Math.round(Math.max(0, regularInvest)),
      nisaInvest:    Math.round(Math.max(0, nisaInvest)),
      dryPowder:     Math.round(Math.max(0, dryPowder)),
      propertyValue: Math.round(propertyValue),
      loanBalance:   Math.round(loanBalance),
      isRetired,
    });
  }

  const atRetirement = byAge.find(r => r.age === retirementAge) || byAge[workYears - 1] || byAge[0];
  const atEnd        = byAge[byAge.length - 1];

  return {
    byAge,
    summary: {
      retirementNetWorth: atRetirement?.netWorth ?? 0,
      finalNetWorth:      atEnd?.netWorth ?? 0,
      depletionAge,
      isSafe: depletionAge === null,
    },
  };
}

// ============================================================================
// 家計実績 ↔ シミュレーション連動ユーティリティ
// ============================================================================

/**
 * 直近N ヶ月の平均収支を計算
 * @returns {{ avgIncome, avgExpense, avgSurplus, avgInvestment, months }}
 */
export function calcRecentMonthlyAverages(transactions, recurringTransactions, monthlyHistory, n = 3) {
  const today = new Date();
  const results = [];
  for (let i = 1; i <= n; i++) {
    const d  = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bal = calculateMonthlyBalance(ym, transactions, recurringTransactions);
    const hist = monthlyHistory[ym];
    results.push({
      ym,
      income:     bal.plIncome,
      expense:    bal.plExpense,
      surplus:    bal.plBalance,
      investment: hist?.investAmount ?? 0,
    });
  }
  const closed = results.filter(r => r.income > 0 || r.expense > 0);
  if (closed.length === 0) return null;
  return {
    avgIncome:     Math.round(closed.reduce((s, r) => s + r.income,     0) / closed.length),
    avgExpense:    Math.round(closed.reduce((s, r) => s + r.expense,    0) / closed.length),
    avgSurplus:    Math.round(closed.reduce((s, r) => s + r.surplus,    0) / closed.length),
    avgInvestment: Math.round(closed.reduce((s, r) => s + r.investment, 0) / closed.length),
    months: closed.length,
  };
}

/**
 * 月次の差額（実績 - 計画）が将来資産に与える影響を複利計算
 * 例: 今月 -20,000 円 → 30年後に複利でいくらの差になるか
 */
export function calcFutureImpact(monthlyDiff, yearsRemaining, annualReturnRate = 5) {
  if (monthlyDiff === 0 || yearsRemaining <= 0) return 0;
  const r = annualReturnRate / 100 / 12;
  const n = yearsRemaining * 12;
  // 毎月の差額が複利で積み上がった場合の将来価値
  const fv = r === 0
    ? monthlyDiff * n
    : monthlyDiff * ((Math.pow(1 + r, n) - 1) / r);
  return Math.round(fv);
}

/**
 * 過去実績ベースの収入成長率を推定（monthlyHistoryから）
 */
export function estimateIncomeGrowthRate(transactions, recurringTransactions, monthsBack = 12) {
  const today = new Date();
  const monthly = [];
  for (let i = 1; i <= monthsBack; i++) {
    const d  = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bal = calculateMonthlyBalance(ym, transactions, recurringTransactions);
    if (bal.plIncome > 0) monthly.push({ i, income: bal.plIncome });
  }
  if (monthly.length < 6) return null;
  // 前半・後半の平均で成長率を推定
  const half = Math.floor(monthly.length / 2);
  const older = monthly.slice(half).reduce((s, r) => s + r.income, 0) / (monthly.length - half);
  const newer = monthly.slice(0, half).reduce((s, r) => s + r.income, 0) / half;
  if (older === 0) return null;
  const annualGrowth = (newer / older - 1) * (12 / half) * 100;
  return Math.round(Math.max(-5, Math.min(10, annualGrowth)) * 10) / 10; // -5% 〜 +10% にクリップ
}
