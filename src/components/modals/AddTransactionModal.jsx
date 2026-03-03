/**
 * AddTransactionModal.jsx
 * 取引追加モーダル。
 * - 支出 / 収入 / チャージ の3タイプに対応
 * - 支払方法: クレジット / 現金 / 電子マネー
 * - 立替払い対応
 * - 上部レイアウト整理（支出/収入タブ + 支払方法を1ブロックにまとめ）
 */
import React, { useState } from 'react';

export default function AddTransactionModal(props) {
  const {
    theme, darkMode,
    newTransaction, setNewTransaction,
    addTransaction, setShowAddTransaction,
    expenseCategories, incomeCategories,
    creditCards, wallets, addCharge,
    transactionTemplates, setTransactionTemplates, setShowTemplateModal,
  } = props;

  const [chargeMode, setChargeMode]         = useState(false);
  const [chargeWalletId, setChargeWalletId] = useState(wallets?.[0]?.id ? String(wallets[0].id) : '');
  const [chargeFrom, setChargeFrom]         = useState('cash');
  const [chargeCardId, setChargeCardId]     = useState(creditCards?.[0]?.id ? String(creditCards[0].id) : '');
  const [chargeAmount, setChargeAmount]     = useState('');
  const [chargeMemo, setChargeMemo]         = useState('');
  const [chargeDate, setChargeDate]         = useState(new Date().toISOString().slice(0, 10));

  const handleAddCharge = () => {
    if (!chargeAmount || !chargeWalletId) return;
    addCharge({ date: chargeDate, amount: chargeAmount, walletId: chargeWalletId, fromMethod: chargeFrom, fromCardId: chargeFrom === 'credit' ? chargeCardId : null, memo: chargeMemo });
    setShowAddTransaction(false);
  };

  const PAYMENT_METHODS = [
    { key: 'credit', label: '💳 クレジット' },
    { key: 'cash',   label: '💵 現金' },
    ...(wallets && wallets.length > 0 ? [{ key: 'wallet', label: '👛 電子マネー' }] : []),
  ];

  const inputBase = `w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none ${
    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
  }`;

  const isExpense = !chargeMode && newTransaction.type === 'expense';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowAddTransaction(false)}>
      <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
          <h2 className={`text-lg font-bold ${theme.text}`}>取引を追加</h2>
          <button onClick={() => setShowAddTransaction(false)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
        </div>

        <div className="px-4 pb-8 pt-4 space-y-3">

          {/* ━━ タイプ選択ブロック（支出/収入/チャージ + 支払方法を1枚のカードにまとめ） ━━ */}
          <div className={`rounded-2xl p-3 space-y-2.5 ${darkMode ? 'bg-neutral-800/60 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>

            {/* 支出 / 収入 / チャージ */}
            <div className="flex gap-1.5">
              {[
                { id: 'expense', label: '支出',       color: theme.red   },
                { id: 'income',  label: '収入',       color: theme.green },
                { id: 'charge',  label: '⚡ チャージ', color: '#FF9F0A'  },
              ].map(({ id, label, color }) => {
                const active = id === 'charge' ? chargeMode : (!chargeMode && newTransaction.type === id);
                return (
                  <button key={id}
                    onClick={() => {
                      if (id === 'charge') { setChargeMode(true); }
                      else { setChargeMode(false); setNewTransaction({ ...newTransaction, type: id, paymentMethod: id === 'expense' ? (newTransaction.paymentMethod || 'credit') : undefined }); }
                    }}
                    className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-200"
                    style={{ backgroundColor: active ? color : (darkMode ? '#2a2a2a' : '#e5e7eb'), color: active ? '#fff' : (darkMode ? '#888' : '#aaa'), transform: active ? 'scale(1.02)' : 'scale(1)' }}
                  >{label}</button>
                );
              })}
            </div>

            {/* 支払方法（支出のみ） */}
            {isExpense && (
              <>
                <div className={`h-px ${darkMode ? 'bg-neutral-700' : 'bg-neutral-200'}`} />
                <div className="flex gap-1.5">
                  {PAYMENT_METHODS.map(({ key, label }) => (
                    <button key={key}
                      onClick={() => setNewTransaction({ ...newTransaction, paymentMethod: key, cardId: key === 'credit' ? (newTransaction.cardId || (creditCards[0]?.id)) : null, walletId: key === 'wallet' ? (newTransaction.walletId || (wallets?.[0]?.id ? String(wallets[0].id) : null)) : null })}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ backgroundColor: newTransaction.paymentMethod === key ? theme.accent : (darkMode ? '#2a2a2a' : '#e5e7eb'), color: newTransaction.paymentMethod === key ? '#fff' : (darkMode ? '#888' : '#aaa') }}
                    >{label}</button>
                  ))}
                </div>

                {/* クレカ選択 */}
                {newTransaction.paymentMethod === 'credit' && creditCards.length >= 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {creditCards.map(card => (
                      <button key={card.id}
                        onClick={() => setNewTransaction({ ...newTransaction, cardId: card.id })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor: (newTransaction.cardId || creditCards[0]?.id) === card.id ? theme.accent : (darkMode ? '#333' : '#ddd'), color: (newTransaction.cardId || creditCards[0]?.id) === card.id ? '#fff' : (darkMode ? '#ccc' : '#555') }}
                      >{card.name}</button>
                    ))}
                  </div>
                )}

                {/* ウォレット選択 */}
                {newTransaction.paymentMethod === 'wallet' && wallets?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {wallets.map(w => (
                      <button key={w.id}
                        onClick={() => setNewTransaction({ ...newTransaction, walletId: String(w.id) })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor: (newTransaction.walletId || String(wallets[0]?.id)) === String(w.id) ? (w.color || theme.accent) : (darkMode ? '#333' : '#ddd'), color: (newTransaction.walletId || String(wallets[0]?.id)) === String(w.id) ? '#fff' : (darkMode ? '#ccc' : '#555') }}
                      >{w.icon} {w.name}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ━━━━━━ チャージモード ━━━━━━ */}
          {chargeMode && (
            <div className="space-y-2.5">
              <div>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>チャージ先</p>
                <div className="flex flex-wrap gap-1.5">
                  {(wallets || []).map(w => (
                    <button key={w.id} onClick={() => setChargeWalletId(String(w.id))}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ backgroundColor: String(chargeWalletId) === String(w.id) ? w.color || theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'), color: String(chargeWalletId) === String(w.id) ? '#fff' : (darkMode ? '#d4d4d4' : '#737373') }}
                    >{w.icon} {w.name}</button>
                  ))}
                </div>
                {wallets?.length === 0 && <p className={`text-xs ${theme.textSecondary}`}>設定 → 電子マネーでウォレットを追加してください</p>}
              </div>
              <div>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>チャージ元</p>
                <div className="flex gap-2">
                  {[{ key: 'cash', label: '💵 現金・銀行口座' }, { key: 'credit', label: '💳 クレジット' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setChargeFrom(key)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ backgroundColor: chargeFrom === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'), color: chargeFrom === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373') }}
                    >{label}</button>
                  ))}
                </div>
                {chargeFrom === 'credit' && creditCards.length >= 1 && (
                  <select value={chargeCardId} onChange={e => setChargeCardId(e.target.value)} className={`${inputBase} mt-2`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
                    {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                  </select>
                )}
              </div>
              <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-neutral-800/80 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-1`}>金額</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${theme.textSecondary}`}>¥</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={chargeAmount} onChange={e => setChargeAmount(e.target.value.replace(/[^0-9]/g, ''))} className={`flex-1 bg-transparent text-2xl font-bold tabular-nums ${theme.text} focus:outline-none`} style={{ color: '#FF9F0A' }} />
                </div>
              </div>
              <input type="date" value={chargeDate} onChange={e => setChargeDate(e.target.value)} className={inputBase} style={{ colorScheme: darkMode ? 'dark' : 'light' }} />
              <input type="text" placeholder="メモ（任意）" value={chargeMemo} onChange={e => setChargeMemo(e.target.value)} className={inputBase} />
              <button onClick={handleAddCharge} disabled={!chargeAmount || !chargeWalletId}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: (!chargeAmount || !chargeWalletId) ? (darkMode ? '#2a2a2a' : '#e5e7eb') : '#FF9F0A', color: (!chargeAmount || !chargeWalletId) ? (darkMode ? '#525252' : '#9ca3af') : '#fff' }}
              >⚡ チャージを記録する</button>
            </div>
          )}

          {/* ━━━━━━ 支出・収入モード ━━━━━━ */}
          {!chargeMode && (
            <div className="space-y-2">

              {/* 金額 */}
              <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-neutral-800/80 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'}`}>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-1`}>金額</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${theme.textSecondary}`}>¥</span>
                  <input type="text" inputMode="numeric" placeholder="0"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value.replace(/[^0-9]/g, '') })}
                    className={`flex-1 bg-transparent text-2xl font-bold tabular-nums ${theme.text} focus:outline-none placeholder-neutral-500`}
                    style={{ minWidth: 0, color: newTransaction.type === 'income' ? theme.green : theme.red }}
                  />
                  {newTransaction.amount && (
                    <button onClick={() => setNewTransaction({ ...newTransaction, amount: '' })} className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>✕</button>
                  )}
                </div>
                {newTransaction.amount && <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>{Number(newTransaction.amount).toLocaleString()} 円</p>}
              </div>

              {/* 日付 */}
              <input type="date" value={newTransaction.date} onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })} className={`${inputBase} appearance-none`} style={{ colorScheme: darkMode ? 'dark' : 'light' }} />

              {/* カテゴリ */}
              <select value={newTransaction.category} onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })} className={inputBase}>
                <option value="">カテゴリを選択</option>
                {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* メモ */}
              <textarea rows={2} placeholder="メモ（任意）" value={newTransaction.memo} onChange={e => setNewTransaction({ ...newTransaction, memo: e.target.value })} className={`${inputBase} resize-none`} />

              {/* 立替トグル（支出のみ） */}
              {newTransaction.type === 'expense' && (
                <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                  <button
                    onClick={() => setNewTransaction({ ...newTransaction, isSplit: !newTransaction.isSplit, splitMembers: !newTransaction.isSplit ? [{ name: '', amount: '' }] : [] })}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all ${newTransaction.isSplit ? (darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700') : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-neutral-500')}`}
                  >
                    <span>👥 複数人分を立替払い</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${newTransaction.isSplit ? 'bg-blue-500 text-white' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}>
                      {newTransaction.isSplit ? `${newTransaction.splitMembers.filter(m => m.name || m.amount).length}人` : 'OFF'}
                    </span>
                  </button>
                  {newTransaction.isSplit && (
                    <div className={`px-3 pb-3 pt-2 space-y-2 ${darkMode ? 'bg-neutral-800/50' : 'bg-blue-50/50'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>立替分は回収するまでPLから除外されます。</p>
                        {newTransaction.amount && newTransaction.splitMembers.length > 0 && (
                          <button onClick={() => { const total = Number(newTransaction.amount); const n = newTransaction.splitMembers.length + 1; const per = Math.floor(total / n); setNewTransaction({ ...newTransaction, splitMembers: newTransaction.splitMembers.map(m => ({ ...m, amount: String(per) })) }); }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>÷ 均等割り</button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {newTransaction.splitMembers.map((member, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <input type="text" placeholder={`${idx + 1}人目の名前`} value={member.name}
                              onChange={e => { const u = [...newTransaction.splitMembers]; u[idx] = { ...u[idx], name: e.target.value }; setNewTransaction({ ...newTransaction, splitMembers: u }); }}
                              className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`} />
                            <input type="text" inputMode="numeric" placeholder="金額" value={member.amount}
                              onChange={e => { const u = [...newTransaction.splitMembers]; u[idx] = { ...u[idx], amount: e.target.value.replace(/[^0-9]/g, '') }; setNewTransaction({ ...newTransaction, splitMembers: u }); }}
                              className={`w-24 px-2.5 py-1.5 rounded-lg text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`} />
                            {newTransaction.splitMembers.length > 1 && (
                              <button onClick={() => setNewTransaction({ ...newTransaction, splitMembers: newTransaction.splitMembers.filter((_, i) => i !== idx) })} className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-500'}`}>✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setNewTransaction({ ...newTransaction, splitMembers: [...newTransaction.splitMembers, { name: '', amount: '' }] })} className={`w-full py-1.5 rounded-lg text-xs font-semibold border-dashed border-2 ${darkMode ? 'border-neutral-600 text-neutral-400' : 'border-neutral-300 text-neutral-400'}`}>＋ 人を追加</button>
                      {(() => {
                        const total = Number(newTransaction.amount) || 0;
                        const splitTotal = newTransaction.splitMembers.reduce((s, m) => s + (Number(m.amount) || 0), 0);
                        if (total === 0) return null;
                        return (
                          <div className={`rounded-lg px-3 py-2 text-xs space-y-0.5 ${darkMode ? 'bg-neutral-900/60' : 'bg-white/80'}`}>
                            <div className="flex justify-between"><span className={theme.textSecondary}>合計</span><span className={`font-bold tabular-nums ${theme.text}`}>¥{total.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className={theme.textSecondary}>立替合計</span><span className="font-bold tabular-nums" style={{ color: theme.accent }}>¥{splitTotal.toLocaleString()}</span></div>
                            <div className={`flex justify-between pt-1 border-t ${theme.border}`}><span className={`font-semibold ${theme.text}`}>自分の負担</span><span className="font-bold tabular-nums" style={{ color: (total - splitTotal) >= 0 ? theme.green : theme.red }}>¥{(total - splitTotal).toLocaleString()}</span></div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* テンプレとして保存 */}
              {newTransaction.type === 'expense' && (
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <div>
                    <p className={`text-xs font-medium ${theme.text}`}>⚡ テンプレとして保存</p>
                    <p className={`text-[10px] ${theme.textSecondary}`}>次回からワンタップで入力できます</p>
                  </div>
                  <input type="checkbox" id="save-as-tpl" className="w-4 h-4 accent-blue-500" />
                </div>
              )}

              {/* 追加ボタン */}
              <button onClick={() => {
                const cb = document.getElementById('save-as-tpl');
                if (cb?.checked && newTransaction.category) {
                  setTransactionTemplates(prev => [...prev, {
                    id: Date.now(),
                    name: newTransaction.memo || newTransaction.category,
                    category: newTransaction.category,
                    amount: newTransaction.amount || '',
                    type: newTransaction.type,
                    paymentMethod: newTransaction.paymentMethod,
                    cardId: newTransaction.cardId,
                    walletId: newTransaction.walletId,
                    memo: newTransaction.memo || '',
                  }]);
                  if (cb) cb.checked = false;
                }
                addTransaction();
                if (newTransaction.amount && newTransaction.category) setShowAddTransaction(false);
              }} className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale" style={{ backgroundColor: theme.accent }}>追加する</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
