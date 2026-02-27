/**
 * AppShell.jsx
 * ヘッダー・タブバー・FABを含むレイアウトシェル。
 * 将来の広告バナー挿入もここに差し込むだけでOK。
 */
import React from 'react';
import { Sun, Moon, DollarSign, BarChart2, Calendar, TrendingUp, Settings } from 'lucide-react';

import HomeTab       from './tabs/HomeTab';
import CalendarTab   from './tabs/CalendarTab';
import AssetsTab     from './tabs/AssetsTab';
import SimulationTab from './tabs/SimulationTab';
import SettingsTab   from './tabs/SettingsTab';

// ─── モーダル群 ──────────────────────────────────────────────────────────────
import AssetEditModal        from './modals/AssetEditModal';
import BudgetModal           from './modals/BudgetModal';
import CategoryModal         from './modals/CategoryModal';
import RecurringModal        from './modals/RecurringModal';
import DateTransactionsModal from './modals/DateTransactionsModal';
import InvestModal           from './modals/InvestModal';
import BenchmarkModal        from './modals/BenchmarkModal';
import LifeEventModal        from './modals/LifeEventModal';
import TutorialModal         from './modals/TutorialModal';
import OnboardingModal       from './modals/OnboardingModal';
import AddTransactionModal   from './modals/AddTransactionModal';
import CloseMonthModal       from './modals/CloseMonthModal';
import EditTransactionModal  from './modals/EditTransactionModal';
import SetupWizardModal      from './modals/SetupWizardModal';
import DailyReviewModal      from './modals/DailyReviewModal';
import ClosingCheckModal     from './modals/ClosingCheckModal';
import CardModal             from './modals/CardModal';

const TABS = [
  { id: 'home',       icon: <DollarSign size={20} />,  label: '家計簿' },
  { id: 'assets',     icon: <BarChart2 size={20} />,    label: '資産'   },
  { id: 'calendar',   icon: <Calendar size={20} />,    label: '履歴'   },
  { id: 'simulation', icon: <TrendingUp size={20} />,  label: 'シミュ' },
  { id: 'settings',   icon: <Settings size={20} />,    label: '設定'   },
];

export default function AppShell({ data }) {
  const {
    activeTab, setActiveTab,
    darkMode, setDarkMode,
    userInfo, theme,
  } = data;

  // タブに渡す props をまとめる（全stateをdataから展開）
  const tabProps = data;

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-all duration-300`}>

      {/* ─── ヘッダー ───────────────────────────────────────────────── */}
      <div className={`${darkMode ? 'bg-neutral-900' : 'bg-white'} border-b ${theme.border} transition-colors duration-300`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-semibold ${theme.text} tracking-tight`}>
                Money Planner
                {userInfo?.name && (
                  <span className={`text-sm ml-2 font-normal ${theme.textSecondary}`}>{userInfo.name}</span>
                )}
              </h1>
              <p className={`text-xs ${theme.textSecondary} font-medium tabular-nums`}>
                {new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}
              >
                {darkMode
                  ? <Sun size={18} className="text-yellow-400" />
                  : <Moon size={18} className="text-neutral-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── タブコンテンツ ──────────────────────────────────────────── */}
      <div className="max-w-md mx-auto p-3">
        {activeTab === 'home'       && <HomeTab       {...tabProps} />}
        {activeTab === 'calendar'   && <CalendarTab   {...tabProps} />}
        {activeTab === 'assets'     && <AssetsTab     {...tabProps} />}
        {activeTab === 'simulation' && <SimulationTab {...tabProps} />}
        {activeTab === 'settings'   && <SettingsTab   {...tabProps} />}
      </div>

      {/* ─── 広告バナー挿入ポイント ─────────────────────────────────── */}
      {/* 将来ここにAdMobバナーやウェブ広告を差し込む */}
      {/* <AdBanner /> */}

      {/* ─── FAB（取引追加ボタン）────────────────────────────────────── */}
      {activeTab !== 'settings' && (
        <div className="fixed z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)', right: '16px' }}>
          <button
            onClick={() => data.setShowAddTransaction(true)}
            className="h-12 px-5 rounded-full text-white text-sm font-bold shadow-lg transition-all duration-200 flex items-center gap-2 hover-scale"
            style={{ backgroundColor: theme.accent, boxShadow: `0 4px 20px ${theme.accent}55` }}
          >
            <span className="text-xl font-light leading-none">+</span>
            <span>取引を追加</span>
          </button>
        </div>
      )}

      {/* ─── タブバー ────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 transition-colors duration-300"
        style={{
          backgroundColor: darkMode ? 'rgba(17,17,17,0.94)' : 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="max-w-md mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all duration-200 ${
                activeTab === tab.id ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{ color: activeTab === tab.id ? theme.accent : (darkMode ? '#8E8E93' : '#9ca3af') }}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                activeTab === tab.id ? (darkMode ? 'bg-neutral-800' : 'bg-blue-50') : ''
              }`}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── モーダル群 ──────────────────────────────────────────────── */}
      {data.showAssetEditModal        && <AssetEditModal        {...tabProps} />}
      {data.showBudgetModal           && <BudgetModal           {...tabProps} />}
      {data.showCategoryModal         && <CategoryModal         {...tabProps} />}
      {data.showRecurringModal        && <RecurringModal        {...tabProps} />}
      {data.showDateTransactionsModal && data.selectedDate && <DateTransactionsModal {...tabProps} />}
      {data.showInvestModal           && <InvestModal           {...tabProps} />}
      {data.showBenchmark             && <BenchmarkModal        {...tabProps} />}
      {data.showLifeEventModal        && <LifeEventModal        {...tabProps} />}
      {data.showTutorial              && <TutorialModal         {...tabProps} />}
      {data.showOnboarding            && <OnboardingModal       {...tabProps} />}
      {data.showAddTransaction        && <AddTransactionModal   {...tabProps} />}
      {data.showCloseMonthModal       && <CloseMonthModal       {...tabProps} />}
      {data.editingTransaction        && <EditTransactionModal  {...tabProps} />}
      {data.showSetupWizard           && <SetupWizardModal      {...tabProps} />}
      {data.showDailyReview           && <DailyReviewModal      {...tabProps} />}
      {data.showClosingCheckModal     && <ClosingCheckModal     {...tabProps} />}
      {data.showCardModal             && <CardModal             {...tabProps} />}
    </div>
  );
}
