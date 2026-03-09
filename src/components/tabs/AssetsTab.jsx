import React, { useState } from 'react';
import { getAgeGroup } from '../../utils/calc';
import { Edit2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AssetsTab(props) {
  const [editingWallet, setEditingWallet] = useState(null); // { wid, txTotal, inputVal }
  const {
    theme, darkMode, assetData, monthlyHistory,
    simulationResults, calculateBenchmark, userInfo,
    setShowAssetEditModal, setShowInvestModal, setShowBenchmark,
    getLast6MonthsTrend, chartData, simulationSettings,
    transactions, recurringTransactions, creditCards,
    setShowClosingCheckModal, getSettlementDate, budgetAnalysis,
    currentBalance, currentMonth, openCloseMonthModal, setActiveTab, selectedMonth,
    calculateCategoryExpenses,
    dismissedClosingAlerts, setDismissedClosingAlerts,
    wallets, walletBalances, walletAdjustments, setWalletAdjustments,
  } = props;
  const formatYM = (ym) => { const [y, m] = ym.split('-'); return `${y}年${parseInt(m)}月`; };

  return (
          <div className="space-y-3 animate-fadeIn">

            <button
              onClick={() => setShowAssetEditModal(true)}
              className={`w-full ${theme.cardGlass} rounded-lg p-4 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#00e5ff' }}>総資産</p>
                <Edit2 size={13} className={theme.textSecondary} />
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', marginBottom: 10 }} className={theme.text}>
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
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>¥{(value/10000).toFixed(0)}万</p>
                  </div>
                ))}
              </div>
            </button>

            {wallets && wallets.length > 0 && (
              <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: darkMode ? '#2a2a2a' : '#f0f0f0' }}>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00e5ff' }}>電子マネー残高</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }} className={theme.text}>
                      ¥{wallets.reduce((s, w) => s + (walletBalances?.[String(w.id)] || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2">
                  {wallets.map(w => {
                    const wid = String(w.id);
                    const bal = walletBalances?.[wid] || 0;
                    const [editing, setEditing] = [false, () => {}]; // ローカルstateは使えないため下で対処
                    return (
                      <div key={w.id} className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: (w.color || '#888') + '22' }}>
                          {w.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 600 }} className={theme.text}>{w.name}</p>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: bal < 0 ? theme.red : bal === 0 ? (darkMode ? '#444' : '#bbb') : theme.accent }}>
                            ¥{bal.toLocaleString()}
                            {bal < 0 && <span className="ml-1 text-red-400">残高不足</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const current = walletAdjustments?.[wid] || 0;
                            const txTotal = bal - current;
                            setEditingWallet({ wid, txTotal, inputVal: String(bal) });
                          }}
                          className={`shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-semibold ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}
                        >修正</button>
                      </div>
                    );
                  })}
                  <p className={`text-[10px] text-center pt-1 ${theme.textSecondary}`}>「修正」で現在の実際の残高に合わせられます</p>

                  {editingWallet && (
                    <div className={`mt-3 p-4 rounded-lg border-2 ${darkMode ? 'bg-neutral-800 border-blue-500/40' : 'bg-blue-50 border-blue-200'}`}>
                      <p className={`text-xs font-bold mb-2 ${theme.text}`}>
                        {wallets.find(w => String(w.id) === editingWallet.wid)?.icon} {wallets.find(w => String(w.id) === editingWallet.wid)?.name} の残高を修正
                      </p>
                      <p className={`text-[10px] mb-2 ${theme.textSecondary}`}>
                        取引履歴分: ¥{editingWallet.txTotal.toLocaleString()} ／ 現在の記録残高に合わせる
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={editingWallet.inputVal}
                          onChange={e => setEditingWallet(prev => ({ ...prev, inputVal: e.target.value }))}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold tabular-nums border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-white text-neutral-900 border-neutral-200'}`}
                          placeholder="残高を入力"
                        />
                        <button
                          onClick={() => {
                            const newBal = Number(String(editingWallet.inputVal).replace(/[^0-9-]/g, ''));
                            if (!isNaN(newBal)) {
                              setWalletAdjustments(prev => ({ ...prev, [editingWallet.wid]: newBal - editingWallet.txTotal }));
                            }
                            setEditingWallet(null);
                          }}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-500"
                        >確定</button>
                        <button
                          onClick={() => setEditingWallet(null)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}
                        >✕</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInvestModal(true)}
              className={`w-full ${theme.cardGlass} rounded-lg p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[10px] ${theme.textSecondary} mb-0.5 uppercase tracking-wide font-medium`}>振替・投資実行</p>
                  <p className={`text-sm font-semibold ${theme.text}`}>現預金・待機資金 → 投資口座</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </button>

            <button
              onClick={() => setShowBenchmark(true)}
              className={`w-full ${theme.cardGlass} rounded-lg p-3.5 transition-all duration-200 hover-scale text-left`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-[10px] ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>
                    {userInfo?.age ? `同世代比較（${getAgeGroup(userInfo?.age)==='20s'?'20代':getAgeGroup(userInfo?.age)==='30s'?'30代':getAgeGroup(userInfo?.age)==='40s'?'40代':getAgeGroup(userInfo?.age)==='50s'?'50代':'60代以上'}）` : '同世代比較'}
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
                  <div key={card.id} className="rounded-lg p-4 border-l-4" style={{ backgroundColor: darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', borderColor: '#6366f1' }}>
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
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#6366f1' }}>
                        金額を確認・修正する
                      </button>
                      <button onClick={() => setDismissedClosingAlerts(prev => ({ ...prev, [alertKey]: true }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-500'}`}>
                        問題なし
                      </button>
                    </div>
                  </div>
                );
              });
            })()}

          </div>

  );
}