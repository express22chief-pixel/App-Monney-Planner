/**
 * hooks/useMoneyData.js
 * アプリの全state管理・アクション関数をまとめたカスタムフック。
 *
 * 【副作用の分類】
 * ① 永続化 → usePersistence フックに完全委譲（このファイルには書かない）
 * ② システム初期化（スプラッシュ・前日確認）→ useEffect #A
 * ③ UI副作用（背景スクロール制御・定期取引自動生成）→ useEffect #B
 *
 * 【依存関係】
 * - ストレージ: services/storage.js（load のみ使用。save は usePersistence 経由）
 * - 計算: utils/calc.js
 * - 定数: constants/index.js
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { load, clearAll } from '../services/storage';
import { usePersistence } from './usePersistence';
import {
  DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES,
  buildCategories, getSettlementDate, calculateMonthlyBalance,
  getUnclosedMonths, calculateBudgetAnalysis, calculateCategoryExpenses,
  getLast6MonthsTrend, calculateSimulation, runMonteCarloSimulation,
  getRecurringTargetDates, calculateBenchmark, calculateHousingComparison,
  calculateLifePlanSimulation,
  calcRecentMonthlyAverages,
  calcFutureImpact,
  estimateIncomeGrowthRate,
} from '../utils/calc';
// --- リスクプロファイル定数（UIでも参照するためexport） ---------------------
export const RISK_PROFILES = {
  conservative: { label: '保守的', icon: '🛡️', description: '安全性重視',  returnRate: 3, monthlyInvestment: 20000, monthlySavings: 50000, useLumpSum: false, volatility: 0.05 },
  standard:     { label: '標準的', icon: '⚖️', description: 'バランス重視', returnRate: 5, monthlyInvestment: 30000, monthlySavings: 30000, useLumpSum: true,  volatility: 0.10 },
  aggressive:   { label: '積極的', icon: '🚀', description: '成長重視',    returnRate: 7, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: true,  volatility: 0.15 },
};

export function useMoneyData() {

  // ----------------------------------------------------------------------------
  // STATE: UI
  // ----------------------------------------------------------------------------
  const [activeTab, setActiveTab]                         = useState('home');
  const [selectedMonth, setSelectedMonth]                 = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate]                   = useState(null);
  const [darkMode, setDarkMode]                           = useState(() => load('darkMode', true));
  const [showSplash, setShowSplash]                       = useState(true);
  const [summaryMonthOffset, setSummaryMonthOffset]       = useState(0);
  const [recentTxnLimit, setRecentTxnLimit]               = useState(3);
  const [historySearch, setHistorySearch]                 = useState('');
  const [historyCategory, setHistoryCategory]             = useState('all');
  const [settingsExpanded, setSettingsExpanded]           = useState({
    appearance: true, profile: true, budget: false,
    investment: false, category: false, creditcard: false, data: false,
  });
  const [expandedCreditGroups, setExpandedCreditGroups]   = useState({});

  // ----------------------------------------------------------------------------
  // STATE: モーダル表示フラグ
  // ----------------------------------------------------------------------------
  const [showSettings, setShowSettings]                   = useState(false);
  const [showOnboarding, setShowOnboarding]               = useState(() => !load('userInfo', null));
  const [showTutorial, setShowTutorial]                   = useState(false);
  const [tutorialPage, setTutorialPage]                   = useState(0);
  const [showBenchmark, setShowBenchmark]                 = useState(false);
  const [showBudgetModal, setShowBudgetModal]             = useState(false);
  const [showCategoryModal, setShowCategoryModal]         = useState(false);
  const [showRecurringModal, setShowRecurringModal]       = useState(false);
  const [showAssetEditModal, setShowAssetEditModal]       = useState(false);
  const [showCardModal, setShowCardModal]                 = useState(false);
  const [editingCard, setEditingCard]                     = useState(null);
  const [showSetupWizard, setShowSetupWizard]             = useState(false);
  const [setupStep, setSetupStep]                         = useState(1);
  const [setupSettlements, setSetupSettlements]           = useState([]);
  const [setupSettlementDate, setSetupSettlementDate]     = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  });
  const [showDateTransactionsModal, setShowDateTransactionsModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction]       = useState(false);
  const [showCloseMonthModal, setShowCloseMonthModal]     = useState(false);
  const [closingTargetMonth, setClosingTargetMonth]       = useState(null);
  const [closeMonthData, setCloseMonthData]               = useState({ savedAmount: 0, investAmount: 0, dryPowderAmount: 0 });
  const [editingTransaction, setEditingTransaction]       = useState(null);
  const [showLifeEventModal, setShowLifeEventModal]       = useState(false);
  const [editingLifeEvent, setEditingLifeEvent]           = useState(null);
  const [showInvestModal, setShowInvestModal]             = useState(false);
  const [investForm, setInvestForm]                       = useState({ fromSource: 'savings', amount: '', targetAccount: 'investments' });
  const [showClosingCheckModal, setShowClosingCheckModal] = useState(null);
  const [showSplitList, setShowSplitList]                 = useState(false);
  const [showRecurringList, setShowRecurringList]         = useState(false);
  const [showCFList, setShowCFList]                       = useState(false);
  const [showPayPayImport, setShowPayPayImport]           = useState(false);

  // ----------------------------------------------------------------------------
  // STATE: カテゴリ編集
  // ----------------------------------------------------------------------------
  const [editingCategoryName, setEditingCategoryName]     = useState(null);
  const [editingCategoryValue, setEditingCategoryValue]   = useState('');
  const [newCategoryName, setNewCategoryName]             = useState('');
  const [newCategoryType, setNewCategoryType]             = useState('expense');
  const [editingRecurring, setEditingRecurring]           = useState(null);

  // ----------------------------------------------------------------------------
  // STATE: 前日確認モーダル
  // ----------------------------------------------------------------------------
  const [showDailyReview, setShowDailyReview]             = useState(false);
  const [dailyReviewTxns, setDailyReviewTxns]             = useState([]);
  const [dailyReviewDate, setDailyReviewDate]             = useState('');
  const [dailyReviewAddForm, setDailyReviewAddForm]       = useState(null);
  const [dismissedClosingAlerts, setDismissedClosingAlerts] = useState(() => load('dismissedClosingAlerts', {}));

  // ----------------------------------------------------------------------------
  // STATE: ドメインデータ（永続化対象）
  // ----------------------------------------------------------------------------
  const [userInfo, setUserInfo] = useState(() => load('userInfo', null));

  const [transactions, setTransactions] = useState(() =>
    load('transactions', [
      { id: 1, date: '2026-02-14', category: '食費',  amount: -1200,  type: 'expense', paymentMethod: 'credit', settled: false },
      { id: 2, date: '2026-02-13', category: '交通費', amount: -500,   type: 'expense', paymentMethod: 'cash',   settled: true  },
      { id: 3, date: '2026-02-10', category: '給料',   amount: 250000, type: 'income',  settled: true            },
    ])
  );

  const [assetData, setAssetData] = useState(() =>
    load('assetData', { savings: 500000, investments: 300000, nisa: 0, dryPowder: 0 })
  );

  const [monthlyHistory, setMonthlyHistory]     = useState(() => load('monthlyHistory', {}));
  const [lifeEvents, setLifeEvents]             = useState(() => load('lifeEvents', []));
  const [housingParams, setHousingParams]       = useState(() => load('housingParams', null));
  const [showHousingModal, setShowHousingModal] = useState(false);

  const [lifePlan, setLifePlan] = useState(() => load('lifePlan', {
    retirementAge:           65,
    lifeExpectancy:          90,
    annualIncome:            6000000,
    incomeGrowthRate:        1,
    monthlyExpense:          200000,
    retirementMonthlyIncome:  150000,
    retirementMonthlyExpense: 200000,
  }));

  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    load('monthlyBudget', {
      income: 300000,
      expenses: {
        食費: 40000, 住居費: 80000, 光熱費: 15000, 通信費: 10000, 交通費: 10000,
        娯楽費: 20000, 医療費: 5000, 教育費: 0, 被服費: 10000, その他: 10000,
      },
    })
  );

  const [recurringTransactions, setRecurringTransactions] = useState(() => load('recurringTransactions', []));

  const [customCategories, setCustomCategories] = useState(() =>
    load('customCategories', {
      expense: [], income: [],
      deletedDefaults:  { expense: [], income: [] },
      renamedDefaults:  { expense: {}, income: {}  },
    })
  );

  const [newTransaction, setNewTransaction] = useState({
    amount: '', category: '', type: 'expense', paymentMethod: 'credit',
    date: new Date().toISOString().slice(0, 10),
    memo: '', isSplit: false, splitMembers: [], cardId: null, walletId: null, chargeTarget: null,
  });

  const [creditCards, setCreditCards] = useState(() =>
    load('creditCards', [{ id: 1, name: 'メインカード', closingDay: 15, paymentMonth: 1, paymentDay: 10 }])
  );
  const [selectedCardId, setSelectedCardId]   = useState(1);
  const [splitPayments, setSplitPayments]     = useState(() => load('splitPayments', []));
  const [wallets, setWallets]                 = useState(() => load('wallets', [
    { id: 1, name: 'PayPay残高', icon: '🔴', color: '#FF4B4B' },
    { id: 2, name: 'Suica',     icon: '🚃', color: '#00A855' },
    { id: 3, name: 'PASMO',     icon: '🟣', color: '#6C3BA5' },
  ]));
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editingWallet, setEditingWallet]     = useState(null);
  const [transactionTemplates, setTransactionTemplates] = useState(() => load('transactionTemplates', []));
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [simulationSettings, setSimulationSettings] = useState(() =>
    load('simulationSettings', {
      targetAmount: 10000000, years: 10, monthlyInvestment: 30000, monthlySavings: 20000,
      savingsInterestRate: 0.2, returnRate: 5, useNisa: true, useLumpSum: true,
      lumpSumAmount: 500000, lumpSumFrequency: 2, lumpSumMonths: [6, 12],
      riskProfile: 'standard', showMonteCarloSimulation: false,
      inflationRate: 0, incomeGrowthRate: 0,
      // 取り崩しフェーズ
      useWithdrawal: false, withdrawalMonthly: 150000, withdrawalReturnRate: 3,
      withdrawalInflationRate: 2, withdrawalYears: 30,
    })
  );

  // -- ウォレット残高調整（初期残高・手動修正） --------------------------------
  const [walletAdjustments, setWalletAdjustments] = useState(() => load('walletAdjustments', {}));

  // -- ウォレット残高計算 -----------------------------------------------------
  // 残高 = チャージ額 - 電子マネー支払い額（取引履歴から動的に算出）
  const walletBalances = useMemo(() => {
    const balances = {};
    (wallets || []).forEach(w => {
      // 調整額（初期残高含む）をベースにする
      balances[String(w.id)] = Number(walletAdjustments[String(w.id)] || 0);
    });
    transactions.forEach(t => {
      const wid = t.walletId ? String(t.walletId) : null;
      if (!wid) return;
      if (t.isTransfer && !t.isSettlement) {
        balances[wid] = (balances[wid] || 0) + Math.abs(t.amount);
      } else if (t.paymentMethod === 'wallet' && !t.isSettlement) {
        balances[wid] = (balances[wid] || 0) - Math.abs(t.amount);
      }
    });
    return balances;
  }, [transactions, wallets, walletAdjustments]);

  // ----------------------------------------------------------------------------
  // 副作用 ① 永続化 → usePersistence に完全委譲
  // ----------------------------------------------------------------------------
  usePersistence({
    transactions, assetData, monthlyHistory, lifeEvents, userInfo,
    simulationSettings, darkMode, monthlyBudget, customCategories,
    recurringTransactions, creditCards, splitPayments, dismissedClosingAlerts, transactionTemplates,
    walletAdjustments, wallets, housingParams, lifePlan,
  });

  // ----------------------------------------------------------------------------
  // 副作用 ② システム初期化（スプラッシュ / 前日確認）
  // ----------------------------------------------------------------------------

  // スプラッシュ非表示タイマー
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 前日確認ダイアログ（初回ユーザーには出さない）
  useEffect(() => {
    if (showOnboarding) return;
    const nowJST      = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr    = nowJST.toISOString().slice(0, 10);
    const lastOpen    = load('lastOpenDate', null);
    if (!lastOpen) {
      import('../services/storage').then(({ save }) => save('lastOpenDate', todayStr));
      return;
    }
    if (lastOpen === todayStr) return;
    import('../services/storage').then(({ save }) => save('lastOpenDate', todayStr));
    const yesterdayJST = new Date(nowJST.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayJST.toISOString().slice(0, 10);
    setDailyReviewTxns(transactions.filter(t => t.date === yesterdayStr && !t.isSettlement));
    setDailyReviewDate(yesterdayStr);
    setShowDailyReview(true);
  }, [showOnboarding]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------------------
  // 副作用 ③ UI副作用（背景スクロール制御 / 定期取引自動生成）
  // ----------------------------------------------------------------------------

  // モーダル表示中は背景スクロールを無効化
  useEffect(() => {
    const isAnyModalOpen =
      showRecurringModal || showCategoryModal || showBudgetModal ||
      showAssetEditModal || showDateTransactionsModal || showBenchmark ||
      showLifeEventModal || showSettings || showOnboarding ||
      showCloseMonthModal || !!editingTransaction || showInvestModal;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [
    showRecurringModal, showCategoryModal, showBudgetModal, showAssetEditModal,
    showDateTransactionsModal, showBenchmark, showLifeEventModal, showSettings,
    showOnboarding, showCloseMonthModal, editingTransaction, showInvestModal,
  ]);

  // 定期取引の自動生成・入金済みステータス更新
  useEffect(() => {
    generateRecurringTransactions();
    updateRecurringSettlementStatus();
  }, [recurringTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------------------
  // 派生データ（カテゴリ）
  // ----------------------------------------------------------------------------
  const deletedExp  = customCategories.deletedDefaults?.expense || [];
  const deletedInc  = customCategories.deletedDefaults?.income  || [];
  const renamedExp  = customCategories.renamedDefaults?.expense || {};
  const renamedInc  = customCategories.renamedDefaults?.income  || {};
  const expenseCategories = buildCategories(DEFAULT_EXPENSE_CATEGORIES, deletedExp, renamedExp, customCategories.expense, customCategories.orderedDefaults?.expense);
  const incomeCategories  = buildCategories(DEFAULT_INCOME_CATEGORIES,  deletedInc, renamedInc,  customCategories.income,  customCategories.orderedDefaults?.income);

  // ----------------------------------------------------------------------------
  // 派生データ（計算値）
  // ----------------------------------------------------------------------------
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

  // 複数シナリオ比較（現状 / 積立+1万 / 積立+3万）
  const scenarioResults = useMemo(() => {
    const base = simulationSettings.monthlyInvestment;
    return [
      { label: '現状', color: '#3b82f6', results: calculateSimulation(simulationSettings, assetData, lifeEvents) },
      { label: `+¥10,000`, color: '#10b981', results: calculateSimulation({ ...simulationSettings, monthlyInvestment: base + 10000 }, assetData, lifeEvents) },
      { label: `+¥30,000`, color: '#f59e0b', results: calculateSimulation({ ...simulationSettings, monthlyInvestment: base + 30000 }, assetData, lifeEvents) },
    ];
  }, [simulationSettings, assetData, lifeEvents]);

  const housingComparison = useMemo(() => {
    if (!housingParams) return null;
    return calculateHousingComparison(housingParams, {
      returnRate:      simulationSettings.returnRate,
      incomeGrowthRate: simulationSettings.incomeGrowthRate ?? 0,
      monthlyIncome:   currentBalance?.plIncome ?? 0,
      assetData,
    });
  }, [housingParams, simulationSettings.returnRate, assetData]);

  const lifePlanSimulation = useMemo(() => {
    const currentAge = userInfo?.age ? Number(userInfo.age) : 30;
    return calculateLifePlanSimulation(
      { ...lifePlan, currentAge },
      simulationSettings,
      assetData,
      lifeEvents,
      housingParams,
    );
  }, [lifePlan, simulationSettings, assetData, lifeEvents, housingParams, userInfo]);

  // 直近3ヶ月の実績平均
  const recentMonthlyAverages = useMemo(
    () => calcRecentMonthlyAverages(transactions, recurringTransactions, monthlyHistory, 3),
    [transactions, recurringTransactions, monthlyHistory]
  );

  // 実績から推定した収入成長率
  const incomeGrowthEstimate = useMemo(
    () => estimateIncomeGrowthRate(transactions, recurringTransactions, 12),
    [transactions, recurringTransactions]
  );

  // 今月の実績 vs 計画のズレ → 将来影響
  const monthlyGapImpact = useMemo(() => {
    const currentAge = userInfo?.age ? Number(userInfo.age) : 30;
    const yearsRemaining = (lifePlan.retirementAge ?? 65) - currentAge;
    if (yearsRemaining <= 0) return null;
    const plannedSurplus = (budgetAnalysis?.surplus?.planned ?? 0);
    const actualSurplus  = (budgetAnalysis?.surplus?.actual  ?? 0);
    const diff = actualSurplus - plannedSurplus;
    if (diff === 0) return null;
    const impact = calcFutureImpact(diff, yearsRemaining, simulationSettings.returnRate);
    return { diff, impact, yearsRemaining };
  }, [budgetAnalysis, lifePlan, userInfo, simulationSettings.returnRate]);

  const monteCarloResults = useMemo(
    () => simulationSettings.showMonteCarloSimulation
      ? runMonteCarloSimulation(simulationSettings, assetData, lifeEvents, 100)
      : [],
    [simulationSettings, assetData, lifeEvents]
  );

  const chartData = useMemo(() =>
    simulationResults.map(r => ({
      年: `${r.year}年`, 貯金: r.savings, 課税口座: r.regularInvestment,
      NISA: r.nisaInvestment, 待機資金: r.dryPowder, 合計: r.totalValue,
      実質価値: r.realValue,
    })),
    [simulationResults]
  );

  const monteCarloChartData = useMemo(() =>
    monteCarloResults.map(r => ({
      年: `${r.year}年`, 平均: r.average, 最小: r.min, 最大: r.max,
      範囲下限: r.p25, 範囲上限: r.p75,
    })),
    [monteCarloResults]
  );

  // ----------------------------------------------------------------------------
  // アクション関数
  // ----------------------------------------------------------------------------

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
      returnRate:        preset.returnRate,
      monthlyInvestment: preset.monthlyInvestment,
      monthlySavings:    preset.monthlySavings,
      useLumpSum:        preset.useLumpSum,
    }));
  }, []);

  const generateRecurringTransactions = () => {
    const today       = new Date();
    const toLocalDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const cm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    recurringTransactions.forEach(recurring => {
      if (recurring.startDate && cm < recurring.startDate.slice(0, 7)) return;
      if (recurring.endDate   && cm > recurring.endDate.slice(0, 7))   return;

      getRecurringTargetDates(recurring, cm).forEach(targetDate => {
        const exists = transactions.some(t =>
          t.date === targetDate && t.category === recurring.category &&
          Math.abs(t.amount) === recurring.amount && t.recurringId === recurring.id
        );
        if (!exists) {
          const isPast       = new Date(targetDate) <= today;
          const isInvestType = recurring.type === 'investment' || recurring.type === 'fund';
          const newTxn = {
            id: Date.now() + Math.random(),
            date: targetDate, category: recurring.category,
            amount: -recurring.amount, type: 'expense',
            paymentMethod: recurring.paymentMethod,
            settled: recurring.paymentMethod === 'cash' ? isPast : false,
            isRecurring: true, recurringId: recurring.id, recurringName: recurring.name,
            isInvestment: isInvestType,
            investTarget: recurring.type === 'fund' ? 'fund' : 'investments',
          };
          const newTxns = [newTxn];
          if (recurring.paymentMethod === 'credit') {
            const cardId         = recurring.cardId || (creditCards[0] && creditCards[0].id);
            const card           = creditCards.find(c => c.id === cardId) || creditCards[0];
            const settlementDate = card ? getSettlementDate(targetDate, cardId, creditCards) : null;
            if (settlementDate) {
              const settlementExists = transactions.some(t => t.isSettlement && t.parentTransactionId === newTxn.id);
              if (!settlementExists) {
                newTxns.push({
                  id: Date.now() + Math.random() + 0.5,
                  date: toLocalDate(settlementDate),
                  category: `クレジット引き落とし（${card.name}）`,
                  amount: -recurring.amount, type: 'expense', paymentMethod: 'cash',
                  settled: settlementDate <= new Date(), isSettlement: true,
                  parentTransactionId: newTxn.id, cardId, isRecurring: true, recurringId: recurring.id,
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
    const isCharge = newTransaction.type === 'charge';
    // チャージはcategoryが不要、chargeTargetが必須
    if (!newTransaction.amount) return;
    if (!isCharge && !newTransaction.category) return;

    // 電子マネー支払い時の残高チェック
    if (newTransaction.paymentMethod === 'wallet' && newTransaction.walletId) {
      const wid = String(newTransaction.walletId);
      const currentBal = walletBalances[wid] ?? 0;
      const payAmount = Math.abs(Number(newTransaction.amount));
      if (currentBal < payAmount) {
        const w = wallets.find(w => String(w.id) === wid);
        if (!window.confirm(`${w?.name || '電子マネー'}の残高（¥${currentBal.toLocaleString()}）が不足しています。\n支払額: ¥${payAmount.toLocaleString()}\n\nこのまま記録しますか？`)) return;
      }
    }
    if (isCharge && !newTransaction.chargeTarget) return;

    const amount = newTransaction.type === 'expense' || isCharge
      ? -Math.abs(Number(newTransaction.amount))
      :  Math.abs(Number(newTransaction.amount));
    const validMembers  = (newTransaction.isSplit ? newTransaction.splitMembers : [])
      .filter(m => m.name.trim() && Number(m.amount) > 0);
    const splitTotalAmt = validMembers.reduce((sum, m) => sum + Number(m.amount), 0);

    // チャージの場合: 「資金移動」としてカテゴリを自動設定
    const targetWallet = isCharge ? wallets.find(w => w.id === newTransaction.chargeTarget) : null;
    const chargeCategory = isCharge
      ? `${targetWallet?.icon || '📲'} ${targetWallet?.name || 'ウォレット'}チャージ`
      : newTransaction.category;

    const transaction   = {
      id: Date.now(), date: newTransaction.date,
      category: chargeCategory,
      memo: newTransaction.memo || '', amount,
      type: isCharge ? 'expense' : newTransaction.type,
      isTransfer: isCharge,  // PLから除外するフラグ
      chargeTarget: isCharge ? newTransaction.chargeTarget : undefined,
      paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
      settled: newTransaction.type === 'income' ? true
        : (newTransaction.paymentMethod === 'cash' || newTransaction.paymentMethod === 'wallet'),
      isSettlement: false,
      cardId: newTransaction.paymentMethod === 'credit'
        ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id))
        : undefined,
      walletId: newTransaction.paymentMethod === 'wallet' ? newTransaction.walletId : undefined,
      isSplit: validMembers.length > 0, splitAmount: splitTotalAmt, splitMembers: validMembers,
    };

    const shouldAddSettlement =
      newTransaction.paymentMethod === 'credit' &&
      (newTransaction.type === 'expense' || isCharge);

    if (shouldAddSettlement) {
      const resolvedCardId = newTransaction.cardId
        ? String(newTransaction.cardId)
        : (creditCards[0] ? String(creditCards[0].id) : null);
      const settlementDate = getSettlementDate(newTransaction.date, resolvedCardId, creditCards);
      const card           = creditCards.find(c => String(c.id) === String(resolvedCardId));
      const settlementTxn  = {
        id: Date.now() + 1,
        date: `${settlementDate.getFullYear()}-${String(settlementDate.getMonth() + 1).padStart(2, '0')}-${String(settlementDate.getDate()).padStart(2, '0')}`,
        category: 'クレジット引き落とし' + (card ? `（${card.name}）` : ''),
        amount, type: 'expense', paymentMethod: 'cash',
        settled: settlementDate <= new Date(), isSettlement: true,
        isTransfer: isCharge,
        parentTransactionId: transaction.id, cardId: resolvedCardId,
      };
      setTransactions([transaction, settlementTxn, ...transactions]);
    } else {
      setTransactions([transaction, ...transactions]);
    }
    if (validMembers.length > 0) {
      setSplitPayments(prev => [...prev, ...validMembers.map((m, i) => ({
        id: Date.now() + 2 + i, date: newTransaction.date,
        person: m.name.trim(), amount: Number(m.amount),
        category: newTransaction.category, memo: newTransaction.memo || '',
        transactionId: transaction.id, settled: false,
      }))]);
    }
    setNewTransaction({
      amount: '', category: '', type: 'expense', paymentMethod: 'credit', walletId: null,
      date: new Date().toISOString().slice(0, 10), memo: '', isSplit: false, splitMembers: [], cardId: null, chargeTarget: null,
    });
  };


  // -- チャージ記録（電子マネー・ウォレットへのチャージ）----------------------
  // fromMethod: 'cash' | 'credit'
  // fromCardId: クレカIDまたはnull
  const addCharge = ({ date, amount, walletId, fromMethod, fromCardId, memo }) => {
    const wallet  = wallets.find(w => String(w.id) === String(walletId));
    const card    = fromMethod === 'credit'
      ? creditCards.find(c => String(c.id) === String(fromCardId || (creditCards[0]?.id)))
      : null;
    const resolvedCardId = card ? String(card.id) : null;
    const numAmount = -Math.abs(Number(amount));

    // メインの「チャージ」取引（支出として記録、ただしPL対象外）
    const mainTxn = {
      id:            Date.now(),
      date,
      category:      `${wallet?.icon || '📲'} ${wallet?.name || 'ウォレット'}チャージ`,
      memo:          memo || '',
      amount:        numAmount,
      type:          'expense',
      isTransfer:    true,               // PLから除外
      paymentMethod: fromMethod,
      walletId:      String(walletId),
      settled:       fromMethod === 'cash',
      isSettlement:  false,
      cardId:        resolvedCardId || undefined,
    };

    const newTxns = [mainTxn];

    // クレカからのチャージ → 引き落とし予定を生成
    if (fromMethod === 'credit' && resolvedCardId) {
      const settlementDate = getSettlementDate(date, resolvedCardId, creditCards);
      const settleDateStr  = [
        settlementDate.getFullYear(),
        String(settlementDate.getMonth() + 1).padStart(2, '0'),
        String(settlementDate.getDate()).padStart(2, '0'),
      ].join('-');
      newTxns.push({
        id:                   Date.now() + 1,
        date:                 settleDateStr,
        category:             `クレジット引き落とし${card ? `（${card.name}）` : ''}`,
        memo:                 '',
        amount:               numAmount,
        type:                 'expense',
        isTransfer:           true,     // チャージの引き落としもPL対象外
        paymentMethod:        'cash',
        settled:              settlementDate <= new Date(),
        isSettlement:         true,
        parentTransactionId:  mainTxn.id,
        cardId:               resolvedCardId,
      });
    }

    setTransactions(prev => [...newTxns, ...prev]);
    setShowAddTransaction(false);
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
          settled: newSettlementDate <= new Date(), cardId: updatedTransaction.cardId,
        };
      }
      return t;
    }));
    setEditingTransaction(null);
  };

  const openCloseMonthModal = (targetMonth) => {
    const tMonth    = targetMonth || currentMonth;
    const tBalance  = calculateMonthlyBalance(tMonth, transactions, recurringTransactions);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const planned   = simulationSettings.monthlyInvestment + simulationSettings.monthlySavings;
    setClosingTargetMonth(tMonth);
    setCloseMonthData(cfBalance >= planned
      ? { savedAmount: cfBalance - simulationSettings.monthlyInvestment, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
      : { savedAmount: 0, investAmount: simulationSettings.monthlyInvestment, dryPowderAmount: 0 }
    );
    setShowCloseMonthModal(true);
  };

  const closeMonth = (targetMonth) => {
    const tMonth    = targetMonth || currentMonth;
    const tBalance  = calculateMonthlyBalance(tMonth, transactions, recurringTransactions);
    const cfBalance = isNaN(tBalance.cfBalance) ? 0 : tBalance.cfBalance;
    const plannedInvestment = simulationSettings.monthlyInvestment;
    const totalPlanned      = plannedInvestment + simulationSettings.monthlySavings;
    let actualInvest     = isNaN(closeMonthData.investAmount)    ? 0 : closeMonthData.investAmount;
    let actualDryPowder  = isNaN(closeMonthData.dryPowderAmount) ? 0 : closeMonthData.dryPowderAmount;
    let actualSavings    = isNaN(closeMonthData.savedAmount)     ? 0 : closeMonthData.savedAmount;
    let withdrawalFromSavings = 0;
    if (cfBalance < totalPlanned) {
      withdrawalFromSavings = totalPlanned - cfBalance;
      actualInvest  = plannedInvestment;
      actualSavings = cfBalance - actualDryPowder;
    }
    const recurringInvestIds = new Set(
      recurringTransactions
        .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
        .map(r => r.id)
    );
    const settledInvestments = transactions.filter(t =>
      t.date.startsWith(tMonth) && t.settled && t.recurringId && recurringInvestIds.has(t.recurringId)
    );
    const autoInvestAmount    = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r?.type === 'investment'; }).reduce((s, t) => s + Math.abs(t.amount), 0);
    const autoFundAmount      = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r?.type === 'fund';       }).reduce((s, t) => s + Math.abs(t.amount), 0);
    const autoInsuranceAmount = settledInvestments.filter(t => { const r = recurringTransactions.find(r => r.id === t.recurringId); return r?.type === 'insurance';  }).reduce((s, t) => s + Math.abs(t.amount), 0);
    const n = (v) => isNaN(Number(v)) ? 0 : Number(v);
    setAssetData(prev => ({
      savings:     n(prev.savings)     + actualSavings    - withdrawalFromSavings + autoInsuranceAmount,
      investments: n(prev.investments) + actualInvest     + autoInvestAmount,
      dryPowder:   n(prev.dryPowder)   + actualDryPowder,
      nisa:        n(prev.nisa)        + autoFundAmount,
    }));
    setMonthlyHistory(prev => ({
      ...prev, [tMonth]: {
        plBalance: tBalance.plBalance, cfBalance,
        savedAmount: actualSavings, investAmount: actualInvest,
        dryPowderAmount: actualDryPowder, withdrawalFromSavings,
      },
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
    setCustomCategories(prev => ({
      ...prev,
      renamedDefaults: { ...prev.renamedDefaults, [type]: { ...(prev.renamedDefaults?.[type] || {}), [origName]: newName.trim() } },
    }));
  };

  const handleDeleteDefaultCategory = (origName, type) => {
    setCustomCategories(prev => ({
      ...prev,
      deletedDefaults: { ...prev.deletedDefaults, [type]: [...(prev.deletedDefaults?.[type] || []), origName] },
    }));
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
    const n          = (v) => isNaN(v) ? 0 : v;
    const srcBalance = investForm.fromSource === 'savings' ? n(assetData.savings) : n(assetData.dryPowder || 0);
    if (amount > srcBalance) { alert('残高が不足しています'); return; }
    setAssetData(prev => {
      const nd = { ...prev };
      if (investForm.fromSource === 'savings') nd.savings   = n(prev.savings) - amount;
      else                                     nd.dryPowder = n(prev.dryPowder || 0) - amount;
      if      (investForm.targetAccount === 'investments') nd.investments = n(prev.investments) + amount;
      else if (investForm.targetAccount === 'nisa')        nd.nisa        = n(prev.nisa || 0) + amount;
      else                                                 nd.dryPowder   = n(prev.dryPowder || 0) + amount;
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

  const addTransactionsFromImport = (newTxns) => {
    const now = Date.now();
    const allTxns = [];
    newTxns.forEach((txn, i) => {
      const mainId = now + i * 2;
      const main = { ...txn, id: mainId };
      allTxns.push(main);

      // クレカ払いの場合は引き落とし予定を生成
      if (txn.paymentMethod === 'credit' && txn.cardId) {
        const settlementDate = getSettlementDate(txn.date, txn.cardId, creditCards);
        const card = creditCards.find(c => String(c.id) === String(txn.cardId));
        const settleDateStr = [
          settlementDate.getFullYear(),
          String(settlementDate.getMonth() + 1).padStart(2, '0'),
          String(settlementDate.getDate()).padStart(2, '0'),
        ].join('-');
        allTxns.push({
          id: mainId + 1,
          date: settleDateStr,
          category: 'クレジット引き落とし' + (card ? `（${card.name}）` : ''),
          amount: txn.amount,
          type: 'expense',
          paymentMethod: 'cash',
          settled: settlementDate <= new Date(),
          isSettlement: true,
          parentTransactionId: mainId,
          cardId: txn.cardId,
          memo: '',
          isSplit: false,
          splitMembers: [],
        });
      }
    });
    setTransactions(prev => [...allTxns, ...prev]);
  };


  // ----------------------------------------------------------------------------
  // 返却値
  // ----------------------------------------------------------------------------
  return {
    // -- UI state --------------------------------------------------------------
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
    // -- モーダル ---------------------------------------------------------------
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
    showPayPayImport, setShowPayPayImport,
    transactionTemplates, setTransactionTemplates,
    showTemplateModal, setShowTemplateModal,
    wallets, setWallets, addCharge,
    walletBalances,
    walletAdjustments, setWalletAdjustments,
    showWalletModal, setShowWalletModal,
    editingWallet, setEditingWallet,
    dismissedClosingAlerts, setDismissedClosingAlerts,
    // -- 前日確認 ---------------------------------------------------------------
    showDailyReview, setShowDailyReview,
    dailyReviewTxns, setDailyReviewTxns,
    dailyReviewDate,
    dailyReviewAddForm, setDailyReviewAddForm,
    // -- カテゴリ ---------------------------------------------------------------
    editingCategoryName, setEditingCategoryName,
    editingCategoryValue, setEditingCategoryValue,
    newCategoryName, setNewCategoryName,
    newCategoryType, setNewCategoryType,
    editingRecurring, setEditingRecurring,
    // -- ドメインデータ ---------------------------------------------------------
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
    // -- 派生データ -------------------------------------------------------------
    expenseCategories, incomeCategories,
    currentMonth, currentBalance, budgetAnalysis, unclosedMonths,
    simulationResults, monteCarloResults, scenarioResults, chartData, monteCarloChartData,
    housingParams, setHousingParams, housingComparison,
    showHousingModal, setShowHousingModal,
    lifePlan, setLifePlan, lifePlanSimulation,
    recentMonthlyAverages, incomeGrowthEstimate, monthlyGapImpact,
    // -- アクション -------------------------------------------------------------
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
    addTransactionsFromImport,
    // -- calc関数ブリッジ（UIから引数付きで呼ぶ場合） ----------------------------
    getSettlementDate:         (txDate, cardId) => getSettlementDate(txDate, cardId, creditCards),
    calculateMonthlyBalance:   (ym)             => calculateMonthlyBalance(ym, transactions, recurringTransactions),
    calculateCategoryExpenses: ()               => calculateCategoryExpenses(transactions, currentMonth, recurringTransactions),
    getLast6MonthsTrend:       ()               => getLast6MonthsTrend(transactions, recurringTransactions),
    calculateBenchmark:        (age)            => calculateBenchmark(assetData, age),
  };
}
