import React from 'react';

export default function AddTransactionModal(props) {
  const { theme, darkMode, newTransaction, setNewTransaction, addTransaction, setShowAddTransaction, expenseCategories, incomeCategories, creditCards, transactions } = props;

  return (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowAddTransaction(false)}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>取引を追加</h2>
              <button onClick={() => setShowAddTransaction(false)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
            </div>
            <div className="px-4 pb-8 pt-4">
              <div className="space-y-2">
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide`}>取引を追加</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[
                    { type: 'expense', label: '支出', color: theme.red },
                    { type: 'income', label: '収入', color: theme.green },
                  ].map(({ type, label, color }) => (
                    <button key={type}
                      onClick={() => setNewTransaction({ ...newTransaction, type, paymentMethod: type === 'expense' ? 'credit' : undefined })}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-200`}
                      style={{
                        backgroundColor: newTransaction.type === type ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                        color: newTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        transform: newTransaction.type === type ? 'scale(1.02)' : 'scale(1)',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                {newTransaction.type === 'expense' && (
                  <>
                    <div className="flex gap-2">
                      {[
                        { key: 'credit', label: '💳 クレジット' },
                        { key: 'cash', label: '💵 現金' },
                      ].map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: key, cardId: key === 'credit' ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200`}
                          style={{
                            backgroundColor: newTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#262626' : '#f0f0f0'),
                            color: newTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {newTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {creditCards.map(card => (
                          <button key={card.id}
                            onClick={() => setNewTransaction({ ...newTransaction, cardId: card.id })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all`}
                            style={{
                              backgroundColor: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                              color: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                            }}>
                            {card.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 金額入力（大きく） */}
                <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-neutral-800/80 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-1`}>金額</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${theme.textSecondary}`}>¥</span>
                    <input type="text" inputMode="numeric" placeholder="0"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value.replace(/[^0-9]/g, '') })}
                      className={`flex-1 bg-transparent text-2xl font-bold tabular-nums ${theme.text} focus:outline-none placeholder-neutral-500`}
                      style={{ minWidth: 0 }}
                    />
                    {newTransaction.amount && (
                      <button onClick={() => setNewTransaction({...newTransaction, amount: ''})}
                        className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>✕</button>
                    )}
                  </div>
                  {newTransaction.amount && (
                    <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                      {Number(newTransaction.amount).toLocaleString()} 円
                    </p>
                  )}
                </div>
                {/* 日付選択 */}
                <input type="date" value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl appearance-none ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }} />

                <select value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                  <option value="">カテゴリを選択</option>
                  {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <textarea
                  rows={2}
                  placeholder="メモ（任意）"
                  value={newTransaction.memo}
                  onChange={(e) => setNewTransaction({ ...newTransaction, memo: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200 placeholder-neutral-400'
                  } focus:outline-none focus:border-blue-500`}
                ></textarea>

                {/* 立替あり トグル */}
                {newTransaction.type === 'expense' && (
                  <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                    <button
                      onClick={() => setNewTransaction({
                        ...newTransaction,
                        isSplit: !newTransaction.isSplit,
                        splitMembers: !newTransaction.isSplit ? [{ name: '', amount: '' }] : []
                      })}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all ${
                        newTransaction.isSplit
                          ? (darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                          : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-neutral-500')
                      }`}
                    >
                      <span>👥 複数人分を立替払い</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${newTransaction.isSplit ? 'bg-blue-500 text-white' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}>
                        {newTransaction.isSplit ? `${newTransaction.splitMembers.filter(m=>m.name||m.amount).length}人` : 'OFF'}
                      </span>
                    </button>

                    {newTransaction.isSplit && (
                      <div className={`px-3 pb-3 pt-2 space-y-2 ${darkMode ? 'bg-neutral-800/50' : 'bg-blue-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            立替分は回収するまでPLから除外されます。
                          </p>
                          {newTransaction.amount && newTransaction.splitMembers.length > 0 && (
                            <button
                              onClick={() => {
                                const total = Number(newTransaction.amount);
                                const n = newTransaction.splitMembers.length + 1; // 自分も含む
                                const perPerson = Math.floor(total / n);
                                setNewTransaction({
                                  ...newTransaction,
                                  splitMembers: newTransaction.splitMembers.map(m => ({ ...m, amount: String(perPerson) }))
                                });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}
                            >
                              ÷ 均等割り
                            </button>
                          )}
                        </div>

                        {/* 人ごとの入力行 */}
                        <div className="space-y-1.5">
                          {newTransaction.splitMembers.map((member, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder={`${idx+1}人目の名前`}
                                value={member.name}
                                onChange={(e) => {
                                  const updated = [...newTransaction.splitMembers];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setNewTransaction({ ...newTransaction, splitMembers: updated });
                                }}
                                className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="金額"
                                value={member.amount}
                                onChange={(e) => {
                                  const updated = [...newTransaction.splitMembers];
                                  updated[idx] = { ...updated[idx], amount: e.target.value.replace(/[^0-9]/g, '') };
                                  setNewTransaction({ ...newTransaction, splitMembers: updated });
                                }}
                                className={`w-24 px-2.5 py-1.5 rounded-lg text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                              />
                              {newTransaction.splitMembers.length > 1 && (
                                <button
                                  onClick={() => setNewTransaction({
                                    ...newTransaction,
                                    splitMembers: newTransaction.splitMembers.filter((_, i) => i !== idx)
                                  })}
                                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-500'}`}
                                >✕</button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 人を追加ボタン */}
                        <button
                          onClick={() => setNewTransaction({
                            ...newTransaction,
                            splitMembers: [...newTransaction.splitMembers, { name: '', amount: '' }]
                          })}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold border-dashed border-2 transition-all ${darkMode ? 'border-neutral-600 text-neutral-400 hover:border-blue-500 hover:text-blue-400' : 'border-neutral-300 text-neutral-400 hover:border-blue-400 hover:text-blue-500'}`}
                        >
                          ＋ 人を追加
                        </button>

                        {/* 内訳サマリー */}
                        {(() => {
                          const total = Number(newTransaction.amount) || 0;
                          const splitTotal = newTransaction.splitMembers.reduce((s, m) => s + (Number(m.amount) || 0), 0);
                          const mine = total - splitTotal;
                          if (total === 0) return null;
                          return (
                            <div className={`rounded-lg px-3 py-2 text-xs space-y-0.5 ${darkMode ? 'bg-neutral-900/60' : 'bg-white/80'}`}>
                              <div className="flex justify-between">
                                <span className={theme.textSecondary}>合計</span>
                                <span className={`font-bold tabular-nums ${theme.text}`}>¥{total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme.textSecondary}>立替合計（{newTransaction.splitMembers.filter(m=>Number(m.amount)>0).length}人）</span>
                                <span className="font-bold tabular-nums" style={{color: theme.accent}}>¥{splitTotal.toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between pt-1 border-t ${theme.border}`}>
                                <span className={`font-semibold ${theme.text}`}>自分の負担</span>
                                <span className={`font-bold tabular-nums`} style={{color: mine >= 0 ? theme.green : theme.red}}>¥{mine.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => { addTransaction(); if(newTransaction.amount && newTransaction.category) setShowAddTransaction(false); }}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}>
                  追加する
                </button>
              </div>

              </div>
            </div>
          </div>
        </div>
      )}


  );
}
