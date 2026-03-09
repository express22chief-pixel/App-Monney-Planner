import React, { useState } from 'react';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../../constants';
import { Edit2 } from 'lucide-react';
import { RISK_PROFILES } from '../../hooks/useMoneyData';
import InlineDialog from '../modals/InlineDialog';

// -- プレミアムスライダー ----------------------------------------------------
function PremiumSlider({ value, min, max, step, onChange, accent, darkMode }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="relative" style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
      <div className="absolute w-full rounded-full" style={{ height: '4px', backgroundColor: darkMode ? '#3a3a3a' : '#e5e7eb' }} />
      <div className="absolute rounded-full" style={{ height: '4px', width: `${pct}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})` }} />
      <div className="absolute rounded-full" style={{
        width: '20px', height: '20px',
        left: `calc(${pct}% - 10px)`,
        background: `radial-gradient(circle at 38% 38%, #ffffff, ${accent}cc)`,
        boxShadow: `0 2px 8px ${accent}55, 0 1px 4px rgba(0,0,0,0.25)`,
        border: `2.5px solid ${accent}`,
        pointerEvents: 'none',
      }} />
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', width: '100%', height: '28px', opacity: 0, cursor: 'pointer', margin: 0 }}
      />
    </div>
  );
}

function AccSection({ id, title, icon, children, expanded, onToggle, darkMode, theme }) {
  return (
    <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>
      <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-4 py-3.5 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }} className={theme.text}>{title}</span>
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
    assetData, setAssetData,
    monthlyBudget, setMonthlyBudget,
    simulationSettings, setSimulationSettings,
    customCategories, setCustomCategories,
    expenseCategories, incomeCategories,
    creditCards, setCreditCards,
    recurringTransactions, setRecurringTransactions, setShowRecurringModal, setEditingRecurring,
    editingCategoryName, setEditingCategoryName,
    editingCategoryValue, setEditingCategoryValue,
    newCategoryName, setNewCategoryName,
    newCategoryType, setNewCategoryType,
    settingsExpanded, setSettingsExpanded,
    setShowCategoryModal, setShowCardModal, setEditingCard,
    wallets, setWallets,
    walletBalances,
    walletAdjustments, setWalletAdjustments,
    resetAllData, applyRiskProfile,
    handleRenameDefaultCategory, handleDeleteDefaultCategory,
    deleteCustomCategory, deleteRecurring,
    transactions, setTransactions, setMonthlyHistory,
    lifePlan,
  } = props;

  // -- インラインダイアログ state ----------------------------------------
  const [dialog, setDialog] = useState(null); // { type, title, message, defaultValue, onConfirm, danger }
  const closeDialog = () => setDialog(null);

  const deletedExp = customCategories?.deletedDefaults?.expense || [];
  const deletedInc = customCategories?.deletedDefaults?.income || [];
  const renamedExp = customCategories?.renamedDefaults?.expense || {};
  const renamedInc = customCategories?.renamedDefaults?.income || {};

  return (
    <>
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
                    className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1.5`}>年齢</label>
                  <input type="number" value={userInfo?.age || ''} onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
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
                    className={`w-full px-3 py-2.5 rounded-lg text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
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
                        <PremiumSlider
                          value={amount} min={0} max={300000} step={5000}
                          onChange={(v) => setMonthlyBudget({ ...monthlyBudget, expenses: { ...monthlyBudget.expenses, [category]: v } })}
                          accent={theme.accent} darkMode={darkMode}
                        />
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
                  { key: 'monthlySavings',      label: '月々の貯金',     min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'monthlyInvestment',   label: '月々の積立投資', min: 0, max: 2000000, step: 10000, fmt: v => `¥${v.toLocaleString()}` },
                  { key: 'returnRate',          label: '想定利回り',     min: 0, max: 15,      step: 0.5,   fmt: v => `${v}%` },
                  { key: 'savingsInterestRate', label: '預金金利',       min: 0, max: 5,       step: 0.1,   fmt: v => `${v}%` },
                  { key: 'inflationRate',       label: 'インフレ率',     min: 0, max: 5,       step: 0.5,   fmt: v => v === 0 ? '考慮しない' : `${v}%/年` },
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
                    <PremiumSlider
                      value={simulationSettings[key]} min={min} max={max} step={step}
                      onChange={(v) => setSimulationSettings({ ...simulationSettings, [key]: v })}
                      accent={theme.accent} darkMode={darkMode}
                    />
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

                {simulationSettings.useNisa && (
                  <div className={`pt-2 border-t space-y-3`} style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-medium ${theme.text}`}>🌱 NISA成長投資枠を使う</label>
                      <button
                        onClick={() => setSimulationSettings({ ...simulationSettings, useLumpSum: !simulationSettings.useLumpSum })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulationSettings.useLumpSum ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${simulationSettings.useLumpSum ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {simulationSettings.useLumpSum && (
                      <div className="space-y-3">

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-medium ${theme.text}`}>1回あたりの投資額</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color: theme.accent }}>
                              ¥{(simulationSettings.lumpSumAmount || 500000).toLocaleString()}
                            </span>
                          </div>
                          <PremiumSlider
                            value={simulationSettings.lumpSumAmount || 500000}
                            min={100000} max={2400000} step={100000}
                            onChange={(v) => setSimulationSettings({ ...simulationSettings, lumpSumAmount: v })}
                            accent={theme.accent} darkMode={darkMode}
                          />
                          <p className={`text-[10px] text-right ${theme.textSecondary} -mt-0.5`}>
                            年間上限: ¥2,400,000
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs font-medium ${theme.text} mb-2`}>投資する月</p>
                          <div className="grid grid-cols-6 gap-1">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => {
                              const months = simulationSettings.lumpSumMonths || [];
                              const selected = months.includes(month);
                              return (
                                <button
                                  key={month}
                                  onClick={() => {
                                    const current = simulationSettings.lumpSumMonths || [];
                                    const updated = selected
                                      ? current.filter(m => m !== month)
                                      : [...current, month].sort((a, b) => a - b);
                                    setSimulationSettings({ ...simulationSettings, lumpSumMonths: updated });
                                  }}
                                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all`}
                                  style={{
                                    backgroundColor: selected ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                                    color: selected ? '#fff' : (darkMode ? '#a3a3a3' : '#737373'),
                                  }}
                                >
                                  {month}月
                                </button>
                              );
                            })}
                          </div>
                          {(simulationSettings.lumpSumMonths || []).length > 0 && (
                            <p className={`text-[10px] ${theme.textSecondary} mt-1`}>
                              年間合計: ¥{((simulationSettings.lumpSumAmount || 500000) * (simulationSettings.lumpSumMonths || []).length).toLocaleString()}
                              （上限240万円）
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="withdrawal" icon="📉" title="老後・取り崩し設定" expanded={settingsExpanded['withdrawal']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3 space-y-3">
                <div className={`rounded-lg p-4 ${darkMode ? 'bg-neutral-800' : 'bg-blue-50'}`}>
                  <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>💡 シミュレーションタブで設定できます</p>
                  <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-blue-600'}`}>
                    老後の収支・取り崩し・年金・リタイア年齢は<br/>
                    シミュレーション → ライフプランの前提「編集」から設定してください。
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-xs space-y-1.5 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  {[
                    ['リタイア年齢', `${lifePlan.retirementAge}歳`],
                    ['想定寿命',     `${lifePlan.lifeExpectancy}歳`],
                    ['老後月収（年金等）', `¥${lifePlan.retirementMonthlyIncome.toLocaleString()}`],
                    ['老後月間支出', `¥${lifePlan.retirementMonthlyExpense.toLocaleString()}`],
                    ['老後月間収支', (() => { const cf = lifePlan.retirementMonthlyIncome - lifePlan.retirementMonthlyExpense; return (cf >= 0 ? '+' : '') + '¥' + cf.toLocaleString(); })()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className={theme.textSecondary}>{k}</span>
                      <span className={`font-bold tabular-nums ${theme.text}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AccSection>

            <AccSection id="category" icon="🏷️" title="カテゴリ管理" expanded={settingsExpanded['category']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3">
                <div className="flex gap-2 mb-3">
                  {['expense', 'income'].map(type => (
                    <button key={type} onClick={() => setNewCategoryType(type)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ backgroundColor: newCategoryType === type ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'), color: newCategoryType === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373') }}>
                      {type === 'expense' ? '支出カテゴリ' : '収入カテゴリ'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="新しいカテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <button onClick={() => {
                      if (!newCategoryName.trim()) return;
                      if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: [...prev.expense, newCategoryName.trim()] }));
                      else setCustomCategories(prev => ({ ...prev, income: [...prev.income, newCategoryName.trim()] }));
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>追加</button>
                </div>
                <div className="space-y-1">
                  {(newCategoryType === 'expense' ? expenseCategories : incomeCategories).map((cat, idx, arr) => {
                    const isDefault = (newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES).some(d => (newCategoryType === 'expense' ? renamedExp : renamedInc)[d] === cat || d === cat);
                    const origName = (newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES).find(d => (newCategoryType === 'expense' ? renamedExp : renamedInc)[d] === cat || d === cat) || cat;
                    return (
                      <div key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
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
                          setDialog({
                            type: 'input', title: 'カテゴリ名を変更',
                            message: '新しいカテゴリ名を入力してください',
                            defaultValue: cat,
                            confirmLabel: '変更',
                            onConfirm: (newName) => {
                              if (!newName || !newName.trim() || newName.trim() === cat) { closeDialog(); return; }
                              if (isDefault) {
                                if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, renamedDefaults: { ...prev.renamedDefaults, expense: { ...prev.renamedDefaults.expense, [origName]: newName.trim() } } }));
                                else setCustomCategories(prev => ({ ...prev, renamedDefaults: { ...prev.renamedDefaults, income: { ...prev.renamedDefaults.income, [origName]: newName.trim() } } }));
                              } else {
                                if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: prev.expense.map(c => c === cat ? newName.trim() : c) }));
                                else setCustomCategories(prev => ({ ...prev, income: prev.income.map(c => c === cat ? newName.trim() : c) }));
                              }
                              closeDialog();
                            },
                          });
                        }} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: darkMode ? '#3a3a3a' : '#e5e7eb', color: darkMode ? '#d4d4d4' : '#555' }}>✏️</button>
                        <button onClick={() => {
                          setDialog({
                            type: 'confirm', title: 'カテゴリを削除',
                            message: cat + ' を削除しますか？',
                            confirmLabel: '削除', danger: true,
                            onConfirm: () => {
                              if (isDefault) {
                                if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, deletedDefaults: { ...prev.deletedDefaults, expense: [...prev.deletedDefaults.expense, origName] } }));
                                else setCustomCategories(prev => ({ ...prev, deletedDefaults: { ...prev.deletedDefaults, income: [...prev.deletedDefaults.income, origName] } }));
                              } else {
                                if (newCategoryType === 'expense') setCustomCategories(prev => ({ ...prev, expense: prev.expense.filter(c => c !== cat) }));
                                else setCustomCategories(prev => ({ ...prev, income: prev.income.filter(c => c !== cat) }));
                              }
                              closeDialog();
                            },
                          });
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
                      <div key={card.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{card.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>締め日: {card.closingDay}日 / 支払い: 翌{card.paymentMonth === 2 ? '々' : ''}月{card.paymentDay}日</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingCard(card); setShowCardModal(true); }} className="p-1.5 rounded-lg text-blue-500">✏️</button>
                          <button onClick={() => setDialog({
                            type: 'confirm', title: 'カードを削除',
                            message: `「${card.name}」を削除しますか？`,
                            confirmLabel: '削除', danger: true,
                            onConfirm: () => { setCreditCards(prev => prev.filter(c => c.id !== card.id)); closeDialog(); },
                          })} className="p-1.5 rounded-lg text-red-500">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccSection>

            <AccSection id="wallet" icon="👛" title="電子マネー・残高" expanded={settingsExpanded['wallet']} onToggle={(id) => setSettingsExpanded(prev => ({...prev, [id]: !prev[id]}))}
              darkMode={darkMode} theme={theme}>
              <div className="pt-3 space-y-3">

                <div className="space-y-2">
                  {(wallets || []).map(w => (
                    <div key={w.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: (w.color || '#888') + '22' }}>
                          {w.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${theme.text}`}>{w.name}</p>
                          <p className="text-xs font-bold tabular-nums" style={{ color: (walletBalances?.[String(w.id)] || 0) < 0 ? theme.red : theme.accent }}>
                            ¥{(walletBalances?.[String(w.id)] || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const wid = String(w.id);
                            const bal = walletBalances?.[wid] || 0;
                            const adj = walletAdjustments?.[wid] || 0;
                            const txTotal = bal - adj;
                            setDialog({
                              type: 'input',
                              title: `${w.name} の残高を修正`,
                              message: '現在の実際の残高を入力してください',
                              defaultValue: String(bal),
                              onConfirm: (input) => {
                                const newBal = Number(String(input).replace(/[^0-9-]/g, ''));
                                if (!isNaN(newBal)) {
                                  setWalletAdjustments(prev => ({ ...prev, [wid]: newBal - txTotal }));
                                }
                                closeDialog();
                              },
                            });
                          }}
                          className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-600'}`}
                        >修正</button>
                        <button
                          onClick={() => setDialog({
                            type: 'confirm',
                            title: '電子マネーを削除',
                            message: `「${w.name}」を削除しますか？`,
                            confirmLabel: '削除',
                            danger: true,
                            onConfirm: () => { setWallets(prev => prev.filter(x => x.id !== w.id)); closeDialog(); },
                          })}
                          className="p-1.5 rounded-lg text-red-500">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {(!wallets || wallets.length === 0) && (
                    <p className={`text-xs text-center py-3 ${theme.textSecondary}`}>電子マネーが登録されていません</p>
                  )}
                </div>

                {(() => {
                  const PRESETS = [
                    { name: 'PayPay残高', icon: '🔴', color: '#FF4B4B' },
                    { name: 'Suica',     icon: '🚃', color: '#00A855' },
                    { name: 'PASMO',     icon: '🟣', color: '#6C3BA5' },
                    { name: 'nanaco',    icon: '🟡', color: '#F5A623' },
                    { name: 'WAON',      icon: '🔵', color: '#0070CC' },
                    { name: '楽天Edy',   icon: '❤️', color: '#BF0000' },
                    { name: 'iD',        icon: '💜', color: '#7C3AED' },
                    { name: 'QUICPay',  icon: '🟠', color: '#EA580C' },
                  ];
                  const existing = new Set((wallets || []).map(w => w.name));
                  const available = PRESETS.filter(p => !existing.has(p.name));
                  return (
                    <div className="space-y-3">

                      {available.length > 0 && (
                        <div>
                          <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>プリセットから追加</p>
                          <div className="flex flex-wrap gap-1.5">
                            {available.map(p => (
                              <button key={p.name}
                                onClick={() => setWallets(prev => [...(prev || []), { id: Date.now(), name: p.name, icon: p.icon, color: p.color }])}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}
                              >{p.icon} {p.name}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>カスタムで追加</p>
                        <div className="flex gap-2">
                          <input type="text" id="wallet-icon-input" placeholder="絵文字" maxLength={2}
                            className={`w-14 px-2 py-2 rounded-lg text-center text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                          <input type="text" id="wallet-name-input" placeholder="名前（例: au PAY）"
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                          <input type="color" id="wallet-color-input" defaultValue="#6366f1"
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                        </div>
                        <button
                          onClick={() => {
                            const icon = document.getElementById('wallet-icon-input').value.trim() || '💳';
                            const name = document.getElementById('wallet-name-input').value.trim();
                            const color = document.getElementById('wallet-color-input').value;
                            if (!name) { setDialog({ type: 'confirm', title: '入力エラー', message: '名前を入力してください', confirmLabel: 'OK', onConfirm: closeDialog }); return; }
                            if ((wallets || []).some(w => w.name === name)) { setDialog({ type: 'confirm', title: '入力エラー', message: '同じ名前のウォレットが既にあります', confirmLabel: 'OK', onConfirm: closeDialog }); return; }
                            setWallets(prev => [...(prev || []), { id: Date.now(), name, icon, color }]);
                            document.getElementById('wallet-icon-input').value = '';
                            document.getElementById('wallet-name-input').value = '';
                          }}
                          className="w-full mt-2 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: theme.accent }}
                        >＋ 追加する</button>
                      </div>
                    </div>
                  );
                })()}
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
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold border-2 transition-all hover-scale ${darkMode ? 'border-neutral-700 text-neutral-300' : 'border-neutral-200 text-neutral-600'}`}
                >
                  📤 データをエクスポート
                </button>

                <button
                  onClick={() => setDialog({
                    type: 'confirm',
                    title: 'データを全削除',
                    message: '全てのデータをリセットしますか？この操作は取り消せません。',
                    confirmLabel: '削除する',
                    danger: true,
                    onConfirm: () => {
                      closeDialog();
                      setTransactions([]); setRecurringTransactions([]); setMonthlyHistory({});
                      setAssetData({ savings: 0, investments: 0, nisa: 0, dryPowder: 0 });
                    },
                  })}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-red-500/30 text-red-500 transition-all hover-scale"
                >
                  🗑️ 全データをリセット
                </button>
              </div>
            </AccSection>

          </div>

      {dialog && (
        <InlineDialog
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          defaultValue={dialog.defaultValue}
          confirmLabel={dialog.confirmLabel}
          danger={dialog.danger}
          onConfirm={dialog.onConfirm}
          onCancel={closeDialog}
          darkMode={darkMode}
          theme={theme}
        />
      )}

    </>
  );
}
