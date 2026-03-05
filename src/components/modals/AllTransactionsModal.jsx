/**
 * AllTransactionsModal.jsx
 * 全取引履歴モーダル（PayPayの「もっと見る」画面イメージ）
 * - 月グループ表示
 * - カテゴリ・支払方法フィルター
 * - 検索
 */
import React, { useState, useMemo } from 'react';

export default function AllTransactionsModal({
  theme, darkMode,
  transactions, creditCards, wallets,
  setEditingTransaction,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | expense | income | credit | wallet | cash

  const filtered = useMemo(() => {
    return transactions
      .filter(t => !t.isSettlement)
      .filter(t => {
        if (filterType === 'expense') return t.type === 'expense';
        if (filterType === 'income')  return t.type === 'income';
        if (filterType === 'credit')  return t.paymentMethod === 'credit';
        if (filterType === 'wallet')  return t.paymentMethod === 'wallet';
        if (filterType === 'cash')    return t.paymentMethod === 'cash';
        return true;
      })
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (t.category || '').toLowerCase().includes(q) || (t.memo || '').toLowerCase().includes(q);
      });
  }, [transactions, filterType, search]);

  // 月グループ化
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach(t => {
      const ym = t.date.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym).push(t);
    });
    return Array.from(map.entries()).map(([ym, items]) => ({ ym, items }));
  }, [filtered]);

  const formatYM = (ym) => {
    const [y, m] = ym.split('-');
    return `${y}年${parseInt(m)}月`;
  };

  const paymentIcon = (t) => {
    if (t.type === 'income') return '💰';
    if (t.isCharge) return '⚡';
    if (t.paymentMethod === 'credit') return '💳';
    if (t.paymentMethod === 'wallet') return '👛';
    return '💵';
  };

  const paymentLabel = (t) => {
    if (t.paymentMethod === 'credit') {
      const card = creditCards?.find(c => String(c.id) === String(t.cardId));
      return card ? card.name : 'クレジット';
    }
    if (t.paymentMethod === 'wallet') {
      const w = wallets?.find(w => String(w.id) === String(t.walletId));
      return w ? `${w.icon} ${w.name}` : '電子マネー';
    }
    return null;
  };

  const FILTERS = [
    { key: 'all',     label: 'すべて'    },
    { key: 'expense', label: '支出'      },
    { key: 'income',  label: '収入'      },
    { key: 'credit',  label: '💳 クレジット' },
    { key: 'wallet',  label: '👛 電子マネー' },
    { key: 'cash',    label: '💵 現金'    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fadeIn" style={{ backgroundColor: darkMode ? '#0a0a0a' : '#f5f5f5' }}>

      {/* ヘッ-ー */}
      <div className={`flex items-center gap-3 px-4 pt-12 pb-3 ${darkMode ? 'bg-neutral-900' : 'bg-white'} border-b ${theme.border}`}>
        <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
          ‹
        </button>
        <h1 className={`text-lg font-bold ${theme.text} flex-1`}>取引履歴</h1>
        <span className={`text-xs ${theme.textSecondary}`}>{filtered.length}件</span>
      </div>

      {/* 検索バー */}
      <div className={`px-4 py-2 ${darkMode ? 'bg-neutral-900' : 'bg-white'} border-b ${theme.border}`}>
        <input
          type="text"
          placeholder="🔍 カテゴリ・メモで検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-500' : 'bg-neutral-100 border-transparent placeholder-neutral-400'} focus:outline-none`}
        />
      </div>

      {/* フィルタータブ */}
      <div className={`flex gap-1.5 px-4 py-2 overflow-x-auto ${darkMode ? 'bg-neutral-900' : 'bg-white'} border-b ${theme.border}`} style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.key}
            onClick={() => setFilterType(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={{
              backgroundColor: filterType === f.key ? theme.accent : (darkMode ? '#2a2a2a' : '#e5e7eb'),
              color: filterType === f.key ? '#fff' : (darkMode ? '#aaa' : '#666'),
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* 取引リスト */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-3xl mb-3">🔍</p>
            <p className={`text-sm ${theme.textSecondary}`}>該当する取引がありません</p>
          </div>
        ) : (
          groups.map(({ ym, items }) => (
            <div key={ym}>
              {/* 月ヘッ-ー */}
              <div className={`flex items-center justify-between px-4 py-2 ${darkMode ? 'bg-neutral-800/60' : 'bg-neutral-200/60'}`}>
                <span className={`text-xs font-bold ${theme.textSecondary}`}>{formatYM(ym)}</span>
                <span className={`text-xs ${theme.textSecondary}`}>
                  {items.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}円支出
                </span>
              </div>
              {/* 取引行 */}
              <div className={`${darkMode ? 'bg-neutral-900' : 'bg-white'} divide-y ${darkMode ? 'divide-neutral-800' : 'divide-neutral-100'}`}>
                {items.map(t => (
                  <button key={t.id} onClick={() => { setEditingTransaction(t); onClose(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${darkMode ? 'hover:bg-neutral-800/50' : 'hover:bg-neutral-50'}`}
                  >
                    {/* アイコン */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                      t.type === 'income' ? (darkMode ? 'bg-green-500/15' : 'bg-green-50') :
                      t.paymentMethod === 'credit' ? (darkMode ? 'bg-blue-500/15' : 'bg-blue-50') :
                      t.paymentMethod === 'wallet' ? (darkMode ? 'bg-purple-500/15' : 'bg-purple-50') :
                      (darkMode ? 'bg-neutral-800' : 'bg-neutral-100')
                    }`}>
                      {paymentIcon(t)}
                    </div>
                    {/* テキスト */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                        {!t.settled && t.type === 'expense' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: 'rgba(255,159,10,0.15)', color: theme.orange }}>未確定</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${theme.textSecondary}`}>
                        <span>{t.date.replace(/-/g, '/').slice(5)}</span>
                        {paymentLabel(t) && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{paymentLabel(t)}</span>
                          </>
                        )}
                        {t.memo && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="truncate">{t.memo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* 金額 */}
                    <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: t.amount >= 0 ? theme.green : theme.red }}>
                      {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
