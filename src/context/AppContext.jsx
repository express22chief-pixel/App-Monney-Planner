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

// --- テーマ計算（純粋関数） --------------------------------------------------
export function buildTheme(darkMode) {
  return {
    // layout
    bg:            darkMode ? 'bg-[#080808]'   : 'bg-[#f4f4f2]',
    card:          darkMode ? 'bg-[#111111]'   : 'bg-white',
    cardGlass:     darkMode ? 'glass-dark'      : 'glass',

    // typography
    text:          darkMode ? 'text-[#f0f0f0]' : 'text-[#0a0a0a]',
    textSecondary: darkMode ? 'text-[#aaaaaa]' : 'text-[#555555]',

    // borders
    border:        darkMode ? 'border-[#1f1f1f]' : 'border-[#e8e8e6]',

    // semantic colors — electric palette
    green:         darkMode ? '#00e676'  : '#00c853',   // electric green
    red:           darkMode ? '#ff3d57'  : '#e53935',   // sharp red
    accent:        '#00e5ff',                            // cyan — same in both modes
    purple:        darkMode ? '#d500f9'  : '#aa00ff',   // electric purple
    orange:        darkMode ? '#ff9100'  : '#ff6d00',   // electric orange

    // chart / card backgrounds
    chart:         darkMode ? '#111111'  : '#ffffff',

    // raw hex values for inline styles
    bgHex:         darkMode ? '#080808'  : '#f4f4f2',
    cardHex:       darkMode ? '#111111'  : '#ffffff',
    elevatedHex:   darkMode ? '#181818'  : '#f9f9f7',
    borderHex:     darkMode ? '#1f1f1f'  : '#e8e8e6',
    border2Hex:    darkMode ? '#2a2a2a'  : '#d8d8d6',
    textHex:       darkMode ? '#f0f0f0'  : '#0a0a0a',
    subHex:        darkMode ? '#888888'  : '#666666',
    sub2Hex:       darkMode ? '#6a6a6a'  : '#999999',
  };
}

// --- Context 定義 ------------------------------------------------------------
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
