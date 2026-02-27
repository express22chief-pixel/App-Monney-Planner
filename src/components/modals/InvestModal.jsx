import React from 'react';

export default function InvestModal(props) {
  const { theme, darkMode, investForm, setInvestForm, assetData, executeInvestment, setShowInvestModal } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>📈 投資を実行</h2>
              <button onClick={() => setShowInvestModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>振替元</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInvestForm({ ...investForm, fromSource: 'savings' })}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      investForm.fromSource === 'savings' ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: investForm.fromSource === 'savings' ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: investForm.fromSource === 'savings' ? '#fff' : theme.textSecondary
                    }}
                  >
                    💰 現預金<br/>
                    <span className="text-xs tabular-nums">¥{((isNaN(assetData.savings) ? 0 : assetData.savings) / 10000).toFixed(0)}万</span>
                  </button>
                  <button
                    onClick={() => setInvestForm({ ...investForm, fromSource: 'dryPowder' })}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      investForm.fromSource === 'dryPowder' ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: investForm.fromSource === 'dryPowder' ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: investForm.fromSource === 'dryPowder' ? '#fff' : theme.textSecondary
                    }}
                  >
                    💧 待機資金<br/>
                    <span className="text-xs tabular-nums">¥{((isNaN(assetData.dryPowder) ? 0 : (assetData.dryPowder || 0)) / 10000).toFixed(0)}万</span>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>振替先</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'investments', label: '📊 投資', color: theme.purple },
                    { key: 'nisa', label: '🌱 NISA', color: theme.green },
                    { key: 'dryPowder', label: '💧 待機資金', color: theme.accent }
                  ].map(({ key, label, color }) => (
                    key !== investForm.fromSource && (
                      <button
                        key={key}
                        onClick={() => setInvestForm({ ...investForm, targetAccount: key })}
                        className={`py-2 rounded-xl font-semibold text-xs transition-all ${
                          investForm.targetAccount === key ? 'scale-105' : ''
                        }`}
                        style={{
                          backgroundColor: investForm.targetAccount === key ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                          color: investForm.targetAccount === key ? '#fff' : theme.textSecondary
                        }}
                      >
                        {label}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="100000"
                  value={investForm.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setInvestForm({ ...investForm, amount: value });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums text-lg font-bold transition-all ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                  ¥{(Number(investForm.amount) || 0).toLocaleString()}
                </p>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 text-sm`}>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>
                    {investForm.fromSource === 'savings' ? '💰 現預金' : '💧 待機資金'} から
                  </span>
                  <span className={theme.textSecondary}>
                    {investForm.targetAccount === 'investments' ? '📊 投資口座' : investForm.targetAccount === 'nisa' ? '🌱 NISA' : '💧 待機資金'} へ
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`font-bold tabular-nums`} style={{ color: theme.red }}>
                    -{(Number(investForm.amount) || 0).toLocaleString()}円
                  </span>
                  <span className={`font-bold tabular-nums`} style={{ color: theme.green }}>
                    +{(Number(investForm.amount) || 0).toLocaleString()}円
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvestModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-bold ${
                  darkMode ? 'bg-neutral-800 text-white' : 'border-2 border-neutral-300 text-neutral-700'
                }`}
              >
                キャンセル
              </button>
              <button
                onClick={executeInvestment}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.purple }}
              >
                振替実行
              </button>
            </div>
          </div>
        </div>


  );
}
