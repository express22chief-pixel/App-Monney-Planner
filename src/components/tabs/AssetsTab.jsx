import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AssetsTab(props) {
  const {
    theme, darkMode, assetData, monthlyHistory,
    simulationResults, calculateBenchmark, userInfo,
    setShowAssetEditModal, setShowInvestModal, setShowBenchmark,
    getLast6MonthsTrend, chartData, simulationSettings,
    transactions, recurringTransactions, creditCards,
    setShowClosingCheckModal, getSettlementDate, budgetAnalysis,
  } = props;

  return (
          <div className="space-y-3 animate-fadeIn">

            {/* 総資産 */}
            <button
              onClick={() => setShowAssetEditModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${theme.textSecondary} font-medium uppercase tracking-wide`}>Total Assets</p>
                <Edit2 size={13} className={theme.textSecondary} />
              </div>
              <p className={`text-3xl font-bold ${theme.text} mb-3 tabular-nums tracking-tight`}>
                ¥{((isNaN(assetData.savings)?0:assetData.savings)+(isNaN(assetData.investments)?0:assetData.investments)+(isNaN(assetData.nisa)?0:(assetData.nisa||0))+(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0))).toLocaleString()}
              </p>
              {(() => {
                const total = (isNaN(assetData.savings)?0:assetData.savings)+(isNaN(assetData.investments)?0:assetData.investments)+(isNaN(assetData.nisa)?0:(assetData.nisa||0))+(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0));
                if (total === 0) return null;
                return (
                  <div className="w-full h-2 rounded-full overflow-hidden flex mb-3">
                    <div style={{ width: `${(isNaN(assetData.savings)?0:assetData.savings)/total*100}%`, backgroundColor: '#3b82f6' }}></div>
                    <div style={{ width: `${(isNaN(assetData.investments)?0:assetData.investments)/total*100}%`, backgroundColor: '#a855f7' }}></div>
                    <div style={{ width: `${(isNaN(assetData.nisa)?0:(assetData.nisa||0))/total*100}%`, backgroundColor: theme.green }}></div>
                    <div style={{ width: `${(isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0))/total*100}%`, backgroundColor: theme.accent }}></div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '現預金', value: isNaN(assetData.savings)?0:assetData.savings, color: '#3b82f6' },
                  { label: '投資', value: isNaN(assetData.investments)?0:assetData.investments, color: '#a855f7' },
                  { label: 'NISA', value: isNaN(assetData.nisa)?0:(assetData.nisa||0), color: theme.green },
                  { label: '投資待機', value: isNaN(assetData.dryPowder)?0:(assetData.dryPowder||0), color: theme.accent },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-[10px] ${theme.textSecondary} mb-0.5`}>{label}</p>
                    <p className="text-sm font-bold tabular-nums" style={{ color }}>¥{(value/10000).toFixed(0)}万</p>
                  </div>
                ))}
              </div>
            </button>

            {/* 投資実行 */}
            <button
              onClick={() => setShowInvestModal(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[10px] ${theme.textSecondary} mb-0.5 uppercase tracking-wide font-medium`}>振替・投資実行</p>
                  <p className={`text-sm font-semibold ${theme.text}`}>現預金・待機資金 → 投資口座</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </button>

            {/* 同世代比較 */}
            <button
              onClick={() => setShowBenchmark(true)}
              className={`w-full ${theme.cardGlass} rounded-xl p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-[10px] ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>
                    {userInfo?.age ? `同世代比較（${getAgeGroup()==='20s'?'20代':getAgeGroup()==='30s'?'30代':getAgeGroup()==='40s'?'40代':getAgeGroup()==='50s'?'50代':'60代以上'}）` : '同世代比較'}
                  </p>
                  <div className="flex items-center gap-2">
                    {!userInfo?.age && (
                      <button onClick={() => setActiveTab('settings')} className={`text-xs px-2 py-1 rounded-lg mb-1 ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        ⚙ 年齢を設定すると同世代と比較できます
                      </button>
                    )}
                    <p className="text-xl font-bold tabular-nums" style={{ color: calculateBenchmark().isAboveAverage ? theme.green : theme.red }}>
                      {calculateBenchmark().isAboveAverage?'+':''}{(calculateBenchmark().difference/10000).toFixed(0)}万円
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                      backgroundColor: calculateBenchmark().isAboveAverage ? 'rgba(12,214,100,0.15)' : 'rgba(255,69,58,0.15)',
                      color: calculateBenchmark().isAboveAverage ? theme.green : theme.red
                    }}>
                      上位{(100-calculateBenchmark().percentile).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl ml-2">📊</div>
              </div>
            </button>

            {/* 締め日到来バナー */}
            {(() => {
              const today = new Date();
              const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
              const currentYM = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
              const alerts = creditCards.filter(card => {
                const closingDay = card.closingDay >= 28 ? new Date(today.getFullYear(), today.getMonth()+1, 0).getDate() : card.closingDay;
                const closingDate = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(closingDay).padStart(2,'0');
                const alertKey = card.id + '-' + currentYM;
                return todayStr >= closingDate && !dismissedClosingAlerts[alertKey];
              });
              if (alerts.length === 0) return null;
              return alerts.map(card => {
                const alertKey = card.id + '-' + currentYM;
                const closingDay = card.closingDay >= 28 ? new Date(today.getFullYear(), today.getMonth(), 0).getDate() : card.closingDay;
                const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth();
                const prevYear = today.getMonth() === 0 ? today.getFullYear()-1 : today.getFullYear();
                const periodStart = prevYear + '-' + String(prevMonth).padStart(2,'0') + '-' + String(closingDay+1).padStart(2,'0');
                const periodEnd = todayStr;
                const periodTxns = transactions.filter(t =>
                  !t.isSettlement && t.paymentMethod === 'credit' &&
                  String(t.cardId) === String(card.id) &&
                  t.date >= periodStart && t.date <= periodEnd
                );
                const total = periodTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const settlementDate = getSettlementDate(todayStr, card.id);
                const settleDateStr = settlementDate.getFullYear() + '-' + String(settlementDate.getMonth()+1).padStart(2,'0') + '-' + String(settlementDate.getDate()).padStart(2,'0');
                return (
                  <div key={card.id} className="rounded-xl p-4 border-l-4" style={{ backgroundColor: darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', borderColor: '#6366f1' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-1" style={{ color: '#6366f1' }}>💳 {card.name} の締め日を過ぎました</p>
                        <p className={`text-xs ${theme.textSecondary} mb-1`}>記録上の引き落とし予定額：<span className="font-bold" style={{ color: '#6366f1' }}>¥{total.toLocaleString()}</span></p>
                        <p className={`text-xs ${theme.textSecondary}`}>引き落とし日: {settleDateStr}</p>
                      </div>
                      <button onClick={() => setDismissedClosingAlerts(prev => ({ ...prev, [alertKey]: true }))} className={`text-xs ${theme.textSecondary} shrink-0`}>✕</button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setShowClosingCheckModal({ card, total, settleDateStr, alertKey })}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#6366f1' }}>
                        金額を確認・修正する
                      </button>
                      <button onClick={() => setDismissedClosingAlerts(prev => ({ ...prev, [alertKey]: true }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-500'}`}>
                        問題なし
                      </button>
                    </div>
                  </div>
                );
              });
            })()}

            {/* 今月の収支 */}
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>今月の収支</h2>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  予算設定 →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3`}>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>収入 (PL)</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: theme.green }}>¥{(budgetAnalysis.income.actual/10000).toFixed(1)}万</p>
                  <p className={`text-xs ${theme.textSecondary} tabular-nums`}>予算 ¥{(budgetAnalysis.income.budgeted/10000).toFixed(0)}万</p>
                </div>
                <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3`}>
                  <p className={`text-xs ${theme.textSecondary} mb-1`}>支出 (PL)</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: budgetAnalysis.expense.difference<=0?theme.green:theme.red }}>
                    ¥{(budgetAnalysis.expense.actual/10000).toFixed(1)}万
                  </p>
                  <p className={`text-xs ${theme.textSecondary} tabular-nums`}>予算 ¥{(budgetAnalysis.expense.budgeted/10000).toFixed(0)}万</p>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-neutral-900 border border-neutral-700' : 'bg-neutral-50'} rounded-lg p-3 space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>PL残高（発生ベース）</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: currentBalance.plBalance>=0?theme.green:theme.red }}>
                    {currentBalance.plBalance>=0?'+':''}¥{currentBalance.plBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme.textSecondary}`}>CF残高（現金ベース）</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: currentBalance.cfBalance>=0?theme.green:theme.red }}>
                    {currentBalance.cfBalance>=0?'+':''}¥{currentBalance.cfBalance.toLocaleString()}
                  </span>
                </div>
                {currentBalance.investmentTransfer > 0 && (
                  <div className="flex justify-between items-center pt-1" style={{ borderTop: `1px solid ${darkMode?'#2C2C2E':'#e5e7eb'}` }}>
                    <span className={`text-xs ${theme.textSecondary}`}>📈 投資積立（除外済）</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#a855f7' }}>¥{currentBalance.investmentTransfer.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {!monthlyHistory[currentMonth] && currentBalance.cfBalance !== 0 && (
                <button
                  onClick={() => openCloseMonthModal()}
                  className="w-full mt-3 py-2.5 rounded-xl font-semibold text-white transition-all hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  {selectedMonth.replace('-', '年')}月の収支を確定する
                </button>
              )}
            </div>

            {/* 支出内訳（投資除外） */}
            {(() => {
              const investIds = new Set(recurringTransactions.filter(r => r.type==='investment'||r.type==='fund').map(r => r.id));
              const catMap = transactions
                .filter(t => t.date.startsWith(currentMonth) && t.amount < 0 && !t.isSettlement && !(t.recurringId && investIds.has(t.recurringId)) && !t.isInvestment)
                .reduce((acc, t) => { acc[t.category] = (acc[t.category]||0) + Math.abs(t.amount); return acc; }, {});
              const items = Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a,b) => b.amount - a.amount);
              const total = items.reduce((s, i) => s + i.amount, 0);
              if (items.length === 0) return null;
              return (
                <div className={`${theme.cardGlass} rounded-xl p-4`}>
                  <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>今月の支出内訳</h2>
                  <div className="space-y-2.5">
                    {items.map((item, idx) => {
                      const pct = item.amount / total * 100;
                      const bd = budgetAnalysis.categoryComparison[item.category];
                      return (
                        <div key={item.category} className="animate-fadeIn" style={{ animationDelay: `${idx*0.04}s` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${theme.text}`}>{item.category}</span>
                            <div className="flex items-center gap-2">
                              {bd && bd.budgeted > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{
                                  backgroundColor: bd.difference<=0?'rgba(12,214,100,0.15)':'rgba(255,69,58,0.15)',
                                  color: bd.difference<=0?theme.green:theme.red
                                }}>{bd.percentage.toFixed(0)}%</span>
                              )}
                              <span className={`text-xs font-semibold ${theme.text} tabular-nums`}>¥{item.amount.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className={`w-full ${darkMode?'bg-neutral-800':'bg-neutral-200'} rounded-full h-1.5 overflow-hidden`}>
                            <div className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: bd&&bd.difference>0?theme.red:theme.accent }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

  );
}
