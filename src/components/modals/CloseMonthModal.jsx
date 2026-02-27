import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function CloseMonthModal(props) {
  const { theme, darkMode, closingTargetMonth, closeMonthData, setCloseMonthData, closeMonth, setShowCloseMonthModal, simulationSettings, calculateMonthlyBalance, currentBalance, currentMonth, budgetAnalysis } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-1`}>{(closingTargetMonth || currentMonth).replace('-','年')}月の収支を確定する</h2>
            <p className={`text-sm ${theme.textSecondary} mb-4`}>{closingTargetMonth || currentMonth} の集計を確定します</p>
            {(() => {
              const tb = calculateMonthlyBalance(closingTargetMonth || currentMonth);
              return (<>
                <p className={`${theme.textSecondary} mb-2`}>
                  PL（発生ベース）: <span className="font-bold" style={{ color: tb.plBalance >= 0 ? theme.green : theme.red }}>¥{tb.plBalance.toLocaleString()}</span>
                </p>
                <p className={`${theme.textSecondary} mb-4`}>
                  CF（現金ベース）: <span className="font-bold" style={{ color: tb.cfBalance >= 0 ? theme.green : theme.red }}>¥{tb.cfBalance.toLocaleString()}</span>
                </p>
              </>);
            })()}

            {budgetAnalysis.investment.needsWithdrawal && (!closingTargetMonth || closingTargetMonth === currentMonth) && (
              <div className={`${darkMode ? 'bg-orange-900 bg-opacity-20' : 'bg-orange-50'} rounded-lg p-3 mb-4 border`} style={{ borderColor: theme.orange }}>
                <p className={`text-sm font-semibold mb-1`} style={{ color: theme.orange }}>⚠ 投資計画のお知らせ</p>
                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-orange-700'}`}>
                  今月のCFだけでは投資計画を達成できません。<br/>
                  貯金から<span className="font-bold">¥{budgetAnalysis.investment.withdrawalAmount.toLocaleString()}</span>を取り崩して投資します。
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  投資に回す金額: ¥{closeMonthData.investAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(calculateMonthlyBalance(closingTargetMonth || currentMonth).cfBalance, simulationSettings.monthlyInvestment)}
                  step="1000"
                  value={closeMonthData.investAmount}
                  onChange={(e) => {
                    const investAmount = Number(e.target.value);
                    const remaining = currentBalance.cfBalance - investAmount - closeMonthData.dryPowderAmount;
                    setCloseMonthData({
                      ...closeMonthData,
                      investAmount,
                      savedAmount: remaining
                    });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                  <BarChart2 size={14} style={{ color: theme.accent }} />
                  待機資金に回す金額: ¥{closeMonthData.dryPowderAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max={calculateMonthlyBalance(closingTargetMonth || currentMonth).cfBalance - closeMonthData.investAmount}
                  step="1000"
                  value={closeMonthData.dryPowderAmount}
                  onChange={(e) => {
                    const dryPowderAmount = Number(e.target.value);
                    const remaining = currentBalance.cfBalance - closeMonthData.investAmount - dryPowderAmount;
                    setCloseMonthData({
                      ...closeMonthData,
                      dryPowderAmount,
                      savedAmount: remaining
                    });
                  }}
                  className="w-full"
                />
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-4 space-y-2`}>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>貯金へ</span>
                  <span className="font-bold tabular-nums" style={{ color: '#3b82f6' }}>
                    {closeMonthData.savedAmount >= 0 ? '+' : ''}¥{closeMonthData.savedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>投資へ</span>
                  <span className="font-bold tabular-nums" style={{ color: '#a855f7' }}>¥{closeMonthData.investAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>待機資金へ</span>
                  <span className="font-bold tabular-nums" style={{ color: theme.accent }}>¥{closeMonthData.dryPowderAmount.toLocaleString()}</span>
                </div>
                {closeMonthData.savedAmount < 0 && (
                  <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${darkMode ? '#2C2C2E' : '#e5e7eb'}` }}>
                    <span className={`text-xs ${theme.textSecondary}`}>貯金から取崩</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: theme.orange }}>
                      ¥{Math.abs(closeMonthData.savedAmount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseMonthModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-neutral-800 text-white' : 'border-2 border-neutral-300 text-neutral-700'
                }`}
              >
                キャンセル
              </button>
              <button
                onClick={() => { closeMonth(closingTargetMonth); setClosingTargetMonth(null); }}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                確定
              </button>
            </div>
          </div>
        </div>


  );
}
