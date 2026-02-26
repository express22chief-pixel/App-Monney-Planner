/**
 * useMoneyData.js
 * アプリの全state管理・副作用・アクション関数をまとめたカスタムフック。
 * UIコンポーネントはこのフックの戻り値を使うだけでよい。
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { load, save, clearAll } from '../utils/storage';
import {
  DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES,
  buildCategories, getSettlementDate, calculateMonthlyBalance,
  getUnclosedMonths, calculateBudgetAnalysis, calculateCategoryExpenses,
  getLast6MonthsTrend, calculateSimulation, runMonteCarloSimulation,
  getRecurringTargetDates, calculateBenchmark
} from '../utils/calc';

// ─── リスクプロファイル定数（UIでも参照するためexport） ─────────────────────
export const RISK_PROFILES = {
  conservative: { label: '保守的', icon: '🛡️', description: '安全性重視', returnRate: 3, monthlyInvestment: 20000, monthlySavings: 50000, useLumpSum: false, volatility: 0.05 },
  standard:     { label: '標準的', icon: '⚖️', description: 'バランス重視', returnRate: 5, monthlyInvestment: 30000, monthlySavings: 30000, useLumpSum: true,  volatility: 0.10 },
  aggressive:   { label: '積極的', icon: '🚀', description: '成長重視',    returnRate: 7, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: true,  volatility: 0.15 }
};

export function useMoneyData() {
  // ─── タブ・UI state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(null);
  const [darkMode, setDarkMode] = useState(() => load('darkMode', true));
  const [showSplash, setShowSplash] = useState(true);
  const [summaryMonthOffset, setSummaryMonthOffset] = useState(0);
  const [recentTxnLimit, setRecentTxnLimit] = useState(5);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('all');
  const [settingsExpanded, setSettingsExpanded] = useState({
    appearance: true, profile: true, budget: false,
    investment: false, category: false, creditcard: false, data: false
  });
  const [expandedCreditGroups, setExpandedCreditGroups] = useState({});

  // ─── モーダル表示 state ──────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!load('userInfo', null));
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPage, setTutorialPage] = useState(0);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAssetEditModal, setShowAssetEditModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupSettlements, setSetupSettlements] = useState([]);
  const [setupSettlementDate, setSetupSettlementDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  });
  const [showDateTransactionsModal, setShowDateTransactionsModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false);
  const [closingTargetMonth, setClosingTargetMonth] = useState(null);
  const [closeMonthData, setCloseMonthData] = useState({ savedAmount: 0, investAmount: 0, dryPowderAmount: 0 });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showLifeEventModal, setShowLifeEventModal] = useState(false);
  const [editingLifeEvent, setEditingLifeEvent] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investForm, setInvestForm] = useState({ fromSource: 'savings', amount: '', targetAccount: 'investments' });
  const [showClosingCheckModal, setShowClosingCheckModal] = useState(null);
  const [showSplitList, setShowSplitList] = useState(false);
  const [showRecurringList, setShowRecurringList] = useState(false);
  const [showCFList, setShowCFList] = useState(false);

  // ─── カテゴリ編集 state ──────────────────────────────────────────────────
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');
  const [editingRecurring, setEditingRecurring] = useState(null);

  // ─── 前日確認モーダル state ─────────────────────────────────────────────
  const [showDailyReview, setShowDailyReview] = useState(false);
  const [dailyReviewTxns, setDailyReviewTxns] = useState([]);
  const [dailyReviewDate, setDailyReviewDate] = useState('');
  const [dailyReviewAddForm, setDailyReviewAddForm] = useState(null);
  const [dismissedClosingAlerts, setDismissedClosingAlerts] = useState(() => load('dismissedClosingAlerts', {}));

  // ─── ドメインデータ state ────────────────────────────────────────────────
  const [userInfo, setUserInfo] = useState(() => load('userInfo', null));

  const [transactions, setTransactions] = useState(() =>
    load('transactions', [
      { id: 1, date: '2026-02-14', category: '食費', amount: -1200, type: 'expense', paymentMethod: 'credit', settled: false },
      { id: 2, date: '2026-02-13', category: '交通費', amount: -500, type: 'expense', paymentMethod: 'cash', settled: true },
      { id: 3, date: '2026-02-10', category: '給料', amount: 250000, type: 'income', settled: true },
    ])
  );

  const [assetData, setAssetData] = useState(() =>
    load('assetData', { savings: 500000, investments: 300000, nisa: 0, dryPowder: 0 })
  );

  const [monthlyHistory, setMonthlyHistory] = useState(() => load('monthlyHistory', {}));
  const [lifeEvents, setLifeEvents] = useState(() => load('lifeEvents', []));

  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    load('monthlyBudget', {
      income: 300000,
      expenses: {
        食費: 40000, 住居費: 80000, 光熱費: 15000, 通信費: 10000, 交通費: 10000,
        娯楽費: 20000, 医療費: 5000, 教育費: 0, 被服費: 10000, その他: 10000
      }
    })
  );

  const [recurringTransactions, setRecurringTransactions] = useState(() => load('recurringTransactions', []));

  const [customCategories, setCustomCategories] = useState(() =>
    load('customCategories', {
      expense: [], income: [],
      deletedDefaults: { expense: [], income: [] },
      renamedDefaults: { expense: {}, income: {} }
    })
  );

  const [newTransaction, setNewTransaction] = useState({
    amount: '', category: '', type: 'expense', paymentMethod: 'credit',
    date: new Date().toISOString().slice(0, 10), memo: '', isSplit: false, splitMembers: [], cardId: null
  });

  const [creditCards, setCreditCards] = useState(() =>
    load('creditCards', [{ id: 1, name: 'メインカード', closingDay: 15, paymentMonth: 1, paymentDay: 10 }])
  );
  const [selectedCardId, setSelectedCardId] = useState(1);
  const [splitPayments, setSplitPayments] = useState(() => load('splitPayments', []));

  const [simulationSettings, setSimulationSettings] = useState(() =>
    load('simulationSettings', {
      targetAmount: 10000000, years: 10, monthlyInvestment: 30000, monthlySavings: 20000,
      savingsInterestRate: 0.2, returnRate: 5, useNisa: true, useLumpSum: true,
      lumpSumAmount: 500000, lumpSumFrequency: 2, lumpSumMonths: [6, 12],
      riskProfile: 'standard', showMonteCarloSimulation: false
    })
  );

  // ─── スプラッシュ ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ─── iOSズーム防止 + グローバルスタイル ─────────────────────────────────
  useEffect(() => {
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.appendChild(vp); }
    vp.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    const styleId = 'ios-zoom-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        input, select, textarea { font-size: 16px !important; }
        @media screen and (-webkit-min-device-pixel-ratio: 0) { select, textarea, input { font-size: 16px !important; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .hover-scale { transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease; }
        .hover-scale:active { transform: scale(0.95); opacity: 0.85; }
        button { -webkit-tap-highlight-color: transparent; transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); }
        button:active { transform: scale(0.96); opacity: 0.82; }
        .glass, .glass-dark { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .transition-all { transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
        .duration-200 { transition-duration: 220ms !important; transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important; }
        .duration-300 { transition-duration: 320ms !important; transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important; }
        .overflow-y-auto { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
        .tabular-nums { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ─── 永続化 useEffect ─────────────────────────────────────────────────────
  useEffect(() => { save('transactions', transactions); }, [transactions]);
  useEffect(() => { save('assetData', assetData); }, [assetData]);
  useEffect(() => { save('monthlyHistory', monthlyHistory); }, [monthlyHistory]);
  useEffect(() => { save('lifeEvents', lifeEvents); }, [lifeEvents]);
  useEffect(() => { if (userInfo) save('userInfo', userInfo); }, [userInfo]);
  useEffect(() => { save('simulationSettings', simulationSettings); }, [simulationSettings]);
  useEffect(() => { save('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { save('monthlyBudget', monthlyBudget); }, [monthlyBudget]);
  useEffect(() => { save('customCategories', customCategories); }, [customCategories]);
  useEffect(() => { save('recurringTransactions', recurringTransactions); }, [recurringTransactions]);
  useEffect(() => { save('creditCards', creditCards); }, [creditCards]);
  useEffect(() => { save('splitPayments', splitPayments); }, [splitPayments]);
  useEffect(() => { save('dismissedClosingAlerts', dismissedClosingAlerts); }, [dismissedClosingAlerts]);

  // ─── 背景スクロール制御 ───────────────────────────────────────────────────
  useEffect(() => {
    const isOpen = showRecurringModal || showCategoryModal || showBudgetModal ||
      showAssetEditModal || showDateTransactionsModal || showBenchmark ||
      showLifeEventModal || showSettings || showOnboarding ||
      showCloseMonthModal || editingTransaction || showInvestModal;
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showRecurringModal, showCategoryModal, showBudgetModal, showAssetEditModal,
    showDateTransactionsModal, showBenchmark, showLifeEventModal, showSettings,
    showOnboarding, showCloseMonthModal, editingTransaction, showInvestModal]);

  // ─── 定期取引 自動生成 ────────────────────────────────────────────────────
  useEffect(() => {
    generateRecurringTransactions();
    updateRecurringSettlementStatus();
  }, [recurringTransactions, transactions]);

  // ─── 前日確認（初回ユーザーには出さない） ────────────────────────────────
  useEffect(() => {
    if (showOnboarding) return;
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr = nowJST.toISOString().slice(0, 10);
    const lastOpen = load('lastOpenDate', null);
    if (!lastOpen) { save('lastOpenDate', todayStr); return; }
    if (lastOpen === todayStr) return;
    save('lastOpenDate', todayStr);
    const yesterdayJST = new Date(nowJST.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayJST.toISOString().slice(0, 10);
    setDailyReviewTxns(transactions.filter(t => t.date === yesterdayStr && !t.isSettlement));
    setDailyReviewDate(yesterdayStr);
    setShowDailyReview(true);
  }, [showOnboarding]);

  // ─── カテゴリ派生データ ───────────────────────────────────────────────────
  const deletedExp = customCategories.deletedDefaults?.expense || [];
  const deletedInc = customCategories.deletedDefaults?.income || [];
  const renamedExp = customCategories.renamedDefaults?.expense || {};
  const renamedInc = customCategories.renamedDefaults?.income || {};
  const expenseCategories = buildCategories(DEFAULT_EXPENSE_CATEGORIES, deletedExp, renamedExp, customCategories.expense, customCategories.orderedDefaults?.expense);
  const incomeCategories  = buildCategories(DEFAULT_INCOME_CATEGORIES,  deletedInc, renamedInc,  customCategories.income,  customCategories.orderedDefaults?.income);

  // ─── 計算派生データ ───────────────────────────────────────────────────────
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentBalance = useMemo(
    () => calculateMonthlyBalance(currentMonth, transactions, recurringTransactions),
    [transactions, currentMonth, recurringTransactions]
  );

  const budgetAnalysis = useMemo(
    () => calculateBudgetAnalysis(currentBalance, monthlyBudget, simulationSettings, transactions, currentMonth),
    [transactions, monthlyBudget, currentMonth, simulationSettings, currentBalance]
  );

  const unclosedMonths = useMemo(
    () => getUnclosedMonths(transactions, monthlyHistory),
    [transactions, monthlyHistory]
  );

  const simulationResults = useMemo(
    () => calculateSimulation(simulationSettings, assetData, lifeEvents),
    [simulationSettings, assetData, lifeEvents]
  );

  const monteCarloResults = useMemo(
    () => simulationSettings.showMonteCarloSimulation ? runMonteCarloSimulation(simulationSettings, assetData, lifeEvents, 100) : [],
    [simulationSettings, assetData, lifeEvents]
  );

  const chartData = useMemo(() => simulationResults.map(r => ({
    年: `${r.year}年`, 貯金: r.savings, 課税口座: r.regularInvestment,
    NISA: r.nisaInvestment, 待機資金: r.dryPowder, 合計: r.totalValue
  })), [simulationResults]);

  const monteCarloChartData = useMemo(() => monteCarloResults.map(r => ({
    年: `${r.year}年`, 平均: r.average, 最小: r.min, 最大: r.max, 範囲下限: r.p25, 範囲上限: r.p75
  })), [monteCarloResults]);

  // ─── アクション関数 ───────────────────────────────────────────────────────

  const resetAllData = () => {
    if (window.confirm('本当に全てのデータを削除しますか？この操作は取り消せません。')) {
      clearAll();
      window.location.reload();
    }
  };

  const applyRiskProfile = useCallback((profile) => {
    const preset = RISK_PROFILES[profile];
    if (!preset) return;
    setSimulationSettings(prev => ({
      ...prev, riskProfile: profile,
      returnRate: preset.returnRate,
      monthlyInvestment: preset.monthlyInvestment,
      monthlySavings: preset.monthlySavings,
      useLumpSum: preset.useLumpSum
    }));
  }, []);

  const generateRecurringTransactions = () => {
    const today = new Date();
    const toLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const cm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    recurringTransactions.forEach(recurring => {
      if (recurring.startDate && cm < recurring.startDate.slice(0, 7)) return;
      if (recurring.endDate && cm > recurring.endDate.slice(0, 7)) return;

      const targetDates = getRecurringTargetDates(recurring, cm);

      targetDates.forEach(targetDate => {
        const exists = transactions.some(t =>
          t.date === targetDate && t.category === recurring.category &&
          Math.abs(t.amount) === recurring.amount && t.recurringId === recurring.id
        );
        if (!exists) {
          const isPast = new Date(targetDate) <= today;
          const isInvestType = recurring.type === 'investment' || recurring.type === 'fund';
          const newTxn = {
            id: Date.now() + Math.random(), date: targetDate, category: recurring.category,
            amount: -recurring.amount, type: 'expense', paymentMethod: recurring.paymentMethod,
            settled: recurring.paymentMethod === 'cash' ? isPast : false,
            isRecurring: true, recurringId: recurring.id, recurringName: recurring.name,
            isInvestment: isInvestType, investTarget: recurring.type === 'fund' ? 'fund' : 'investments'
          };
          const newTxns = [newTxn];
          if (recurring.paymentMethod === 'credit') {
            const cardId = recurring.cardId || (creditCards[0] && creditCards[0].id);
            const card = creditCards.find(c => c.id === cardId) || creditCards[0];
            if (card) {
              const settlementDate = getSettlementDate(targetDate, cardId, creditCards);
              const settlementExists = transactions.some(t => t.isSettlement && t.parentTransactionId === newTxn.id);
              if (!settlementExists && settlementDate) {
                newTxns.push({
                  id: Date.now() + Math.random() + 0.5, date: toLocalDate(settlementDate),
                  category: `クレジット引き落とし（${card.name}）`,
                  amount: -recurring.amount, type: 'expense', paymentMethod: 'cash',
                  settled: settlementDate <= new Date(), isSettlement: true,
                  parentTransactionId: newTxn.id, cardId, isRecurring: true, recurringId: recurring.id
                });
              }
            }
          }
          setTransactions(prev => [...newTxns, ...prev]);
        }
      });
    });
  };

  const updateRecurringSettlementStatus = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setTransactions(prev => prev.map(t => {
      if (t.isRecurring && !t.settled && t.paymentMethod === 'cash' && t.date <= todayStr) return { ...t, settled: true };
      if (t.isSettlement && !t.settled && t.date <= todayStr) return { ...t, settled: true };
      return t;
    }));
  };

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;
    const amount = newTransaction.type === 'expense'
      ? -Math.abs(Number(newTransaction.amount))
      : Math.abs(Number(newTransaction.amount));
    const validMembers = (newTransaction.isSplit ? newTransaction.splitMembers : [])
      .filter(m => m.name.trim() && Number(m.amount) > 0);
    const splitTotalAmt = validMembers.reduce((sum, m) => sum + Number(m.amount), 0);
    const transaction = {
      id: Date.now(), date: newTransaction.date, category: newTransaction.category,
      memo: newTransaction.memo || '', amount, type: newTransaction.type,
      paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
      settled: newTransaction.type === 'income' ? true : (newTransaction.paymentMethod === 'cash'),
      isSettlement: false,
      cardId: newTransaction.paymentMethod === 'credit' ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) : undefined,
      isSplit: validMembers.length > 0, splitAmount: splitTotalAmt, splitMembers: validMembers
    };
    if (newTransaction.type === 'expense' && newTransaction.paymentMethod === 'credit') {
      const resolvedCardId = newTransaction.cardId ? String(newTransaction.cardId) : (creditCards[0] ? String(creditCards[0].id) : null);
      const settlementDate = getSettlementDate(newTransaction.date, resolvedCardId, creditCards);
      const card = creditCards.find(c => String(c.id) === String(resolvedCardId));
      const settlementTransaction = {
        id: Date.now() + 1,
        date: `${settlementDate.getFullYear()}-${String(settlementDate.getMonth() + 1).padStart(2, '0')}-${String(settlementDate.getDate()).padStart(2, '0')}`,
        category: 'クレジット引き落とし' + (card ? `（${card.name}）` : ''),
        amount, type: 'expense', paymentMethod: 'cash',
        settled: settlementDate <= new Date(), isSettlement: true,
        parentTransactionId: transaction.id, cardId: resolvedCardId
      };
      setTransactions([transaction, settlementTransaction, ...transactions]);
    } else {
      setTransactions([transaction, ...transactions]);
    }
    if (validMembers.length > 0) {
      setSplitPayments(prev => [...prev, ...validMembers.map((m, i) => ({
        id: Date.now() + 2 + i, date: newTransaction.date, person: m.name.trim(),
        amount: Number(m.amount), category: newTransaction.category,
        memo: newTransaction.memo || '', transactionId: transaction.id, settled: false
      }))]);
    }
    setNewTransaction({ amount: '', category: '', type: 'expense', paymentMethod: 'credit', date: new Date().toISOString().slice(0, 10), memo: '', isSplit: false, splitMembers: [], cardId: null });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id && t.parentTransactionId !== id));
    setSplitPayments(prev => prev.filter(s => s.transactionId !== id));
  };

  const updateTransaction = (updatedTransaction) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === updatedTransaction.id) return updatedTransaction;
      if (t.isSettlement && t.parentTransactionId === updatedTransaction.id) {
        const newSettlementDate = getSettlementDate(updatedTransaction.date, updatedTransaction.cardId, creditCards);
        const card = creditCards.find(c => String(c.id) === String(updatedTransaction.cardId));
        return {
          ...t, amount: updatedTransaction.amount,
          date: `${newSettlementDate.getFullYear()}-${String(newSettlementDate.getMonth() + 1).padStart(2, '0')}-${String(newSettlementDate.getDate()).padStart(2, '0')}`,
          category: 'クレジット引き落とし' + (card ? `（${card.name}）` : ''),
          settled: newSettlementDate <= new Date(), cardId: updatedTransaction.cardId
        };
      }
      return t;
    }));
    setEditingTransaction(null);
  };

  const openCloseMonthModal = (targetMonth) => {
    const tMonth = targetMonth || currentMonth;
    const tBalance = calculateMonthlyBalance(tMonth, transactions, recurringTransactions);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const plannedTotal = simulationSettings.monthlyInvestment + simulationSettings.monthlySavings;
    setClosingTargetMonth(tMonth);
    setCloseMonthData(cfBalance >= plannedTotal
      ? { savedAmount: cfBalance - simulationSettings.monthlyInvestment, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
      : { savedAmount: 0, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
    );
    setShowCloseMonthModal(true);
  };

  const closeMonth = (targetMonth) => {
    const tMonth = targetMonth || currentMonth;
    const tBalance = calculateMonthlyBalance(tMonth, transactions, recurringTransactions);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const plannedInvestment = simulationSettings.monthlyInvestment;
    const totalPlanned = plannedInvestment + simulationSettings.monthlySavings;
    let actualInvest = isNaN(closeMonthData.investAmount) ? 0 : closeMonthData.investAmount;
    let actualDryPowder = isNaN(closeMonthData.dryPowderAmount) ? 0 : closeMonthData.dryPowderAmount;
    let actualSavings = isNaN(closeMonthData.savedAmount) ? 0 : closeMonthData.savedAmount;
    let withdrawalFromSavings = 0;
    if (cfBalance < totalPlanned) {
      withdrawalFromSavings = totalPlanned - cfBalance;
      actualInvest = plannedInvestment;
      actualSavings = cfBalance - actualDryPowder;
    }
    const recurringInvestIds = new Set(
      recurringTransactions.filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance').map(r => r.id)
    );
    const settledInvestments = transactions.filter(t =>
      t.date.startsWith(tMonth) && t.settled && t.recurringId && recurringInvestIds.has(t.recurringId)
    );
    const autoInvestAmount = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r && r.type === 'investment'; }).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const autoFundAmount   = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r && r.type === 'fund'; }).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const autoInsuranceAmount = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r && r.type === 'insurance'; }).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    setAssetData(prev => {
      const s = (v) => isNaN(Number(v)) ? 0 : Number(v);
      return {
        savings: s(prev.savings) + actualSavings - withdrawalFromSavings + autoInsuranceAmount,
        investments: s(prev.investments) + actualInvest + autoInvestAmount,
        dryPowder: s(prev.dryPowder) + actualDryPowder,
        nisa: s(prev.nisa) + autoFundAmount
      };
    });
    setMonthlyHistory(prev => ({
      ...prev, [tMonth]: {
        plBalance: tBalance.plBalance, cfBalance,
        savedAmount: actualSavings, investAmount: actualInvest,
        dryPowderAmount: actualDryPowder, withdrawalFromSavings
      }
    }));
    setShowCloseMonthModal(false);
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) { alert('カテゴリ名を入力してください'); return; }
    const existing = newCategoryType === 'expense' ? expenseCategories : incomeCategories;
    if (existing.includes(newCategoryName.trim())) { alert('このカテゴリは既に存在します'); return; }
    setCustomCategories(prev => ({ ...prev, [newCategoryType]: [...prev[newCategoryType], newCategoryName.trim()] }));
    if (newCategoryType === 'expense') {
      setMonthlyBudget(prev => ({ ...prev, expenses: { ...prev.expenses, [newCategoryName.trim()]: 0 } }));
    }
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const deleteCustomCategory = (category, type) => {
    if (!confirm(`「${category}」を削除しますか？`)) return;
    setCustomCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== category) }));
    if (type === 'expense' && monthlyBudget.expenses[category] !== undefined) {
      setMonthlyBudget(prev => { const e = { ...prev.expenses }; delete e[category]; return { ...prev, expenses: e }; });
    }
  };

  const handleRenameDefaultCategory = (origName, newName, type) => {
    if (!newName.trim() || newName === origName) return;
    setCustomCategories(prev => ({ ...prev, renamedDefaults: { ...prev.renamedDefaults, [type]: { ...(prev.renamedDefaults?.[type] || {}), [origName]: newName.trim() } } }));
  };

  const handleDeleteDefaultCategory = (origName, type) => {
    setCustomCategories(prev => ({ ...prev, deletedDefaults: { ...prev.deletedDefaults, [type]: [...(prev.deletedDefaults?.[type] || []), origName] } }));
  };

  const addOrUpdateRecurring = (data) => {
    if (editingRecurring?.id) {
      setRecurringTransactions(recurringTransactions.map(r => r.id === editingRecurring.id ? { ...data, id: r.id } : r));
    } else {
      setRecurringTransactions([...recurringTransactions, { ...data, id: Date.now() }]);
    }
    setShowRecurringModal(false);
    setEditingRecurring(null);
  };

  const deleteRecurring = (id) => {
    if (!confirm('この定期支払いを削除しますか？')) return;
    setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
  };

  const executeInvestment = () => {
    const amount = Number(investForm.amount);
    if (!amount || amount <= 0) { alert('金額を入力してください'); return; }
    const s = (v) => isNaN(v) ? 0 : v;
    const sourceBalance = investForm.fromSource === 'savings' ? s(assetData.savings) : s(assetData.dryPowder || 0);
    if (amount > sourceBalance) { alert('残高が不足しています'); return; }
    setAssetData(prev => {
      const nd = { ...prev };
      if (investForm.fromSource === 'savings') nd.savings = s(prev.savings) - amount;
      else nd.dryPowder = s(prev.dryPowder || 0) - amount;
      if (investForm.targetAccount === 'investments') nd.investments = s(prev.investments) + amount;
      else if (investForm.targetAccount === 'nisa') nd.nisa = s(prev.nisa || 0) + amount;
      else nd.dryPowder = s(prev.dryPowder || 0) + amount;
      return nd;
    });
    setInvestForm({ fromSource: 'savings', amount: '', targetAccount: 'investments' });
    setShowInvestModal(false);
  };

  const addOrUpdateLifeEvent = (eventData) => {
    if (editingLifeEvent?.id) {
      setLifeEvents(lifeEvents.map(e => e.id === editingLifeEvent.id ? { ...eventData, id: e.id } : e));
    } else {
      setLifeEvents([...lifeEvents, { ...eventData, id: Date.now() }]);
    }
    setShowLifeEventModal(false);
    setEditingLifeEvent(null);
  };

  const deleteLifeEvent = (id) => setLifeEvents(lifeEvents.filter(e => e.id !== id));

  // ─── 返却値 ─────────────────────────────────────────────────────────────
  return {
    // UI state
    activeTab, setActiveTab,
    selectedMonth, setSelectedMonth,
    selectedDate, setSelectedDate,
    darkMode, setDarkMode,
    showSplash,
    summaryMonthOffset, setSummaryMonthOffset,
    recentTxnLimit, setRecentTxnLimit,
    historySearch, setHistorySearch,
    historyCategory, setHistoryCategory,
    settingsExpanded, setSettingsExpanded,
    expandedCreditGroups, setExpandedCreditGroups,
    // モーダル
    showSettings, setShowSettings,
    showOnboarding, setShowOnboarding,
    showTutorial, setShowTutorial,
    tutorialPage, setTutorialPage,
    showBenchmark, setShowBenchmark,
    showBudgetModal, setShowBudgetModal,
    showCategoryModal, setShowCategoryModal,
    showRecurringModal, setShowRecurringModal,
    showAssetEditModal, setShowAssetEditModal,
    showCardModal, setShowCardModal,
    editingCard, setEditingCard,
    showSetupWizard, setShowSetupWizard,
    setupStep, setSetupStep,
    setupSettlements, setSetupSettlements,
    setupSettlementDate, setSetupSettlementDate,
    showDateTransactionsModal, setShowDateTransactionsModal,
    showAddTransaction, setShowAddTransaction,
    showCloseMonthModal, setShowCloseMonthModal,
    closingTargetMonth,
    closeMonthData, setCloseMonthData,
    editingTransaction, setEditingTransaction,
    showLifeEventModal, setShowLifeEventModal,
    editingLifeEvent, setEditingLifeEvent,
    showInvestModal, setShowInvestModal,
    investForm, setInvestForm,
    showClosingCheckModal, setShowClosingCheckModal,
    showSplitList, setShowSplitList,
    showRecurringList, setShowRecurringList,
    showCFList, setShowCFList,
    dismissedClosingAlerts, setDismissedClosingAlerts,
    // 前日確認
    showDailyReview, setShowDailyReview,
    dailyReviewTxns, setDailyReviewTxns,
    dailyReviewDate,
    dailyReviewAddForm, setDailyReviewAddForm,
    // カテゴリ
    editingCategoryName, setEditingCategoryName,
    editingCategoryValue, setEditingCategoryValue,
    newCategoryName, setNewCategoryName,
    newCategoryType, setNewCategoryType,
    editingRecurring, setEditingRecurring,
    // ドメインデータ
    userInfo, setUserInfo,
    transactions, setTransactions,
    assetData, setAssetData,
    monthlyHistory, setMonthlyHistory,
    lifeEvents, setLifeEvents,
    monthlyBudget, setMonthlyBudget,
    recurringTransactions, setRecurringTransactions,
    customCategories, setCustomCategories,
    newTransaction, setNewTransaction,
    creditCards, setCreditCards,
    selectedCardId, setSelectedCardId,
    splitPayments, setSplitPayments,
    simulationSettings, setSimulationSettings,
    // 派生データ
    expenseCategories, incomeCategories,
    currentMonth, currentBalance, budgetAnalysis, unclosedMonths,
    simulationResults, monteCarloResults, chartData, monteCarloChartData,
    // アクション
    resetAllData,
    applyRiskProfile,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    openCloseMonthModal,
    closeMonth,
    addCustomCategory,
    deleteCustomCategory,
    handleRenameDefaultCategory,
    handleDeleteDefaultCategory,
    addOrUpdateRecurring,
    deleteRecurring,
    executeInvestment,
    addOrUpdateLifeEvent,
    deleteLifeEvent,
    // calc関数（UIから直接呼ぶ場合用）
    getSettlementDate: (txDate, cardId) => getSettlementDate(txDate, cardId, creditCards),
    calculateMonthlyBalance: (ym) => calculateMonthlyBalance(ym, transactions, recurringTransactions),
    calculateCategoryExpenses: () => calculateCategoryExpenses(transactions, currentMonth, recurringTransactions),
    getLast6MonthsTrend: () => getLast6MonthsTrend(transactions, recurringTransactions),
    calculateBenchmark: (age) => calculateBenchmark(assetData, age),
  };
}
