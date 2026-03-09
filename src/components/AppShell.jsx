/**
 * AppShell.jsx
 * ヘッダー・タブバー・FABを含むレイアウトシェル。
 * 将来の広告バナー挿入もここに差し込むだけでOK。
 */
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Sun, Moon, DollarSign, BarChart2, Calendar, TrendingUp, Settings } from 'lucide-react';

import HomeTab       from './tabs/HomeTab';
import CalendarTab   from './tabs/CalendarTab';
import AssetsTab     from './tabs/AssetsTab';
import SimulationTab from './tabs/SimulationTab';
import SettingsTab   from './tabs/SettingsTab';

// --- モーダル群 --------------------------------------------------------------
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
import PayPayImportModal     from './modals/PayPayImportModal';
import TemplateModal              from './modals/TemplateModal';
import AllTransactionsModal       from './modals/AllTransactionsModal';

const TABS = [
  { id: 'home',       icon: <DollarSign size={19} />,  label: '家計簿' },
  { id: 'assets',     icon: <BarChart2 size={19} />,    label: '資産'   },
  { id: 'calendar',   icon: <Calendar size={19} />,    label: '履歴'   },
  { id: 'simulation', icon: <TrendingUp size={19} />,  label: '計画'   },
  { id: 'settings',   icon: <Settings size={19} />,    label: '設定'   },
];

export default function AppShell({ data }) {
  const { theme, isPremium } = useAppContext();
  const [fabOpen, setFabOpen] = React.useState(false);
  const [showAllTransactions, setShowAllTransactions] = React.useState(false);
  const {
    activeTab, setActiveTab,
    darkMode, setDarkMode,
    userInfo,
  } = data;

  // タブ・モーダルに渡す props（dataにthemeを追加）
  // themeはAppContextから取得し、子コンポーネントへpropsとして伝播させる
  const tabProps = { ...data, theme, setShowAllTransactions };

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-colors duration-200`}>

      <div
        className="sticky top-0 z-30 transition-colors duration-200"
        style={{
          backgroundColor: theme.cardHex,
          borderBottom: `1px solid ${theme.borderHex}`,
        }}
      >
        <div className="max-w-md mx-auto px-4" style={{ paddingTop: 14, paddingBottom: 10 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: theme.textHex,
              }}>
                MONEY<span style={{ color: '#00e5ff' }}>.</span>PLANNER
                {userInfo?.name && (
                  <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8, color: theme.subHex, fontFamily: "'Noto Sans JP', sans-serif" }}>{userInfo.name}</span>
                )}
              </h1>
              <p style={{ fontSize: 10, color: theme.subHex, fontFamily: "'JetBrains Mono', monospace", marginTop: 1, letterSpacing: '0.05em' }}>
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: 32, height: 32, borderRadius: 6,
                border: `1px solid ${theme.borderHex}`,
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              {darkMode
                ? <Sun size={15} style={{ color: '#00e5ff' }} />
                : <Moon size={15} style={{ color: theme.subHex }} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3">
        {activeTab === 'home'       && <HomeTab       {...tabProps} />}
        {activeTab === 'calendar'   && <CalendarTab   {...tabProps} />}
        {activeTab === 'assets'     && <AssetsTab     {...tabProps} />}
        {activeTab === 'simulation' && <SimulationTab {...tabProps} />}
        {activeTab === 'settings'   && <SettingsTab   {...tabProps} />}
      </div>

      {/* 実装例: {!isPremium && <AdBanner />} */}
      {!isPremium && (
        <div></div>
      )}

      {activeTab !== 'settings' && (
        <div className="fixed z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)', right: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

          {fabOpen && (
            <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />
          )}

          {fabOpen && (
            <div className="flex flex-col items-end gap-2 animate-fadeIn">
              {[
                { label: 'PayPay', emoji: '🔴', color: '#ff3d57', action: () => { data.setShowPayPayImport(true); setFabOpen(false); } },
                { label: 'テンプレ', emoji: '⚡', color: '#ff9100', action: () => { data.setShowTemplateModal(true); setFabOpen(false); } },
                { label: '手動入力', emoji: '✏️', color: '#00e5ff', action: () => { data.setShowAddTransaction(true); setFabOpen(false); } },
              ].map(({ label, emoji, color, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    height: 38, paddingLeft: 14, paddingRight: 14,
                    borderRadius: 4,
                    border: `1px solid ${color}`,
                    background: `${color}15`,
                    color,
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: `0 0 12px ${color}30`,
                    cursor: 'pointer',
                  }}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setFabOpen(v => !v)}
            style={{
              width: 48, height: 48,
              borderRadius: 4,
              border: '1.5px solid #00e5ff',
              background: fabOpen ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.08)',
              color: '#00e5ff',
              fontSize: 22, fontWeight: 300, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,229,255,0.35)',
              cursor: 'pointer',
              transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease',
            }}
          >
            +
          </button>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0"
        style={{
          backgroundColor: theme.cardHex,
          borderTop: `1px solid ${theme.borderHex}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-md mx-auto flex" style={{ height: 58 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 4, position: 'relative', background: 'none', border: 'none',
                  cursor: 'pointer',
                  color: isActive
                    ? '#00e5ff'
                    : (darkMode ? '#787878' : '#999999'),
                  transition: 'color 0.18s ease',
                  paddingBottom: 2,
                }}
              >

                <span style={{
                  position: 'absolute', top: 0,
                  left: '28%', right: '28%', height: 2,
                  background: isActive ? '#00e5ff' : 'transparent',
                  boxShadow: isActive ? '0 0 8px rgba(0,229,255,0.9)' : 'none',
                  borderRadius: '0 0 2px 2px',
                  transition: 'background 0.18s',
                }} />
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                }}>
                  {tab.icon}
                </span>
                <span style={{
                  fontSize: 11,
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1,
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
      {data.showPayPayImport          && <PayPayImportModal      {...tabProps} />}
      {data.showTemplateModal         && <TemplateModal          {...tabProps} />}
      {showAllTransactions && (
        <AllTransactionsModal
          theme={theme} darkMode={data.darkMode}
          transactions={data.transactions}
          creditCards={data.creditCards}
          wallets={data.wallets}
          setEditingTransaction={data.setEditingTransaction}
          onClose={() => setShowAllTransactions(false)}
        />
      )}
    </div>
  );
}
