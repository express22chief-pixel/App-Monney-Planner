import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const CAT_COLORS = [
  '#00e5ff','#0cff8c','#ff9f0a','#ff453a','#a855f7',
  '#3b82f6','#f59e0b','#10b981','#ec4899','#6366f1',
];

export default function CalendarTab(props) {
  const {
    theme, darkMode,
    selectedMonth, setSelectedMonth,
    transactions, recurringTransactions,
    setShowDateTransactionsModal, setSelectedDate,
    historySearch, setHistorySearch,
    historyCategory, setHistoryCategory,
    expenseCategories, incomeCategories,
    setEditingTransaction,
    monthlyHistory, calculateMonthlyBalance, currentMonth,
    getLast6MonthsTrend, openCloseMonthModal,
    monthlyBudget,
  } = props;

  const txt    = theme.textHex   || (darkMode ? '#f0f0f0' : '#0a0a0a');
  const sub    = theme.subHex    || (darkMode ? '#888'    : '#666');
  const bdr    = theme.borderHex || (darkMode ? '#1f1f1f' : '#e8e8e6');
  const card   = theme.cardHex   || (darkMode ? '#111'    : '#fff');
  const accent = theme.accent    || '#00e5ff';

  const formatYM = (ym) => { const [y,m] = ym.split('-'); return `${y}年${parseInt(m)}月`; };

  const getDays   = (ym) => { const [y,m] = ym.split('-').map(Number); return new Date(y,m,0).getDate(); };
  const getFirst  = (ym) => { const [y,m] = ym.split('-').map(Number); return new Date(y,m-1,1).getDay(); };
  const getTxns   = (ym, day) => {
    const ds = ym + '-' + String(day).padStart(2,'0');
    return transactions.filter(t => t.date === ds);
  };
  const getDayBal = (ym, day) => {
    const txns   = getTxns(ym, day).filter(t => !t.isSettlement);
    const income  = txns.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const expense = Math.abs(txns.filter(t => t.amount < 0).reduce((s,t) => s + t.amount, 0));
    return { income, expense };
  };

  const isCurrentMonth = selectedMonth === currentMonth;
  const isClosed       = !!monthlyHistory[selectedMonth];

  // ① カテゴリ別支出
  const categoryData = useMemo(() => {
    const investIds = new Set(
      (recurringTransactions || [])
        .filter(r => ['investment','fund','insurance'].includes(r.type))
        .map(r => r.id)
    );
    const txns = transactions.filter(t =>
      t.date.startsWith(selectedMonth) && t.amount < 0 &&
      !t.isSettlement && !(t.recurringId && investIds.has(t.recurringId))
    );
    const totals = txns.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [transactions, recurringTransactions, selectedMonth]);

  const totalExpense = categoryData.reduce((s,d) => s + d.value, 0);

  // ② 予算 vs 実績
  const budgetRows = useMemo(() => {
    if (!monthlyBudget?.expenses) return [];
    const expMap = categoryData.reduce((acc,d) => { acc[d.name] = d.value; return acc; }, {});
    return Object.entries(monthlyBudget.expenses)
      .filter(([,b]) => b > 0)
      .map(([cat, budget]) => ({
        cat, budget,
        actual: expMap[cat] || 0,
        pct: Math.min(100, Math.round(((expMap[cat]||0)/budget)*100)),
        over: (expMap[cat]||0) > budget,
      }))
      .sort((a,b) => b.pct - a.pct);
  }, [monthlyBudget, categoryData]);

  // ⑤ ヒートマップ
  const dayExpenses = useMemo(() => {
    const days = getDays(selectedMonth);
    return Array.from({ length: days }, (_,i) => getDayBal(selectedMonth, i+1).expense);
  }, [transactions, selectedMonth]);

  const maxExpense = Math.max(...dayExpenses, 1);

  const heatColor = (expense) => {
    if (expense === 0) return 'transparent';
    const a = expense / maxExpense;
    return darkMode
      ? `rgba(255,69,58,${(a * 0.75 + 0.12).toFixed(2)})`
      : `rgba(229,57,53,${(a * 0.65 + 0.08).toFixed(2)})`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fadeIn">

      {/* カレンダーカード */}
      <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>

        {/* 月ナビ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${bdr}` }}>
          <button onClick={() => { const d = new Date(selectedMonth+'-01'); d.setMonth(d.getMonth()-1); setSelectedMonth(d.toISOString().slice(0,7)); }}
            style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${bdr}`, background: 'none', cursor: 'pointer', color: sub, fontSize: 13 }}>◀</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: txt }}>{formatYM(selectedMonth)}</span>
            {!isCurrentMonth && (
              <button onClick={() => setSelectedMonth(currentMonth)}
                style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, border: `1px solid ${accent}`, background: 'none', color: accent, cursor: 'pointer' }}>
                今月
              </button>
            )}
            {isClosed && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: darkMode ? 'rgba(10,132,255,0.15)' : '#eff6ff', color: '#3b82f6' }}>振り返り済</span>
            )}
          </div>

          <button onClick={() => { const d = new Date(selectedMonth+'-01'); d.setMonth(d.getMonth()+1); setSelectedMonth(d.toISOString().slice(0,7)); }}
            style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${bdr}`, background: 'none', cursor: 'pointer', color: sub, fontSize: 13 }}>▶</button>
        </div>

        {/* 曜日 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '8px 12px 4px' }}>
          {['日','月','火','水','木','金','土'].map((d,i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, paddingBottom: 4,
              color: i===0 ? '#ff453a' : i===6 ? '#3b82f6' : sub }}>{d}</div>
          ))}
        </div>

        {/* グリッド（ヒートマップ） */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, padding: '0 12px 8px' }}>
          {[...Array(getFirst(selectedMonth))].map((_,i) => <div key={`e${i}`} />)}
          {[...Array(getDays(selectedMonth))].map((_,i) => {
            const day = i + 1;
            const { income, expense } = getDayBal(selectedMonth, day);
            const isToday = isCurrentMonth && day === new Date().getDate();
            const bg = heatColor(expense);
            const hasBg = bg !== 'transparent';
            return (
              <button key={day}
                onClick={() => { setSelectedDate(`${selectedMonth}-${String(day).padStart(2,'0')}`); setShowDateTransactionsModal(true); }}
                style={{
                  aspectRatio: '1', borderRadius: 7, cursor: 'pointer',
                  border: isToday ? `2px solid ${accent}` : `1px solid ${bdr}`,
                  background: isToday ? (darkMode ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.06)') : (hasBg ? bg : (darkMode ? '#161616' : '#fafafa')),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  padding: '3px 1px', transition: 'opacity 0.1s',
                }}>
                <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? accent : txt, lineHeight: 1.2 }}>{day}</span>
                {income > 0 && <span style={{ fontSize: 8, color: theme.green, lineHeight: 1.1 }}>+{Math.round(income/1000)}k</span>}
                {expense > 0 && <span style={{ fontSize: 8, lineHeight: 1.1, color: hasBg ? '#fff' : theme.red }}>-{Math.round(expense/1000)}k</span>}
              </button>
            );
          })}
        </div>

        {/* ヒートマップ凡例 */}
        <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: sub }}>支出</span>
          {[0.1, 0.3, 0.55, 0.8, 1.0].map((v,i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: 3,
              background: heatColor(v * maxExpense) || (darkMode ? '#1c1c1c' : '#f0f0f0'),
              border: `1px solid ${bdr}` }} />
          ))}
          <span style={{ fontSize: 10, color: sub }}>多 ←</span>
        </div>

        {/* 月サマリー */}
        {(() => {
          const mb = calculateMonthlyBalance(selectedMonth);
          return (
            <div style={{ borderTop: `1px solid ${bdr}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 16px 14px' }}>
              {[
                { label: '収入', value: mb.plIncome,   color: theme.green },
                { label: '支出', value: mb.plExpense,  color: theme.red },
                { label: '収支', value: mb.plBalance,  color: mb.plBalance >= 0 ? theme.green : theme.red },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: darkMode ? '#161616' : '#f8f8f8', border: `1px solid ${bdr}` }}>
                  <p style={{ fontSize: 10, color: sub, marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                    {label === '収支' && value >= 0 ? '+' : ''}¥{Math.round(Math.abs(value)/1000)}k
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* カテゴリ別支出ドーナツ */}
      {categoryData.length > 0 && (
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>カテゴリ別支出</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: theme.red, fontVariantNumeric: 'tabular-nums' }}>¥{totalExpense.toLocaleString()}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flexShrink: 0, width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {categoryData.map((_,i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <ReTooltip contentStyle={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8, fontSize: 11, color: txt }}
                    formatter={v => [`¥${v.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              {categoryData.slice(0, 6).map((d,i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: sub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: txt, flexShrink: 0 }}>{Math.round(d.value/totalExpense*100)}%</span>
                </div>
              ))}
              {categoryData.length > 6 && <p style={{ fontSize: 10, color: sub }}>他 {categoryData.length - 6} カテゴリ</p>}
            </div>
          </div>
        </div>
      )}

      {/* 予算 vs 実績 */}
      {budgetRows.length > 0 && (
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>予算 vs 実績</span>
            <span style={{ fontSize: 10, color: sub }}>{formatYM(selectedMonth)}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {budgetRows.map(({ cat, budget, actual, pct, over }) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: txt }}>{cat}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: over ? theme.red : txt, fontVariantNumeric: 'tabular-nums' }}>¥{Math.round(actual/1000)}k</span>
                    <span style={{ fontSize: 10, color: sub }}>/ ¥{Math.round(budget/1000)}k</span>
                    {over && <span style={{ fontSize: 10, fontWeight: 700, color: theme.red }}>超過</span>}
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: darkMode ? '#222' : '#efefef', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${pct}%`,
                    background: over ? theme.red : pct > 80 ? theme.orange : accent,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: over ? theme.red : sub }}>{pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 月締め促進ボタン */}
      {!monthlyHistory[selectedMonth] && calculateMonthlyBalance(selectedMonth).cfBalance !== 0 && selectedMonth < currentMonth && (
        <button onClick={() => openCloseMonthModal(selectedMonth)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${theme.orange}, ${theme.orange}cc)`,
            color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          ⚠ {formatYM(selectedMonth)}を振り返る
        </button>
      )}

      {/* 検索・絞り込み */}
      <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bdr}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>取引を絞り込む</span>
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: darkMode ? '#1a1a1a' : '#f5f5f5', border: `1px solid ${bdr}` }}>
            <span style={{ fontSize: 13, color: sub }}>🔍</span>
            <input type="text" placeholder="キーワード検索..." value={historySearch} onChange={e => setHistorySearch(e.target.value)}
              style={{ flex: 1, fontSize: 12, background: 'transparent', border: 'none', outline: 'none', color: txt }} />
            {historySearch && <button onClick={() => setHistorySearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub }}>✕</button>}
          </div>
          <select value={historyCategory} onChange={e => setHistoryCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${bdr}`, background: darkMode ? '#1a1a1a' : '#f5f5f5', color: txt, outline: 'none', colorScheme: darkMode ? 'dark' : 'light' }}>
            <option value="all">全カテゴリ</option>
            {[...expenseCategories, ...incomeCategories].filter((c,i,a) => a.indexOf(c)===i).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {(historySearch || historyCategory !== 'all') && (() => {
          const filtered = transactions.filter(t => {
            const matchMonth  = t.date.startsWith(selectedMonth);
            const matchCat    = historyCategory === 'all' || t.category === historyCategory;
            const matchSearch = !historySearch || t.category?.includes(historySearch) || t.memo?.includes(historySearch) || String(Math.abs(t.amount)).includes(historySearch);
            return matchMonth && matchCat && matchSearch;
          });
          return (
            <div style={{ borderTop: `1px solid ${bdr}` }}>
              <div style={{ padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: sub }}>{filtered.length}件</span>
                <button onClick={() => { setHistorySearch(''); setHistoryCategory('all'); }}
                  style={{ fontSize: 11, color: sub, background: 'none', border: `1px solid ${bdr}`, cursor: 'pointer', padding: '2px 8px', borderRadius: 6 }}>クリア</button>
              </div>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 12, color: sub, textAlign: 'center', padding: '12px 16px' }}>該当する取引がありません</p>
              ) : filtered.map(t => (
                <div key={t.id} onClick={() => setEditingTransaction(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${bdr}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    background: t.amount >= 0 ? (darkMode ? 'rgba(0,230,118,0.1)' : 'rgba(0,200,83,0.07)') : (darkMode ? 'rgba(255,61,87,0.1)' : 'rgba(229,57,53,0.07)') }}>
                    {t.amount >= 0 ? '💰' : t.paymentMethod === 'credit' ? '💳' : '💵'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.category}</p>
                    <p style={{ fontSize: 10, color: sub }}>{t.memo || t.date}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: t.amount >= 0 ? theme.green : theme.red, fontVariantNumeric: 'tabular-nums' }}>
                      {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                    </p>
                    <p style={{ fontSize: 10, color: sub }}>{t.date.slice(5)}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 過去6ヶ月推移 */}
      <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bdr}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>過去6ヶ月の推移</span>
        </div>
        <div style={{ padding: '12px 16px 14px' }}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={getLast6MonthsTrend()} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#222' : '#f0f0f0'} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: sub }} />
              <YAxis tickFormatter={v => `¥${Math.round(v/10000)}万`} tick={{ fontSize: 10, fill: sub }} width={44} />
              <Tooltip contentStyle={{ background: card, border: `1px solid ${bdr}`, borderRadius: 8, fontSize: 11, color: txt }}
                formatter={v => [`¥${v.toLocaleString()}`, 'PL']} />
              <Bar dataKey="PL" fill={accent} radius={[4,4,0,0]} name="PL（発生）" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
