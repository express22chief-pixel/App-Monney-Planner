/**
 * context/AppContext.jsx
 * アプリ全体の設定を管理するContext。
 *
 * 【責務】
 * - isPremium フラグの管理（将来の広告制御に使用）
 * - テーマ（buildTheme）の提供
 * - darkMode の提供（useMoneyDataからブリッジ）
 *
 * 【将来の広告フラグ利用例】
 * const { isPremium } = useAppContext();
 * {!isPremium && <AdBanner />}
 *
 * 【Capacitor課金連携例】
 * ※ Capacitor課金連携: services/purchaseService.js を追加してimport
 * useEffect(() => { isPurchased('premium').then(setIsPremium); }, []);
 */
import React, { createContext, useContext, useMemo } from 'react';

// ─── テーマ計算（純粋関数） ──────────────────────────────────────────────────
export function buildTheme(darkMode) {
  return {
    bg:            darkMode ? 'bg-black'           : 'bg-neutral-50',
    card:          darkMode ? 'bg-neutral-900'     : 'bg-white',
    cardGlass:     darkMode ? 'glass-dark'         : 'glass',
    text:          darkMode ? 'text-neutral-100'   : 'text-neutral-900',
    textSecondary: darkMode ? 'text-neutral-400'   : 'text-neutral-500',
    border:        darkMode ? 'border-neutral-800' : 'border-neutral-200',
    green:         darkMode ? '#0CD664'  : '#10b981',
    red:           darkMode ? '#FF453A'  : '#ef4444',
    accent:        darkMode ? '#0A84FF'  : '#3b82f6',
    purple:        darkMode ? '#BF5AF2'  : '#a855f7',
    orange:        '#FF9F0A',
    chart:         darkMode ? '#1C1C1E'  : '#ffffff',
  };
}

// ─── Context 定義 ────────────────────────────────────────────────────────────
const AppContext = createContext(null);

/**
 * AppProvider
 * @param {{ darkMode: boolean, children: React.ReactNode }} props
 */
export function AppProvider({ darkMode, children }) {
  // isPremium: 将来の課金機能で切り替える。
  // 現状は常に false（全ユーザーが広告あり扱い）。
  // Capacitor InAppPurchase 連携時は useState + useEffect で動的管理に変更。
  const isPremium = false;
  // 例: const [isPremium, setIsPremium] = useState(false);
  //     useEffect(() => { purchaseService.checkPremium().then(setIsPremium); }, []);

  const theme = useMemo(() => buildTheme(darkMode), [darkMode]);

  const value = useMemo(() => ({
    theme,
    isPremium,
    darkMode,
  }), [theme, isPremium, darkMode]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/** AppContextを使うカスタムフック */
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
