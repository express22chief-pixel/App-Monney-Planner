/**
 * TemplateModal.jsx
 * 取引テンプレート管理モーダル
 * - テンプレート一覧表示・削除
 * - テンプレからワンタップで取引追加
 */
import React, { useState } from 'react';

export default function TemplateModal({
  theme, darkMode,
  transactionTemplates, setTransactionTemplates,
  setNewTransaction, setShowAddTransaction,
  setShowTemplateModal,
  creditCards, wallets,
}) {
  const applyTemplate = (tpl) => {
    setNewTransaction({
      amount: tpl.amount ? String(tpl.amount) : '',
      category: tpl.category || '',
      type: tpl.type || 'expense',
      paymentMethod: tpl.paymentMethod || 'cash',
      date: new Date().toISOString().slice(0, 10),
      memo: tpl.memo || '',
      isSplit: false,
      splitMembers: [],
      cardId: tpl.cardId || null,
      walletId: tpl.walletId || null,
      chargeTarget: null,
    });
    setShowTemplateModal(false);
    setShowAddTransaction(true);
  };

  const deleteTemplate = (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setTransactionTemplates(prev => prev.filter(t => t.id !== id));
  };

  const cardName = (cardId) => creditCards?.find(c => String(c.id) === String(cardId))?.name;
  const walletName = (walletId) => wallets?.find(w => String(w.id) === String(walletId))?.name;

  const paymentLabel = (tpl) => {
    if (tpl.paymentMethod === 'credit') return `💳 ${cardName(tpl.cardId) || 'クレジット'}`;
    if (tpl.paymentMethod === 'wallet') return `👛 ${walletName(tpl.walletId) || '電子マネー'}`;
    return '💵 現金';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fadeIn" onClick={() => setShowTemplateModal(false)}>
      <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-slideUp`} onClick={e => e.stopPropagation()}>

        <div className={`sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 ${darkMode ? 'bg-neutral-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${theme.border}`}>
          <h2 className={`text-lg font-bold ${theme.text}`}>⚡ テンプレから追加</h2>
          <button onClick={() => setShowTemplateModal(false)} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'} text-sm font-bold`}>✕</button>
        </div>

        <div className="px-4 pb-8 pt-4">
          {transactionTemplates.length === 0 ? (
            <div className={`rounded-lg p-8 text-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
              <p className="text-3xl mb-3">📋</p>
              <p className={`text-sm font-semibold ${theme.text} mb-1`}>テンプレートがまだありません</p>
              <p className={`text-xs ${theme.textSecondary}`}>取引追加時に「テンプレとして保存」をオンにすると<br />ここに追加されます</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactionTemplates.map(tpl => (
                <div key={tpl.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-neutral-700' : 'border-neutral-200'}`}>
                  <button
                    onClick={() => applyTemplate(tpl)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-98 ${darkMode ? 'bg-neutral-800 hover:bg-neutral-750' : 'bg-white hover:bg-neutral-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                      {tpl.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${theme.text} truncate`}>{tpl.name || tpl.category}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${tpl.type === 'income' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-400'}`}>
                          {tpl.type === 'income' ? '収入' : '支出'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-xs ${theme.textSecondary}`}>{tpl.category}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>·</p>
                        <p className={`text-xs ${theme.textSecondary}`}>{paymentLabel(tpl)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {tpl.amount ? (
                        <p className={`text-base font-black tabular-nums ${tpl.type === 'income' ? 'text-green-500' : 'text-red-400'}`}>
                          {tpl.type === 'income' ? '+' : '-'}¥{Number(tpl.amount).toLocaleString()}
                        </p>
                      ) : (
                        <p className={`text-xs ${theme.textSecondary}`}>金額未設定</p>
                      )}
                    </div>
                  </button>
                  {tpl.memo && (
                    <div className={`px-4 py-1.5 border-t ${darkMode ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-100 bg-neutral-50'}`}>
                      <p className={`text-xs ${theme.textSecondary} truncate`}>📝 {tpl.memo}</p>
                    </div>
                  )}
                  <div className={`flex justify-end px-3 py-1.5 border-t ${darkMode ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-100 bg-neutral-50'}`}>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className={`text-xs px-2 py-0.5 rounded font-semibold transition-all ${
                        confirmDeleteId === tpl.id
                          ? 'bg-red-500 text-white'
                          : 'text-red-400'
                      }`}
                    >{confirmDeleteId === tpl.id ? '確認して削除' : '🗑️ 削除'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
