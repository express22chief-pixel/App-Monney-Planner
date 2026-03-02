/**
 * App.jsx
 * アプリのルートコンポーネント。できる限り薄く保つ。
 *
 * 【責務】
 * - useMoneyData の呼び出し
 * - AppProvider（テーマ・isPremium）の提供
 * - スプラッシュ表示
 * - ErrorBoundary の設置
 * - AppShell へのデータ受け渡し
 *
 * 【このファイルに書かないもの】
 * - テーマ計算ロジック → context/AppContext.jsx
 * - ビジネスロジック   → hooks/useMoneyData.js
 * - UI実装            → components/以下
 */
import React from 'react';
import { useMoneyData } from './hooks/useMoneyData';
import { AppProvider } from './context/AppContext';
import { useGlobalStyles } from './hooks/useGlobalStyles';
import AppShell from './components/AppShell';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  useGlobalStyles();
  const data = useMoneyData();

  if (data.showSplash) {
    return <SplashScreen darkMode={data.darkMode} />;
  }

  return (
    <ErrorBoundary>
      <AppProvider darkMode={data.darkMode}>
        <AppShell data={data} />
      </AppProvider>
    </ErrorBoundary>
  );
}
