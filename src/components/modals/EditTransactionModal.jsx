import React from 'react';

export default function EditTransactionModal(props) {
  const { theme, darkMode, editingTransaction, setEditingTransaction, updateTransaction, deleteTransaction, expenseCategories, incomeCategories, creditCards } = props;

  return (
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setEditingTransaction(null)}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>
                {editingTransaction.isSettlement ? '💳 クレジット引き落とし' : '取引を編集'}
              </h2>
              <button onClick={() => setEditingTransaction(null)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
            </div>

            <div className="px-4 pb-8 pt-4">
              {/* 引き落とし予約：読み取り専用 */}
              {editingTransaction.isSettlement ? (
                <div className="space-y-3">
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold ${theme.textSecondary} mb-3 uppercase tracking-wide`}>引き落とし情報</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'カード', value: creditCards.find(c=>c.id===editingTransaction.cardId)?.name || 'カード' },
                        { label: '引き落とし日', value: editingTransaction.date },
                      ].map(({label, value}) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className={`text-sm ${theme.textSecondary}`}>{label}</span>
                          <span className={`text-sm font-semibold ${theme.text}`}>{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                        <span className={`text-sm ${theme.textSecondary}`}>金額</span>
                        <span className="text-xl font-black tabular-nums" style={{color:theme.red}}>¥{Math.abs(editingTransaction.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme.textSecondary}`}>状態</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${editingTransaction.settled ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-400'}`}>
                          {editingTransaction.settled ? '✓ 引き落とし済み' : '⏳ 予定'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs text-center leading-relaxed ${theme.textSecondary}`}>
                    引き落とし予約は元の取引から自動生成されます。<br/>金額を変更したい場合は元の取引を編集してください。
                  </p>
                  <button onClick={() => setEditingTransaction(null)} className={`w-full py-3 rounded-2xl font-bold ${darkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'}`}>閉じる</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 支出/収入 切替 */}
                  <div className="flex gap-2">
                    {[{type:'expense',label:'支出',color:theme.red},{type:'income',label:'収入',color:theme.green}].map(({type,label,color}) => (
                      <button key={type}
                        onClick={() => setEditingTransaction({...editingTransaction, type, amount: type==='expense' ? -Math.abs(editingTransaction.amount) : Math.abs(editingTransaction.amount)})}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                        style={{
                          backgroundColor: editingTransaction.type === type ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                          color: editingTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 金額（大きく） */}
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>金額</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black`} style={{ color: editingTransaction.type === 'income' ? theme.green : theme.red }}>¥</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={Math.abs(editingTransaction.amount) || ''}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          setEditingTransaction({...editingTransaction, amount: editingTransaction.type==='expense' ? -Number(v) : Number(v)});
                        }}
                        placeholder="0"
                        className={`flex-1 text-3xl font-black tabular-nums bg-transparent focus:outline-none`}
                        style={{ color: editingTransaction.type === 'income' ? theme.green : theme.red }}
                      />
                    </div>
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>カテゴリ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(editingTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <button key={cat}
                          onClick={() => setEditingTransaction({...editingTransaction, category: cat})}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: editingTransaction.category === cat ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                            color: editingTransaction.category === cat ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 支払方法（支出のみ） */}
                  {editingTransaction.type === 'expense' && !editingTransaction.isRecurring && (
                    <div>
                      <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>支払方法</p>
                      <div className="flex gap-2">
                        {[{key:'credit',label:'💳 クレジット'},{key:'cash',label:'💵 現金'}].map(({key,label}) => (
                          <button key={key}
                            onClick={() => setEditingTransaction({...editingTransaction, paymentMethod: key, cardId: key==='credit' ? (editingTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null})}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: editingTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                              color: editingTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {editingTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                        <select
                          value={editingTransaction.cardId || ''}
                          onChange={e => setEditingTransaction({...editingTransaction, cardId: e.target.value})}
                          className={`w-full mt-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'} focus:outline-none`}
                          style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                        >
                          {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* 日付 */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>日付</p>
                    <input
                      type="date"
                      value={editingTransaction.date}
                      onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'} focus:outline-none`}
                      style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    />
                  </div>

                  {/* メモ */}
                  <div>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>メモ（任意）</p>
                    <input
                      type="text"
                      placeholder="メモを入力..."
                      value={editingTransaction.memo || ''}
                      onChange={e => setEditingTransaction({...editingTransaction, memo: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-600' : 'bg-white border border-neutral-200 placeholder-neutral-400'} focus:outline-none`}
                    />
                  </div>

                  {/* 立替内訳（読み取り） */}
                  {editingTransaction?.isSplit && (
                    <div className={`rounded-2xl p-4 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                      <p className={`text-xs font-bold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>👥 立替払いの内訳</p>
                      <div className="space-y-2">
                        {(editingTransaction.splitMembers || []).map((m, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${theme.text}`}>{m.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.settled ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-400'}`}>
                                {m.settled ? '精算済' : '未回収'}
                              </span>
                            </div>
                            <span className="text-sm font-bold tabular-nums" style={{ color: m.settled ? theme.green : theme.accent }}>
                              ¥{Number(m.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className={`flex justify-between pt-2 border-t ${theme.border}`}>
                          <span className={`text-xs font-semibold ${theme.text}`}>立替合計</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>¥{(editingTransaction.splitAmount||0).toLocaleString()}</span>
                        </div>
                      </div>
                      {!editingTransaction?.splitSettled && (
                        <p className={`text-xs mt-2 ${theme.textSecondary}`}>⏳ ホームの「立替待ち」から人ごとに精算できます</p>
                      )}
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { deleteTransaction(editingTransaction.id); setEditingTransaction(null); }}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-white shrink-0"
                      style={{ backgroundColor: theme.red }}
                    >🗑️</button>
                    <button
                      onClick={() => updateTransaction(editingTransaction)}
                      className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                      style={{ backgroundColor: theme.accent }}
                    >変更を保存</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


  );
}
