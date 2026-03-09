/**
 * demoData.js
 * デモモード用の架空データ。「田中 翔太 / 32歳」のモデルケース。
 * クレカ2枚使い、NISAあり、住宅ローン検討中。
 */

const NOW_YEAR  = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth() + 1;
const ym = (offsetMonths = 0) => {
  const d = new Date(NOW_YEAR, NOW_MONTH - 1 + offsetMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const ymDay = (offsetMonths, day) => `${ym(offsetMonths)}-${String(day).padStart(2, '0')}`;

export const DEMO_USER_INFO = {
  name: '田中 翔太（デモ）',
  age: 32,
};

export const DEMO_CREDIT_CARDS = [
  { id: 9001, name: '楽天カード',     closingDay: 27, paymentDay: 27, paymentMonth: 1, nonBusinessDay: 'next' },
  { id: 9002, name: 'Marriott Bonvoy', closingDay: 15, paymentDay: 10, paymentMonth: 1, nonBusinessDay: 'next' },
];

export const DEMO_ASSET_DATA = {
  savings: 1800000,
  investments: 1200000,
  nisa: 800000,
  dryPowder: 300000,
};

// 今月・先月・先々月の取引を生成
const TX = (id, offsetM, day, category, amount, method = 'credit', settled = true, cardId = 9001) => ({
  id,
  date: ymDay(offsetM, day),
  category,
  amount,
  type: amount > 0 ? 'income' : 'expense',
  paymentMethod: amount > 0 ? 'transfer' : method,
  settled,
  ...(method === 'credit' ? { cardId } : {}),
});

export const DEMO_TRANSACTIONS = [
  // 今月
  TX(1, 0,  1,  '給料',   350000, 'transfer', true),
  TX(2, 0,  3,  '食費',    -4200, 'credit', false, 9001),
  TX(3, 0,  5,  '交通費',  -3800, 'cash',   true),
  TX(4, 0,  7,  '娯楽費',  -8900, 'credit', false, 9002),
  TX(5, 0,  8,  '食費',    -6100, 'credit', false, 9001),
  TX(6, 0, 10,  '光熱費',  -9800, 'cash',   true),
  TX(7, 0, 12,  '通信費', -15000, 'credit', false, 9001),
  TX(8, 0, 14,  '食費',    -5500, 'credit', false, 9001),
  TX(9, 0, 15,  '被服費', -22000, 'credit', false, 9002),
  TX(10,0, 20,  '医療費',  -3500, 'cash',   true),
  // 引き落とし（先月分）
  TX(20, 0, 10, 'クレジット引き落とし（楽天カード）', -68000, 'cash', true),
  TX(21, 0, 27, 'クレジット引き落とし（Marriott Bonvoy）', -41000, 'cash', true),

  // 先月
  TX(30,-1,  1, '給料',   350000, 'transfer', true),
  TX(31,-1,  4, '食費',    -5200, 'credit', true, 9001),
  TX(32,-1,  6, '交通費',  -4100, 'cash',   true),
  TX(33,-1,  9, '娯楽費', -12000, 'credit', true, 9002),
  TX(34,-1, 11, '食費',    -7300, 'credit', true, 9001),
  TX(35,-1, 15, '光熱費',  -8900, 'cash',   true),
  TX(36,-1, 17, '通信費', -15000, 'credit', true, 9001),
  TX(37,-1, 20, '食費',    -6800, 'credit', true, 9001),
  TX(38,-1, 22, '教育費', -18000, 'credit', true, 9002),
  TX(39,-1, 25, '娯楽費',  -9500, 'credit', true, 9001),

  // 先々月
  TX(50,-2,  1, '給料',   350000, 'transfer', true),
  TX(51,-2,  3, '食費',    -4800, 'credit', true, 9001),
  TX(52,-2,  8, '交通費',  -3200, 'cash',   true),
  TX(53,-2, 12, '食費',    -6200, 'credit', true, 9001),
  TX(54,-2, 14, '娯楽費', -15000, 'credit', true, 9002),
  TX(55,-2, 18, '光熱費',  -7600, 'cash',   true),
  TX(56,-2, 20, '通信費', -15000, 'credit', true, 9001),
  TX(57,-2, 24, '被服費', -18000, 'credit', true, 9002),
  TX(58,-2, 26, '医療費',  -4200, 'cash',   true),
  TX(59,-2, 28, '食費',    -5100, 'credit', true, 9001),
];

export const DEMO_MONTHLY_HISTORY = {
  [ym(-2)]: { plBalance: 245000, cfBalance: 210000, savedAmount: 30000, investAmount: 30000, dryPowderAmount: 0, withdrawalFromSavings: 0 },
  [ym(-1)]: { plBalance: 262000, cfBalance: 225000, savedAmount: 35000, investAmount: 30000, dryPowderAmount: 0, withdrawalFromSavings: 0 },
};

export const DEMO_LIFE_PLAN = {
  currentAge: 32,
  retirementAge: 60,
  lifeExpectancy: 90,
  annualIncome: 7200000,
  incomeGrowthRate: 1.5,
  monthlyExpense: 220000,
  retirementMonthlyIncome: 180000,
  retirementMonthlyExpense: 200000,
  retirementTargetAmount: 60000000,
};

export const DEMO_SIMULATION_SETTINGS = {
  years: 28,
  monthlyInvestment: 50000,
  monthlySavings: 30000,
  returnRate: 5,
  savingsInterestRate: 0.2,
  useNisa: true,
  useLumpSum: false,
  lumpSumAmount: 0,
  lumpSumMonths: [],
  riskProfile: 'moderate',
  inflationRate: 2,
};

export const DEMO_MONTHLY_BUDGET = {
  income: 350000,
  expenses: {
    '食費': 60000,
    '住居費': 85000,
    '光熱費': 12000,
    '通信費': 15000,
    '交通費': 10000,
    '娯楽費': 20000,
    '医療費': 5000,
    '教育費': 0,
    '被服費': 15000,
    'その他': 10000,
  },
};
