/**
 * constants.js
 * アプリ全体で共有する定数
 */

export const DEFAULT_EXPENSE_CATEGORIES = [
  '食費', '住居費', '光熱費', '通信費', '交通費',
  '娯楽費', '医療費', '教育費', '被服費', 'その他'
];

export const DEFAULT_INCOME_CATEGORIES = [
  '給料', 'ボーナス', '副業', '投資収益', '年金', 'その他'
];

// 金融広報中央委員会「家計の金融行動に関する世論調査」2023年データ（単身世帯）
export const BENCHMARK_DATA = {
  '20s': { median: 1000000, average: 1850000, savings: 1400000, investments: 300000, nisa: 100000, dryPowder: 50000 },
  '30s': { median: 3500000, average: 6060000, savings: 4500000, investments: 1000000, nisa: 400000, dryPowder: 160000 },
  '40s': { median: 5500000, average: 10000000, savings: 7500000, investments: 1800000, nisa: 600000, dryPowder: 300000 },
  '50s': { median: 8000000, average: 15000000, savings: 11000000, investments: 2700000, nisa: 900000, dryPowder: 400000 },
  '60s': { median: 12000000, average: 20000000, savings: 15000000, investments: 3500000, nisa: 1200000, dryPowder: 300000 },
};

export const LIFE_EVENT_TEMPLATES = [
  { name: '結婚', estimatedAmount: 3000000, icon: '💍', type: 'expense' },
  { name: '出産', estimatedAmount: 500000, icon: '👶', type: 'expense' },
  { name: '住宅購入', estimatedAmount: 30000000, icon: '🏠', type: 'expense' },
  { name: '車購入', estimatedAmount: 2000000, icon: '🚗', type: 'expense' },
  { name: '進学', estimatedAmount: 2000000, icon: '🎓', type: 'expense' },
  { name: '海外旅行', estimatedAmount: 500000, icon: '✈️', type: 'expense' },
  { name: '退職', estimatedAmount: 0, icon: '🎉', type: 'milestone' },
  { name: 'カスタム', estimatedAmount: 0, icon: '📌', type: 'expense' },
];

export const EVENT_ICONS = ['💍', '👶', '🏠', '🚗', '🎓', '✈️', '💰', '🎉', '📌', '🎊', '🎁', '⭐'];

export const RISK_PROFILES = {
  conservative: { label: '保守的', icon: '🛡️', description: '安全性重視', returnRate: 3, monthlyInvestment: 20000, monthlySavings: 50000, useLumpSum: false, volatility: 0.05 },
  standard:     { label: '標準的', icon: '⚖️', description: 'バランス重視', returnRate: 5, monthlyInvestment: 30000, monthlySavings: 30000, useLumpSum: true,  volatility: 0.10 },
  aggressive:   { label: '積極的', icon: '🚀', description: '成長重視',   returnRate: 7, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: true,  volatility: 0.15 },
};

export const NISA_LIMITS = {
  TSUMITATE: 3600000,
  GROWTH: 2400000,
  TOTAL: 18000000,
};
