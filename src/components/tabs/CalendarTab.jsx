import React from 'react';
import { getDayBalance, getDaysInMonth, getFirstDayOfMonth, getTransactionsForDay } from '../../utils/calc';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CalendarTab(props) {
  const {
    theme, darkMode,
    selectedMonth, setSelectedMonth,
    transactions, setShowDateTransactionsModal, setSelectedDate,
    historySearch, setHistorySearch,
    historyCategory, setHistoryCategory,
    expenseCategories, incomeCategories,
    setEditingTransaction,
    monthlyHistory, calculateMonthlyBalance, currentMonth,
    getLast6MonthsTrend,
    openCloseMonthModal,
  } = props;
  const formatYM = (ym) => { const [y, m] = ym.split('-'); return `${y}年${parseInt(m)}月`; };

  const getDaysInMonth = (ym) => { const [y,m] = ym.split('-').map(Number); return new Date(y,m,0).getDate(); };
  const getFirstDayOfMonth = (ym) => { const [y,m] = ym.split('-').map(Number); return new Date(y,m-1,1).getDay(); };
  const getTransactionsForDay = (ym, day) => { const ds = ym+'-'+String(day).padStart(2,'0'); return transactions.filter(t=>t.date===ds); };
  const getDayBalance = (ym, day) => {
    const dayTxns = getTransactionsForDay(ym,day).filter(t=>!t.isSettlement);
    const income = dayTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const expense = Math.abs(dayTxns.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));
    return { income, expense, balance: income-expense };
  };

  return (
          <div className="space-y-3 animate-fadeIn">
            <div className={`${theme.cardGlass} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() - 1);
                    setSelectedMonth(date.toISOString().slice(0, 7));
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                >
                  <span className={theme.text}>◀</span>
                </button>
                <h2 className={`text-base font-semibold ${theme.text} tracking-tight`}>
                  {new Date(selectedMonth + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                </h2>
                <button
                  onClick={() => {
                    const date = new Date(selectedMonth + '-01');
                    date.setMonth(date.getMonth() + 1);
                    const nextMonth = date.toISOString().slice(0, 7);
                    setSelectedMonth(nextMonth);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 hover-scale ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                >
                  <span className={theme.text}>▶</span>
                </button>
              </div>

              
              <div className="flex flex-col gap-2 mb-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-neutral-800 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                  <span className={`text-xs ${theme.textSecondary}`}>🔍</span>
                  <input
                    type="text"
                    placeholder="キーワード検索..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    className={`flex-1 text-xs bg-transparent focus:outline-none ${theme.text}`}
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch('')} className={`text-xs ${theme.textSecondary}`}>✕</button>
                  )}
                </div>
                <select
                  value={historyCategory}
                  onChange={e => setHistoryCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none ${darkMode ? 'bg-neutral-800 border border-neutral-700 text-neutral-300' : 'bg-neutral-50 border border-neutral-200 text-neutral-700'}`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                >
                  <option value="all">全カテゴリ</option>
                  {[...expenseCategories, ...incomeCategories].filter((c,i,a)=>a.indexOf(c)===i).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>


              <div className="mb-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div key={day} className={`text-center text-xs font-semibold py-1 ${
                      i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : theme.textSecondary
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {[...Array(getFirstDayOfMonth(selectedMonth))].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  
                  {[...Array(getDaysInMonth(selectedMonth))].map((_, i) => {
                    const day = i + 1;
                    const dayTransactions = getTransactionsForDay(selectedMonth, day);
                    const dayBalance = getDayBalance(selectedMonth, day);
                    const hasTransactions = dayTransactions.length > 0;
                    const isToday = selectedMonth === new Date().toISOString().slice(0, 7) && day === new Date().getDate();
                    
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(`${selectedMonth}-${String(day).padStart(2, '0')}`);
                          setShowDateTransactionsModal(true);
                        }}
                        className={`aspect-square border rounded-lg p-1 transition-all duration-200 hover-scale cursor-pointer ${
                          isToday 
                            ? darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-30' : 'border-blue-500 bg-blue-50'
                            : hasTransactions
                              ? darkMode ? 'border-neutral-600 bg-neutral-800' : 'border-neutral-300 bg-neutral-50'
                              : darkMode ? 'border-neutral-800 hover:border-neutral-600' : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className={`text-xs font-semibold ${isToday ? 'text-blue-500' : theme.text}`}>
                          {day}
                        </div>
                        {hasTransactions && (
                          <div className="mt-0.5">
                            {dayBalance.income > 0 && (
                              <div className="text-[8px] leading-tight tabular-nums" style={{ color: theme.green }}>
                                +{(dayBalance.income / 1000).toFixed(0)}k
                              </div>
                            )}
                            {dayBalance.expense > 0 && (
                              <div className="text-[8px] leading-tight tabular-nums" style={{ color: theme.red }}>
                                -{(dayBalance.expense / 1000).toFixed(0)}k
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="text-center mb-2">
                  <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>PL（発生ベース）</div>
                  <div className="text-xl font-bold tabular-nums" style={{ 
                    color: calculateMonthlyBalance(selectedMonth).plBalance >= 0 ? theme.green : theme.red 
                  }}>
                    {calculateMonthlyBalance(selectedMonth).plBalance >= 0 ? '+' : ''}
                    ¥{calculateMonthlyBalance(selectedMonth).plBalance.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center border-t pt-2" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>収入</div>
                    <div className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>
                      ¥{calculateMonthlyBalance(selectedMonth).plIncome.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${theme.textSecondary} mb-1 font-medium`}>支出</div>
                    <div className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                      ¥{calculateMonthlyBalance(selectedMonth).plExpense.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
            {(historySearch || historyCategory !== 'all') && (() => {
              const filtered = transactions.filter(t => {
                const matchMonth = t.date.startsWith(selectedMonth);
                const matchCat = historyCategory === 'all' || t.category === historyCategory;
                const matchSearch = !historySearch || 
                  t.category?.includes(historySearch) || 
                  t.memo?.includes(historySearch) ||
                  String(Math.abs(t.amount)).includes(historySearch);
                return matchMonth && matchCat && matchSearch;
              });
              return (
                <div className={`${theme.cardGlass} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-sm font-semibold ${theme.text}`}>
                      検索結果
                      <span className={`ml-2 text-xs font-normal ${theme.textSecondary}`}>{filtered.length}件</span>
                    </h2>
                    <button
                      onClick={() => { setHistorySearch(''); setHistoryCategory('all'); }}
                      className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}
                    >クリア</button>
                  </div>
                  {filtered.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>該当する取引がありません</p>
                  ) : (
                    <div className="space-y-1">
                      {filtered.map(t => (
                        <div key={t.id}
                          onClick={() => setEditingTransaction(t)}
                          className={`flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all ${darkMode ? 'hover:bg-neutral-700/40' : 'hover:bg-neutral-50'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                            t.type === 'income' ? (darkMode ? 'bg-green-500/15' : 'bg-green-50') :
                            t.isSettlement ? (darkMode ? 'bg-orange-500/15' : 'bg-orange-50') :
                            t.paymentMethod === 'credit' ? (darkMode ? 'bg-blue-500/15' : 'bg-blue-50') :
                            (darkMode ? 'bg-neutral-800' : 'bg-neutral-100')
                          }`}>
                            {t.type === 'income' ? '💰' : t.isSettlement ? '💸' : t.paymentMethod === 'credit' ? '💳' : '💵'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                            <p className={`text-xs ${theme.textSecondary} truncate`}>{t.memo || t.date}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isSettlement ? theme.orange : theme.red) }}>
                              {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                            </p>
                            <p className={`text-[10px] ${theme.textSecondary}`}>{t.date.slice(5)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            
            {!monthlyHistory[selectedMonth] && calculateMonthlyBalance(selectedMonth).cfBalance !== 0 && selectedMonth < currentMonth && (
              <button
                onClick={() => openCloseMonthModal(selectedMonth)}
                className="w-full py-3 rounded-lg font-semibold text-white transition-all hover-scale flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.orange }}
              >
                ⚠ {formatYM(selectedMonth)}の収支を確定する
              </button>
            )}

            <div className={`${theme.cardGlass} rounded-lg p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>過去6ヶ月の推移（PL）</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getLast6MonthsTrend()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                  <XAxis 
                    dataKey="month" 
                    stroke={darkMode ? '#737373' : '#a3a3a3'} 
                    style={{ fontSize: '11px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke={darkMode ? '#737373' : '#a3a3a3'} 
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                  />
                  <Tooltip 
                    formatter={(value) => `¥${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#171717' : '#fff', 
                      border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, 
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: darkMode ? '#fff' : '#171717'
                    }}
                  />
                  <Bar dataKey="PL" fill={theme.accent} name="PL（発生）" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

  );
}
