import React from 'react';

export default function DateTransactionsModal(props) {
  const {
    theme, darkMode, selectedDate, setShowDateTransactionsModal, setSelectedDate,
    transactions, deleteTransaction, setEditingTransaction,
    creditCards, expenseCategories, incomeCategories,
  } = props;

  const getTransactionsForDay = (ym, day) => {
    const ds = ym + '-' + String(day).padStart(2, '0');
    return transactions.filter(t => t.date === ds);
  };

        const dayTxns = getTransactionsForDay(selectedDate.slice(0, 7), Number(selectedDate.slice(-2)));
        const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

  return (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => { setShowDateTransactionsModal(false); setSelectedDate(null); }}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>

            {/* ヘッダー */}
            <div className={`sticky top-0 flex items-center justify-between px-5 pt-5 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
              <div>
                <p className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-widest`}>履歴</p>
                <h2 className={`text-lg font-bold ${theme.text}`}>{dateLabel}</h2>
              </div>
              <button onClick={() => { setShowDateTransactionsModal(false); setSelectedDate(null); }}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>
                ✕
              </button>
            </div>

            <div className="px-5 pb-8 pt-4 space-y-4">

              {/* 既存の取引一覧 */}
              {(() => {
                if (dayTxns.length === 0) return (
                  <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>この日の取引はありません</p>
                );

                // isSettlement取引をcardId別にグループ化
                const settlementGroups = {};
                const normalTxns = [];
                dayTxns.forEach(t => {
                  if (t.isSettlement) {
                    const key = t.cardId || 'default';
                    if (!settlementGroups[key]) {
                      const card = creditCards.find(c => c.id === t.cardId);
                      settlementGroups[key] = { cardName: card ? card.name : 'カード', total: 0, items: [], settled: t.settled };
                    }
                    settlementGroups[key].total += Math.abs(t.amount);
                    settlementGroups[key].items.push(t);
                  } else {
                    normalTxns.push(t);
                  }
                });

                const settlementRows = Object.entries(settlementGroups).map(([key, g]) => ({ key, ...g }));

                return (
                  <div className="space-y-2">
                    {/* クレジット引き落とし（グループ化） */}
                    {settlementRows.map(g => {
                      const groupKey = `settle-${g.key}`;
                      const isExpanded = !!expandedCreditGroups[groupKey];
                      const canExpand = g.items.length > 1;
                      return (
                        <div key={g.key} className={`rounded-xl overflow-hidden ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                          <div
                            className={`flex items-center justify-between p-3 ${canExpand ? 'cursor-pointer' : ''}`}
                            onClick={() => canExpand && setExpandedCreditGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${darkMode ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
                                💳
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-sm font-semibold ${theme.text}`}>クレジット引き落とし</p>
                                  {canExpand && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                                      {g.items.length}件
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] ${theme.textSecondary}`}>{g.cardName}</span>
                                  {!g.settled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: theme.orange, color: '#000' }}>引落予定</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                                ¥{g.total.toLocaleString()}
                              </p>
                              {canExpand && (
                                <span className={`text-xs ${theme.textSecondary} transition-transform duration-200`} style={{ display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                              )}
                            </div>
                          </div>
                          {/* 内訳展開 */}
                          {canExpand && isExpanded && (
                            <div className="animate-fadeIn" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                              {g.items.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => { setEditingTransaction(t); setShowDateTransactionsModal(false); }}
                                  className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${darkMode ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'}`}
                                >
                                  <div className="flex-1 min-w-0 text-left pl-10">
                                    {(() => {
                                      // parentTransactionIdで元取引を参照してカテゴリ・メモを表示
                                      const parent = t.parentTransactionId
                                        ? transactions.find(p => p.id === t.parentTransactionId)
                                        : null;
                                      const label = parent ? parent.category : (t.category && !t.category.startsWith('クレ') ? t.category : null);
                                      const sub = parent ? parent.memo : t.memo;
                                      return (
                                        <>
                                          <p className={`text-xs font-medium truncate ${theme.text}`}>{label || '（詳細なし）'}</p>
                                          {sub && <p className={`text-[10px] truncate ${theme.textSecondary}`}>{sub}</p>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs font-bold tabular-nums shrink-0 ml-3" style={{ color: darkMode ? '#888' : '#aaa' }}>
                                    ¥{Math.abs(t.amount).toLocaleString()}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 通常の取引 */}
                    {normalTxns.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setEditingTransaction(t); setShowDateTransactionsModal(false); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover-scale ${
                          darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-50 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 text-left">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                            t.type==='income' ? (darkMode?'bg-green-500/15':'bg-green-50') :
                            t.paymentMethod==='credit' ? (darkMode?'bg-blue-500/15':'bg-blue-50') :
                            (darkMode?'bg-neutral-800':'bg-neutral-100')
                          }`}>
                            {t.isRecurring ? (t.isInvestment ? '📈' : '🔄') : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                              {t.isSplit && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${t.splitSettled ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'}`}>
                                  {t.splitSettled ? '👥精算済' : '👥立替'}
                                </span>
                              )}
                            </div>
                            {t.memo && <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>{t.memo}</p>}
                            {!t.settled && t.type === 'expense' && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block" style={{ backgroundColor: theme.orange, color: '#000' }}>
                                {t.paymentMethod === 'credit' ? '💳クレジット' : '予定'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isInvestment ? '#a855f7' : theme.red) }}>
                          {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* 区切り */}
              <div className={`border-t ${theme.border}`} />

              {/* この日に新規取引を追加するフォーム */}
              <div>
                <p className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-widest mb-3`}>この日に追加</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[
                      { type: 'expense', label: '支出', color: theme.red },
                      { type: 'income', label: '収入', color: theme.green },
                    ].map(({ type, label, color }) => (
                      <button key={type}
                        onClick={() => setNewTransaction({ ...newTransaction, type, date: selectedDate, paymentMethod: type === 'expense' ? 'credit' : undefined })}
                        className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                        style={{
                          backgroundColor: newTransaction.type === type ? color : (darkMode ? '#262626' : '#f5f5f5'),
                          color: newTransaction.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {newTransaction.type === 'expense' && (
                    <div className="flex gap-2">
                      {[{ key: 'credit', label: '💳 クレジット' }, { key: 'cash', label: '💵 現金' }].map(({ key, label }) => (
                        <button key={key}
                          onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: key, cardId: key === 'credit' ? (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: newTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f0f0f0'),
                            color: newTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {newTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {creditCards.map(card => (
                        <button key={card.id}
                          onClick={() => setNewTransaction({ ...newTransaction, cardId: card.id })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                            color: (newTransaction.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373')
                          }}>
                          {card.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input type="text" inputMode="numeric" placeholder="金額"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value.replace(/[^0-9]/g, '') })}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                    <select value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                      <option value="">カテゴリ</option>
                      {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <input type="text" placeholder="メモ（任意）"
                    value={newTransaction.memo}
                    onChange={(e) => setNewTransaction({ ...newTransaction, memo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-200 placeholder-neutral-400'} focus:outline-none`} />

                  <button
                    onClick={() => {
                      if (!newTransaction.amount || !newTransaction.category) return;
                      const amt = newTransaction.type === 'expense'
                        ? -Math.abs(Number(newTransaction.amount))
                        : Math.abs(Number(newTransaction.amount));
                      const t = {
                        id: Date.now(),
                        date: selectedDate,
                        category: newTransaction.category,
                        memo: newTransaction.memo || '',
                        amount: amt,
                        type: newTransaction.type,
                        paymentMethod: newTransaction.type === 'income' ? undefined : newTransaction.paymentMethod,
                        settled: newTransaction.type === 'income' ? true : (newTransaction.paymentMethod === 'cash'),
                        isSettlement: false,
                        isSplit: false,
                        splitAmount: 0,
                        splitMembers: []
                      };
                      if (newTransaction.type === 'expense' && newTransaction.paymentMethod === 'credit') {
                        const cardId = newTransaction.cardId || (creditCards[0] ? creditCards[0].id : null);
                        const card = creditCards.find(c => c.id === cardId);
                        const settlementDate = getSettlementDate(selectedDate, cardId);
                        const settlementTx = {
                          id: Date.now() + 1,
                          date: settlementDate.getFullYear() + '-' + String(settlementDate.getMonth()+1).padStart(2,'0') + '-' + String(settlementDate.getDate()).padStart(2,'0'),
                          category: 'クレジット引き落とし' + (card ? '（' + card.name + '）' : ''),
                          amount: amt,
                          type: 'expense',
                          paymentMethod: 'cash',
                          settled: settlementDate <= new Date(),
                          isSettlement: true,
                          parentTransactionId: t.id,
                          cardId: cardId
                        };
                        setTransactions([{ ...t, cardId }, settlementTx, ...transactions]);
                      } else {
                        setTransactions([t, ...transactions]);
                      }
                      setNewTransaction({ amount: '', category: '', type: 'expense', paymentMethod: 'credit', date: new Date().toISOString().slice(0, 10), memo: '', isSplit: false, splitMembers: [] });
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-white transition-all hover-scale"
                    style={{ backgroundColor: theme.accent }}>
                    追加する
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

  );
}
