/**
 * EditTransactionModal.jsx
 * 取引編集モーダル。
 * - 立替設定（追加・編集・精算）
 * - 日付欄はみ出し修正
 */
import React, { useState } from 'react';

export default function EditTransactionModal(props) {
  const {
    theme, darkMode, editingTransaction, setEditingTransaction,
    updateTransaction, deleteTransaction,
    expenseCategories, incomeCategories, creditCards,
    splitPayments, setSplitPayments,
    wallets = [],
  } = props;

  // 立替メンバーの編集用ローカルstate
  const [editingSplit, setEditingSplit] = useState(editingTransaction?.isSplit || false);
  const [splitMembers, setSplitMembers] = useState(
    editingTransaction?.splitMembers?.length > 0
      ? editingTransaction.splitMembers.map(m => ({ ...m }))
      : [{ name: '', amount: '' }]
  );

  const tx = editingTransaction;
  if (!tx) return null;

  const totalAmount = Math.abs(tx.amount);

  // 立替合計・自己負担
  const splitTotal = splitMembers.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const myShare    = totalAmount - splitTotal;

  // 均等割り
  const applyEqual = () => {
    if (!totalAmount || splitMembers.length === 0) return;
    const n = splitMembers.length + 1; // 自分を含む
    const per = Math.floor(totalAmount / n);
    setSplitMembers(prev => prev.map(m => ({ ...m, amount: String(per) })));
  };

  // 保存
  const handleSave = () => {
    const validMembers = editingSplit
      ? splitMembers.filter(m => m.name.trim() && Number(m.amount) > 0)
      : [];
    const splitTotalAmt = validMembers.reduce((s, m) => s + Number(m.amount), 0);

    const updated = {
      ...tx,
      isSplit:      validMembers.length > 0,
      splitMembers: validMembers,
      splitAmount:  splitTotalAmt,
    };

    // splitPaymentsも更新
    if (setSplitPayments) {
      setSplitPayments(prev => {
        const without = prev.filter(s => s.transactionId !== tx.id);
        if (validMembers.length === 0) return without;
        const newEntries = validMembers.map((m, i) => ({
          ...prev.find(s => s.transactionId === tx.id && s.person === m.name) || {},
          id: Date.now() + i,
          date: tx.date,
          person: m.name.trim(),
          amount: Number(m.amount),
          category: tx.category,
          memo: tx.memo || '',
          transactionId: tx.id,
          settled: m.settled || false,
        }));
        return [...without, ...newEntries];
      });
    }

    updateTransaction(updated);
  };

  const inputCls = `w-full max-w-full px-4 py-3 rounded-xl text-sm ${
    darkMode
      ? 'bg-neutral-800 text-white border border-neutral-700'
      : 'bg-white border border-neutral-200'
  } focus:outline-none`;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn"
      onClick={() => setEditingTransaction(null)}
    >
      <div
        className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-slideUp`}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
          <h2 className={`text-lg font-bold ${theme.text}`}>
            {tx.isSettlement ? '💳 クレジット引き落とし' : '取引を編集'}
          </h2>
          <button
            onClick={() => setEditingTransaction(null)}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}
          >✕</button>
        </div>

        <div className="px-4 pb-8 pt-4">
          {/* ─── 引き落とし予約：読み取り専用 ─── */}
          {tx.isSettlement ? (
            <div className="space-y-3">
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                <p className={`text-xs font-bold ${theme.textSecondary} mb-3 uppercase tracking-wide`}>引き落とし情報</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'カード', value: creditCards.find(c => c.id === tx.cardId)?.name || 'カード' },
                    { label: '引き落とし日', value: tx.date },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className={`text-sm ${theme.textSecondary}`}>{label}</span>
                      <span className={`text-sm font-semibold ${theme.text}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: darkMode ? '#2C2C2E' : '#e5e7eb' }}>
                    <span className={`text-sm ${theme.textSecondary}`}>金額</span>
                    <span className="text-xl font-black tabular-nums" style={{ color: theme.red }}>¥{Math.abs(tx.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme.textSecondary}`}>状態</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tx.settled ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-400'}`}>
                      {tx.settled ? '✓ 引き落とし済み' : '⏳ 予定'}
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-xs text-center leading-relaxed ${theme.textSecondary}`}>
                引き落とし予約は元の取引から自動生成されます。<br />金額を変更したい場合は元の取引を編集してください。
              </p>
              <button
                onClick={() => setEditingTransaction(null)}
                className={`w-full py-3 rounded-2xl font-bold ${darkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'}`}
              >閉じる</button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 支出/収入 */}
              <div className="flex gap-2">
                {[{ type: 'expense', label: '支出', color: theme.red }, { type: 'income', label: '収入', color: theme.green }].map(({ type, label, color }) => (
                  <button key={type}
                    onClick={() => setEditingTransaction({ ...tx, type, amount: type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount) })}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      backgroundColor: tx.type === type ? color : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: tx.type === type ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* 金額 */}
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>金額</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: tx.type === 'income' ? theme.green : theme.red }}>¥</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={Math.abs(tx.amount) || ''}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setEditingTransaction({ ...tx, amount: tx.type === 'expense' ? -Number(v) : Number(v) });
                    }}
                    placeholder="0"
                    className="flex-1 text-3xl font-black tabular-nums bg-transparent focus:outline-none"
                    style={{ color: tx.type === 'income' ? theme.green : theme.red }}
                  />
                </div>
              </div>

              {/* カテゴリ */}
              <div>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>カテゴリ</p>
                <div className="flex flex-wrap gap-1.5">
                  {(tx.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <button key={cat}
                      onClick={() => setEditingTransaction({ ...tx, category: cat })}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: tx.category === cat ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                        color: tx.category === cat ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 支払方法（支出のみ） */}
              {tx.type === 'expense' && !tx.isRecurring && (
                <div>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>支払方法</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'credit', label: '💳 クレジット' },
                      { key: 'cash',   label: '💵 現金' },
                      ...(wallets?.length > 0 ? [{ key: 'wallet', label: '👛 電子マネー' }] : []),
                    ].map(({ key, label }) => (
                      <button key={key}
                        onClick={() => setEditingTransaction({
                          ...tx,
                          paymentMethod: key,
                          cardId:   key === 'credit' ? (tx.cardId || (creditCards[0]?.id)) : null,
                          walletId: key === 'wallet' ? (tx.walletId || (wallets?.[0]?.id ? String(wallets[0].id) : null)) : null,
                        })}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: tx.paymentMethod === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                          color: tx.paymentMethod === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {tx.paymentMethod === 'credit' && creditCards.length >= 1 && (
                    <select
                      value={tx.cardId || ''}
                      onChange={e => setEditingTransaction({ ...tx, cardId: e.target.value })}
                      className={`w-full mt-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white border border-neutral-200'} focus:outline-none`}
                      style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    >
                      {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                    </select>
                  )}
                  {tx.paymentMethod === 'wallet' && wallets?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {wallets.map(w => (
                        <button key={w.id}
                          onClick={() => setEditingTransaction({ ...tx, walletId: String(w.id) })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: (tx.walletId || String(wallets[0]?.id)) === String(w.id) ? (w.color || theme.accent) : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                            color: (tx.walletId || String(wallets[0]?.id)) === String(w.id) ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                          }}
                        >{w.icon} {w.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 日付 */}
              <div>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>日付</p>
                <input
                  type="date"
                  value={tx.date}
                  onChange={e => setEditingTransaction({ ...tx, date: e.target.value })}
                  className={inputCls}
                  style={{ colorScheme: darkMode ? 'dark' : 'light', display: 'block', width: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none' }}
                />
              </div>

              {/* メモ */}
              <div>
                <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>メモ（任意）</p>
                <input
                  type="text"
                  placeholder="メモを入力..."
                  value={tx.memo || ''}
                  onChange={e => setEditingTransaction({ ...tx, memo: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* ─── 立替設定 ─── */}
              {tx.type === 'expense' && (
                <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                  {/* トグルヘッダー */}
                  <button
                    onClick={() => setEditingSplit(v => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all ${
                      editingSplit
                        ? (darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700')
                        : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-50 text-neutral-500')
                    }`}
                  >
                    <span>👥 複数人分を立替払い</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${editingSplit ? 'bg-blue-500 text-white' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}>
                      {editingSplit ? `${splitMembers.filter(m => m.name || m.amount).length}人` : 'OFF'}
                    </span>
                  </button>

                  {editingSplit && (
                    <div className={`px-3 pb-3 pt-2 space-y-2 ${darkMode ? 'bg-neutral-800/50' : 'bg-blue-50/50'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          立替分は回収するまでPLから除外されます。
                        </p>
                        {totalAmount > 0 && splitMembers.length > 0 && (
                          <button
                            onClick={applyEqual}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}
                          >
                            ÷ 均等割り
                          </button>
                        )}
                      </div>

                      {/* 人ごとの行 */}
                      <div className="space-y-1.5">
                        {splitMembers.map((member, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              placeholder={`${idx + 1}人目の名前`}
                              value={member.name}
                              onChange={e => {
                                const updated = [...splitMembers];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setSplitMembers(updated);
                              }}
                              className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="金額"
                              value={member.amount}
                              onChange={e => {
                                const updated = [...splitMembers];
                                updated[idx] = { ...updated[idx], amount: e.target.value.replace(/[^0-9]/g, '') };
                                setSplitMembers(updated);
                              }}
                              className={`w-24 px-2.5 py-1.5 rounded-lg text-sm tabular-nums ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600 placeholder-neutral-500' : 'bg-white border border-neutral-300 placeholder-neutral-400'} focus:outline-none`}
                            />
                            {/* 精算済トグル（既存メンバーのみ） */}
                            {member.name && (
                              <button
                                onClick={() => {
                                  const updated = [...splitMembers];
                                  updated[idx] = { ...updated[idx], settled: !updated[idx].settled };
                                  setSplitMembers(updated);
                                }}
                                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${member.settled ? 'bg-green-500/20 text-green-500' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}
                                title={member.settled ? '精算済み' : '未回収'}
                              >
                                {member.settled ? '✓' : '¥'}
                              </button>
                            )}
                            {splitMembers.length > 1 && (
                              <button
                                onClick={() => setSplitMembers(prev => prev.filter((_, i) => i !== idx))}
                                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-500'}`}
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 人を追加 */}
                      <button
                        onClick={() => setSplitMembers(prev => [...prev, { name: '', amount: '' }])}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold border-dashed border-2 transition-all ${darkMode ? 'border-neutral-600 text-neutral-400 hover:border-blue-500 hover:text-blue-400' : 'border-neutral-300 text-neutral-400 hover:border-blue-400 hover:text-blue-500'}`}
                      >
                        ＋ 人を追加
                      </button>

                      {/* サマリー */}
                      {totalAmount > 0 && (
                        <div className={`rounded-lg px-3 py-2 text-xs space-y-0.5 ${darkMode ? 'bg-neutral-900/60' : 'bg-white/80'}`}>
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>合計</span>
                            <span className={`font-bold tabular-nums ${theme.text}`}>¥{totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>立替合計（{splitMembers.filter(m => Number(m.amount) > 0).length}人）</span>
                            <span className="font-bold tabular-nums" style={{ color: theme.accent }}>¥{splitTotal.toLocaleString()}</span>
                          </div>
                          <div className={`flex justify-between pt-1 border-t ${theme.border}`}>
                            <span className={`font-semibold ${theme.text}`}>自己負担</span>
                            <span className="font-bold tabular-nums" style={{ color: myShare < 0 ? theme.red : theme.green }}>¥{myShare.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { deleteTransaction(tx.id); setEditingTransaction(null); }}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-white shrink-0"
                  style={{ backgroundColor: theme.red }}
                >🗑️</button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ backgroundColor: theme.accent }}
                >変更を保存</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
