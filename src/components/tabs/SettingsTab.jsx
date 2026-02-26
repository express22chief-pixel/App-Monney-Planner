import React from 'react';
import { Edit2 } from 'lucide-react';
import { RISK_PROFILES } from '../../hooks/useMoneyData';

function AccSection({ id, title, icon, children, expanded, onToggle, darkMode, theme }) {
  return (
    <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
      <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-4 py-3.5 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <span className={`text-sm font-semibold ${theme.text}`}>{title}</span>
        </div>
        <span
          className={`text-xs transition-transform duration-200 ${theme.textSecondary}`}
          style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >▼</span>
      </button>
      {expanded && (
        <div className={`px-4 pb-4 border-t ${theme.border} animate-fadeIn`}>{children}</div>
      )}
    </div>
  );
}

export default function SettingsTab(props) {
  const {
    theme, darkMode, setDarkMode,
    userInfo, setUserInfo,
    monthlyBudget, setMonthlyBudget,
    simulationSettings, setSimulationSettings,
    customCategories, setCustomCategories,
    expenseCategories, incomeCategories,
    creditCards, setCreditCards,
    recurringTransactions, setShowRecurringModal, setEditingRecurring,
    editingCategoryName, setEditingCategoryName,
    editingCategoryValue, setEditingCategoryValue,
    newCategoryName, setNewCategoryName,
    newCategoryType, setNewCategoryType,
    settingsExpanded, setSettingsExpanded,
    setShowCategoryModal, setShowCardModal, setEditingCard,
    resetAllData, applyRiskProfile,
    handleRenameDefaultCategory, handleDeleteDefaultCategory,
    deleteCustomCategory, deleteRecurring,
  } = props;

  return (
          <div className="space-y-2 animate-fadeIn pb-6">

            <AccSection id="appearance" icon="🌙" title="外観" expanded={settingsExpanded['appearance']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className={`text-sm font-semibold ${theme.text}`}>ダークモード</p>
                  <p className={`text-xs ${theme.textSecondary} mt-0.5`}>{darkMode ? 'ON' : 'OFF'}</p>
                </div>
                <button onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-neutral-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </AccSection>

            <AccSection id="profile" icon="👤" title="プロフィール" expanded={settingsExpanded['profile']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1.5`}>名前</label>
                  <input type="text" value={userInfo?.name || ''} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1.5`}>年齢</label>
                  <input type="number" value={userInfo?.age || ''} onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                </div>
              </div>
              {!userInfo?.age && (
                <p className={`text-xs mt-2 px-2 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  💡 年齢を設定すると資産タブで同世代比較が使えます
                </p>
              )}
            </AccSection>

            <AccSection id="budget" icon="📊" title="月間予算" expanded={settingsExpanded['budget']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-3 pt-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>月間収入予定</label>
                  <input type="text" inputMode="numeric" value={monthlyBudget.income}
                    onChange={(e) => setMonthlyBudget({ ...monthlyBudget, income: Number(e.target.value.replace(/[^0-9]/g, '')) })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{monthlyBudget.income.toLocaleString()}</p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <p className={`text-xs font-semibold ${theme.text} mb-2`}>カテゴリ別予算</p>
                  <div className="space-y-2">
                    {Object.entries(monthlyBudget.expenses).map(([category, amount]) => (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <label className={`text-xs font-medium ${theme.textSecondary}`}>{category}</label>
                          <span className={`text-xs font-bold tabular-nums ${theme.text}`}>¥{amount.toLocaleString()}</span>
                        </div>
                        <input type="range" min="0" max="300000" step="5000" value={amount}
                          onChange={(e) => setMonthlyBudget({ ...monthlyBudget, expenses: { ...monthlyBudget.expenses, [category]: Number(e.target.value) } })}
                          className="w-full" style={{ accentColor: theme.accent }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-lg p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={theme.textSecondary}>予算合計支出</span>
                    <span className={`font-bold tabular-nums ${theme.text}`}>¥{Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={theme.textSecondary}>予算収支</span>
                    <span className="font-bold tabular-nums" style={{ color: monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0) >= 0 ? theme.green : theme.red }}>
                      ¥{(monthlyBudget.income - Object.values(monthlyBudget.expenses).reduce((a,b)=>a+b,0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </AccSection>

            <AccSection id="investment" icon="📈" title="積立・投資目標" expanded={settingsExpanded['investment']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-4 pt-3">
                {[
                  { key: 'targetAmount', label: '目標金額', min: 1000000, max: 500000000, step: 1000000, fmt: v => v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${(v/10000).toFixed(0)}万` },
                  { key: 'years', label: '運用期間', min: 1, max: 50, step: 1, fmt: v => `${v}年` },
                  { key: 'monthlySavings', label: '月々の貯金', min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'monthlyInvestment', label: '月々の積立投資', min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'returnRate', label: '想定利回り', min: 0, max: 15, step: 0.5, fmt: v => `${v}%` },
                  { key: 'savingsInterestRate', label: '預金金利', min: 0, max: 5, step: 0.1, fmt: v => `${v}%` },
                ].map(({ key, label, min, max, step, fmt }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-medium ${theme.textSecondary}`}>{label}</label>
                      <input
                        type="text" inputMode="decimal"
                        value={simulationSettings[key]}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                          if (!isNaN(v)) setSimulationSettings({ ...simulationSettings, [key]: Math.min(max, Math.max(min, v)) });
                        }}
                        className={`w-32 px-2.5 py-1.5 rounded-lg text-sm font-bold tabular-nums text-right ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
                      />
                    </div>
                    <input type="range" min={min} max={max} step={step} value={simulationSettings[key]}
                      onChange={(e) => setSimulationSettings({ ...simulationSettings, [key]: Number(e.target.value) })}
                      className="w-full" style={{ accentColor: theme.accent }} />
                    <p className={`text-[10px] text-right ${theme.textSecondary} -mt-0.5`}>{fmt(simulationSettings[key])}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <label className={`text-xs font-medium ${theme.text}`}>新NISA制度を利用</label>
                  <button onClick={() => setSimulationSettings({ ...simulationSettings, useNisa: !simulationSettings.useNisa })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulationSettings.useNisa ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${simulationSettings.useNisa ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {simulationSettings.useNisa && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-lg p-2 text-xs`}>
                    <p className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-medium`}>✓ NISA口座で運用（利益非課税）</p>
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="category" icon="🏷️" title="カテゴリ管理" expanded={settingsExpanded['category']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3">
                <div className="flex gap-2 mb-3">
                  {['expense', 'income'].map(type => (
                    <button key={type} onClick={() => setNewCategoryType(type)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ backgroundColor: newCategoryType === type ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'), color: newCategoryType === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373') }}>
                      {type === 'expense' ? '支出カテゴリ' : '収入カテゴリ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="新しいカテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <button onClick={() => {
                      if (!newCategoryName.trim()) return;
                      if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: [...prev.expense, newCategoryName.trim()] }));
                      else setCustomCategories(prev => ({ ...prev, income: [...prev.income, newCategoryName.trim()] }));
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>追加</button>
                </div>
                <div className="space-y-1">
                  {(newCategoryType === 'expense' ? expenseCategories : incomeCategories).map((cat, idx, arr) => {
                    const isDefault = (newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES).some(d => (newCategoryType === 'expense' ? renamedExp : renamedInc)[d] === cat || d === cat);
                    const origName = (newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES).find(d => (newCategoryType === 'expense' ? renamedExp : renamedInc)[d] === cat || d === cat) || cat;
                    return (
                      <div key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        <div className="flex flex-col gap-0.5 mr-1">
                          <button disabled={idx === 0} onClick={() => {
                            if (idx === 0) return;
                            const fullList = newCategoryType === 'expense' ? [...expenseCategories] : [...incomeCategories];
                            [fullList[idx-1], fullList[idx]] = [fullList[idx], fullList[idx-1]];
                            const defOrig = newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
                            const deleted = newCategoryType === 'expense' ? deletedExp : deletedInc;
                            const renamed = newCategoryType === 'expense' ? renamedExp : renamedInc;
                            const activeDefs = defOrig.filter(d => !deleted.includes(d)).map(d => renamed[d] || d);
                            const newCustom = fullList.filter(c => !activeDefs.includes(c));
                            const newOrder = fullList.filter(c => activeDefs.includes(c)).map(c => defOrig.find(d => (renamed[d]||d) === c) || c);
                            setCustomCategories(prev => ({ ...prev,
                              [newCategoryType]: newCustom,
                              orderedDefaults: { ...(prev.orderedDefaults||{}), [newCategoryType]: newOrder }
                            }));
                          }} className={`text-[10px] leading-none ${idx === 0 ? 'opacity-20' : (darkMode ? 'text-neutral-400' : 'text-neutral-500')}`}>▲</button>
                           <button disabled={idx === arr.length - 1} onClick={() => {
                            if (idx === arr.length - 1) return;
                            const fullList = newCategoryType === 'expense' ? [...expenseCategories] : [...incomeCategories];
                            [fullList[idx], fullList[idx+1]] = [fullList[idx+1], fullList[idx]];
                            const defOrig = newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
                            const deleted = newCategoryType === 'expense' ? deletedExp : deletedInc;
                            const renamed = newCategoryType === 'expense' ? renamedExp : renamedInc;
                            const activeDefs = defOrig.filter(d => !deleted.includes(d)).map(d => renamed[d] || d);
                            const newCustom = fullList.filter(c => !activeDefs.includes(c));
                            const newOrder = fullList.filter(c => activeDefs.includes(c)).map(c => defOrig.find(d => (renamed[d]||d) === c) || c);
                            setCustomCategories(prev => ({ ...prev,
                              [newCategoryType]: newCustom,
                              orderedDefaults: { ...(prev.orderedDefaults||{}), [newCategoryType]: newOrder }
                            }));
                          }} className={`text-[10px] leading-none ${idx === arr.length - 1 ? 'opacity-20' : (darkMode ? 'text-neutral-400' : 'text-neutral-500')}`}>▼</button>
                        </div>
                        <span className={`flex-1 text-xs font-medium ${theme.text}`}>{cat}</span>
                        <button onClick={() => {
                          const newName = prompt('カテゴリ名を変更', cat);
                          if (!newName || !newName.trim() || newName.trim() === cat) return;
                          if (isDefault) {
                            if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, renamedDefaults: { ...prev.renamedDefaults, expense: { ...prev.renamedDefaults.expense, [origName]: newName.trim() } } }));
                            else setCustomCategories(prev => ({ ...prev, renamedDefaults: { ...prev.renamedDefaults, income: { ...prev.renamedDefaults.income, [origName]: newName.trim() } } }));
                          } else {
                            if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: prev.expense.map(c => c === cat ? newName.trim() : c) }));
                            else setCustomCategories(prev => ({ ...prev, income: prev.income.map(c => c === cat ? newName.trim() : c) }));
                          }
                        }} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: darkMode ? '#3a3a3a' : '#e5e7eb', color: darkMode ? '#d4d4d4' : '#555' }}>✏️</button>
                        <button onClick={() => {
                          if (!confirm(cat + ' を削除しますか？')) return;
                          if (isDefault) {
                            if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, deletedDefaults: { ...prev.deletedDefaults, expense: [...prev.deletedDefaults.expense, origName] } }));
                            else setCustomCategories(prev => ({ ...prev, deletedDefaults: { ...prev.deletedDefaults, income: [...prev.deletedDefaults.income, origName] } }));
                          } else {
                            if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: prev.expense.filter(c => c !== cat) }));
                            else setCustomCategories(prev => ({ ...prev, income: prev.income.filter(c => c !== cat) }));
                          }
                        }} className="text-red-400 text-xs px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: darkMode ? '#3a2a2a' : '#fee2e2' }}>🗑️</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccSection>

            <AccSection id="creditcard" icon="💳" title="クレジットカード" expanded={settingsExpanded['creditcard']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3">
                <div className="flex justify-end mb-3">
                  <button onClick={() => { setEditingCard(null); setShowCardModal(true); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: theme.accent }}>+ 追加</button>
                </div>
                {creditCards.length === 0 ? (
                  <p className={`text-xs text-center py-3 ${theme.textSecondary}`}>クレジットカードが登録されていません</p>
                ) : (
                  <div className="space-y-2">
                    {creditCards.map(card => (
                      <div key={card.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{card.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>締め日: {card.closingDay}日 / 支払い: 翌{card.paymentMonth === 2 ? '々' : ''}月{card.paymentDay}日</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingCard(card); setShowCardModal(true); }} className="p-1.5 rounded-lg text-blue-500">✏️</button>
                          <button onClick={() => { if(confirm('削除しますか？')) setCreditCards(prev => prev.filter(c => c.id !== card.id)); }} className="p-1.5 rounded-lg text-red-500">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="data" icon="💾" title="データ管理" expanded={settingsExpanded['data']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="space-y-2 pt-3">
                <button
                  onClick={() => {
                    const data = { transactions, recurringTransactions, creditCards, monthlyBudget, simulationSettings, userInfo, assetData };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `money-planner-${new Date().toISOString().slice(0,10)}.json`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover-scale ${darkMode ? 'border-neutral-700 text-neutral-300' : 'border-neutral-200 text-neutral-600'}`}
                >
                  📤 データをエクスポート
                </button>


                <button
                  onClick={() => {
                    if (!confirm('全データをリセットしますか？この操作は取り消せません。')) return;
                    setTransactions([]); setRecurringTransactions([]); setMonthlyHistory({});
                    setAssetData({ savings: 0, investments: 0, nisa: 0, dryPowder: 0 });
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-red-500/30 text-red-500 transition-all hover-scale"
                >
                  🗑️ 全データをリセット
                </button>
              </div>
            </AccSection>

          </div>

  );
}
