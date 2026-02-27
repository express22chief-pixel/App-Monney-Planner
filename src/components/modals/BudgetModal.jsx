import React from 'react';

export default function BudgetModal(props) {
  const { theme, darkMode, monthlyBudget, setMonthlyBudget, expenseCategories, setShowBudgetModal } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>月間予算設定</h2>
              <button onClick={() => setShowBudgetModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>月間収入予定</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyBudget.income}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setMonthlyBudget({ ...monthlyBudget, income: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{monthlyBudget.income.toLocaleString()}</p>
              </div>

              <div className="border-t pt-4" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>カテゴリ別予算</h3>
                <div className="space-y-3">
                  {Object.entries(monthlyBudget.expenses).map(([category, amount]) => (
                    <div key={category}>
                      <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                        {category}: ¥{amount.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200000"
                        step="5000"
                        value={amount}
                        onChange={(e) => {
                          setMonthlyBudget({
                            ...monthlyBudget,
                            expenses: {
                              ...monthlyBudget.expenses,
                              [category]: Number(e.target.value)
                            }
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${theme.textSecondary}`}>予算合計</span>
                  <span className={`text-sm font-bold ${theme.text} tabular-nums`}>
                    ¥{Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>計画余剰</span>
                  <span className={`text-sm font-bold tabular-nums`} style={{ 
                    color: (monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0)) >= 0 ? theme.green : theme.red 
                  }}>
                    ¥{(monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((sum, val) => sum + val, 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBudgetModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>


  );
}
