import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function HomeTab(props) {
  const {
    theme, darkMode, unclosedMonths, openCloseMonthModal,
    summaryMonthOffset, setSummaryMonthOffset,
    calculateMonthlyBalance, budgetAnalysis, monthlyBudget,
    calculateCategoryExpenses, getLast6MonthsTrend,
    transactions, setTransactions, currentMonth, currentBalance, recurringTransactions,
    monthlyHistory, simulationSettings, creditCards,
    showCFList, setShowCFList, showSplitList, setShowSplitList,
    showRecurringList, setShowRecurringList,
    selectedMonth,
    splitPayments, setSplitPayments, recentTxnLimit, setRecentTxnLimit,
    setShowAddTransaction, setShowBudgetModal, dismissedClosingAlerts,
    setDismissedClosingAlerts, setShowClosingCheckModal,
    expandedCreditGroups, setExpandedCreditGroups,
    setEditingTransaction,
    setShowTutorial, setTutorialPage,
    setShowRecurringModal, setEditingRecurring, deleteRecurring,
    getSettlementDate,
  } = props;
  const formatYM = (ym) => { const [y, m] = ym.split('-'); return `${y}年${parseInt(m)}月`; };

  return (
          <div className="space-y-3 animate-fadeIn">

            {/* 未締め月バナー */}
            {unclosedMonths.length > 0 && (
              <div className={`rounded-xl p-4 border-l-4`} style={{ backgroundColor: darkMode ? 'rgba(255,159,10,0.12)' : 'rgba(255,159,10,0.08)', borderColor: theme.orange }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1" style={{ color: theme.orange }}>⚠ 未締めの月があります</p>
                    <p className={`text-xs ${theme.textSecondary} mb-2`}>以下の月の収支がまだ確定していません。</p>
                    <div className="flex flex-wrap gap-2">
                      {unclosedMonths.map(ym => (
                        <button
                          key={ym}
                          onClick={() => openCloseMonthModal(ym)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover-scale transition-all"
                          style={{ backgroundColor: theme.orange }}
                        >
                          {formatYM(ym)}の収支を確定する
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 今月サマリー：スワイプで月切替 + 収支バー */}
            {(() => {
              const today = new Date();
              // toISOString()はUTC変換でJSTが1日ずれるためローカル時刻で計算
              const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const targetDate = new Date(today.getFullYear(), today.getMonth() + summaryMonthOffset, 1);
              const targetMonth = toYM(targetDate);
              const currentMonth = toYM(today);
              const isCurrentMonth = targetMonth === currentMonth;

              const bal = calculateMonthlyBalance(targetMonth);
              const inc = bal.plIncome || 0;
              const exp = bal.plExpense || 0;
              const diff = inc - exp;
              const isPositive = diff >= 0;
              const spendRatio = inc > 0 ? Math.min(exp / inc, 1) : (exp > 0 ? 1 : 0);
              const overRatio = inc > 0 && exp > inc ? Math.min((exp - inc) / inc, 0.5) : 0;

              // スワイプ処理
              const handleTouchStart = (e) => { e._swipeStartX = e.touches[0].clientX; };
              const handleTouchEnd = (e) => {
                const dx = e.changedTouches[0].clientX - (e._swipeStartX || e.changedTouches[0].clientX);
                if (Math.abs(dx) > 40) setSummaryMonthOffset(o => Math.max(-11, Math.min(0, o + (dx < 0 ? -1 : 1))));
              };

              // 表示月ラベル
              const monthLabel = targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

              return (
                <div
                  className={`${theme.cardGlass} rounded-2xl overflow-hidden select-none`}
                  onTouchStart={e => { e.currentTarget._startX = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const dx = e.changedTouches[0].clientX - (e.currentTarget._startX || 0);
                    // 右スワイプ=前月へ(offset-1)、左スワイプ=翌月へ(offset+1)
                    if (Math.abs(dx) > 40) setSummaryMonthOffset(o => Math.max(-11, Math.min(0, o + (dx > 0 ? -1 : 1))));
                  }}
                >
                  {/* 上段：月ラベル + 収支差額 */}
                  <div className="px-5 pt-5 pb-4" style={{
                    background: darkMode
                      ? isPositive
                        ? 'linear-gradient(145deg, rgba(10,132,255,0.10) 0%, transparent 70%)'
                        : 'linear-gradient(145deg, rgba(255,69,58,0.10) 0%, transparent 70%)'
                      : isPositive
                        ? 'linear-gradient(145deg, rgba(59,130,246,0.06) 0%, transparent 70%)'
                        : 'linear-gradient(145deg, rgba(239,68,68,0.06) 0%, transparent 70%)'
                  }}>
                    {/* ヘッダー行 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* 前月へ */}
                        <button
                          onClick={() => setSummaryMonthOffset(o => Math.max(-11, o - 1))}
                          className={`text-xs px-1.5 py-1 rounded-lg transition-all ${darkMode ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-300 hover:text-neutral-500'}`}
                        >◀</button>
                        <span className={`text-[11px] font-bold tracking-wide ${isCurrentMonth ? theme.text : theme.textSecondary}`}>
                          {monthLabel}
                        </span>
                        {monthlyHistory[targetMonth] && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-green-500/15 text-green-500">締済</span>
                        )}
                        {/* 次月へ（今月より先はNG） */}
                        <button
                          onClick={() => setSummaryMonthOffset(o => Math.min(0, o + 1))}
                          className={`text-xs px-1.5 py-1 rounded-lg transition-all ${summaryMonthOffset >= 0 ? 'opacity-20 pointer-events-none' : (darkMode ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-300 hover:text-neutral-500')}`}
                        >▶</button>
                        {!isCurrentMonth && (
                          <button
                            onClick={() => setSummaryMonthOffset(0)}
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}
                          >今月</button>
                        )}
                      </div>
                      <button
                        onClick={() => { setShowTutorial(true); setTutorialPage(0); }}
                        className={`text-xs px-2 py-0.5 rounded-full transition-all ${darkMode ? 'text-neutral-700 hover:text-neutral-500' : 'text-neutral-300 hover:text-neutral-500'}`}
                      >❓</button>
                    </div>

                    {/* 収支差額（大きく） */}
                    <div className="mb-1">
                      <p className={`text-[10px] font-medium ${theme.textSecondary} mb-1`}>収支</p>
                      <p className="text-3xl font-black tabular-nums" style={{
                        color: isPositive ? theme.green : theme.red,
                        letterSpacing: '-0.03em'
                      }}>
                        {isPositive ? '+' : '−'}¥{Math.abs(diff).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 収支バー */}
                  <div className="px-5 py-4" style={{
                    borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                  }}>
                    {inc > 0 || exp > 0 ? (() => {
                      const savingsPct = inc > 0 ? Math.max(0, Math.round((1 - exp / inc) * 100)) : 0;
                      const expBarPct = inc > 0 ? Math.min((exp / inc) * 100, 100) : 100;
                      return (
                        <div>
                          {/* 収入・支出 数字行 */}
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.green }}>↑ 収入</p>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>¥{inc.toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="px-3 py-1 rounded-full text-[11px] font-black tabular-nums text-white"
                                style={{ backgroundColor: isPositive ? theme.green : theme.red }}>
                                {isPositive ? `▲ ¥${diff.toLocaleString()}` : `▼ ¥${Math.abs(diff).toLocaleString()}`}
                              </div>
                              <p className="text-[9px] mt-0.5 font-semibold" style={{ color: isPositive ? theme.green : theme.red }}>
                                {isPositive ? `貯蓄率 ${savingsPct}%` : '赤字'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.red }}>↓ 支出</p>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>¥{exp.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* 1本の積み上げ比較バー */}
                          <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                            {/* 収入（緑）バー：常に左から100% */}
                            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: theme.green, opacity: 0.25 }} />
                            {/* 支出バー：収入に対する割合で左から */}
                            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${expBarPct}%`,
                                background: expBarPct < 70
                                  ? `linear-gradient(90deg, ${theme.green}, ${theme.green})`
                                  : expBarPct < 90
                                    ? `linear-gradient(90deg, ${theme.green}, ${theme.orange})`
                                    : `linear-gradient(90deg, ${theme.green}99, ${theme.red})`,
                              }}
                            />
                            {/* 赤字時：超過分を赤く点滅 */}
                            {!isPositive && (
                              <div className="absolute top-0 right-0 h-full w-2 rounded-r-full animate-pulse" style={{ backgroundColor: theme.red }} />
                            )}
                          </div>

                          {/* バー下ラベル */}
                          <div className="flex justify-between mt-1.5">
                            <p className="text-[9px] font-semibold" style={{ color: theme.green }}>¥0</p>
                            <p className="text-[9px] font-semibold" style={{ color: isPositive ? theme.green : theme.orange }}>
                              {isPositive ? `残 ¥${diff.toLocaleString()}` : `収入 ¥${inc.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      );
                    })() : (
                      <p className={`text-xs text-center py-1 ${theme.textSecondary}`}>取引なし</p>
                    )}

                    {/* ページドット */}
                    <div className="flex justify-center gap-1 mt-3">
                      {[-5,-4,-3,-2,-1,0].map(o => (
                        <button
                          key={o}
                          onClick={() => setSummaryMonthOffset(o)}
                          className="rounded-full transition-all duration-200"
                          style={{
                            width: summaryMonthOffset === o ? 16 : 5,
                            height: 5,
                            backgroundColor: summaryMonthOffset === o
                              ? (isCurrentMonth ? theme.accent : theme.textSecondary)
                              : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* 定期支払い */}
            <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
              {/* ヘッダー（常時表示）+ 折りたたみ時の合計表示 */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => setShowRecurringList(!showRecurringList)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>定期支払い</span>
                    {recurringTransactions.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                        {recurringTransactions.length}件
                      </span>
                    )}
                    <span className={`text-xs ${theme.textSecondary} ml-auto mr-2`} style={{ display:'inline-block', transform: showRecurringList ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
                  </button>
                  <button onClick={() => { setEditingRecurring(null); setShowRecurringModal(true); }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white hover-scale shrink-0"
                    style={{ backgroundColor: theme.accent }}>+ 追加</button>
                </div>
                {recurringTransactions.length > 0 && (() => {
                  const fixedTotal = recurringTransactions
                    .filter(r => r.type === 'expense')
                    .reduce((s, r) => s + Number(r.amount || 0), 0);
                  const investTotal = recurringTransactions
                    .filter(r => r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
                    .reduce((s, r) => s + Number(r.amount || 0), 0);
                  return (
                    <div className="flex items-center gap-3 pb-1">
                      {fixedTotal > 0 && (
                        <span className="text-xs tabular-nums" style={{ color: theme.red }}>
                          固定費 <span className="font-bold">¥{fixedTotal.toLocaleString()}</span>
                        </span>
                      )}
                      {investTotal > 0 && (
                        <span className="text-xs tabular-nums" style={{ color: theme.green }}>
                          積立 <span className="font-bold">¥{investTotal.toLocaleString()}</span>
                        </span>
                      )}
                      <span className={`text-xs tabular-nums ml-auto font-black ${theme.text}`}>
                        月計 ¥{(fixedTotal + investTotal).toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* 展開コンテンツ */}
              {showRecurringList && (
                <div className={`border-t ${theme.border} animate-fadeIn`}>
                  {recurringTransactions.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${theme.textSecondary}`}>定期支払いを追加してください</p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: darkMode ? '#2a2a2a' : '#f0f0f0' }}>
                      {recurringTransactions.map((r) => (
                        <div key={r.id} className={`flex items-center px-4 py-3 ${darkMode ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'} transition-all`}>
                          <span className="text-base mr-3">
                            {r.type==='investment' ? '📈' : r.type==='fund' ? '📊' : r.type==='insurance' ? '🛡️' : '🔄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme.text} truncate`}>{r.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-xs ${theme.textSecondary}`}>毎月{r.day}日</span>
                              {r.type === 'investment' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(168,85,247,0.15)', color:'#a855f7' }}>投資積立</span>
                              )}
                              {r.type === 'fund' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(16,185,129,0.15)', color:'#10b981' }}>投資信託</span>
                              )}
                              {r.type === 'insurance' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor:'rgba(59,130,246,0.15)', color:'#3b82f6' }}>積立保険</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums mr-3" style={{
                            color: r.type==='investment' ? '#a855f7' : r.type==='fund' ? '#10b981' : r.type==='insurance' ? '#3b82f6' : (darkMode ? '#e5e5e5' : '#171717')
                          }}>
                            ¥{r.amount.toLocaleString()}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingRecurring(r); setShowRecurringModal(true); }} className="p-1.5 rounded-lg text-blue-500 hover:scale-110 transition-transform">✏️</button>
                            <button onClick={() => deleteRecurring(r.id)} className="p-1.5 rounded-lg text-red-500 hover:scale-110 transition-transform">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* 予定CF：今月の引き落とし・支払い予定 */}
            {(() => {
              const today = new Date();
              const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const thisYearMonth = toYM(today);
              const todayDay = today.getDate();

              // クレカ：カード×引落日でグループ化（通常取引 + クレカ払い定期支払いの実績取引）
              const creditGroups = [];
              creditCards.forEach(card => {
                const cardTxns = transactions.filter(t => {
                  if (t.amount >= 0 || t.settled || t.paymentMethod !== 'credit') return false;
                  // cardIdが一致するか、cardId未設定なら先頭カード扱い
                  const matchCard = t.cardId ? t.cardId === card.id : card.id === (creditCards[0] && creditCards[0].id);
                  if (!matchCard) return false;
                  const sd = getSettlementDate(t.date, card.id);
                  return sd && toYM(sd) === thisYearMonth;
                });
                if (cardTxns.length === 0) return;
                const day = card.paymentDay || 10;
                const amount = cardTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
                const isPast = day <= todayDay;
                const details = [...cardTxns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(t => ({ date: t.date, category: t.category || '—', memo: t.memo, amount: Math.abs(t.amount) }));
                creditGroups.push({ kind: 'credit', name: card.name, cardId: card.id, amount, day, isPast, details });
              });

              // 定期支払い：クレカ払い→引落日でcreditGroupsに合算、現金払い→固定費リスト
              const fixedItems = [];
              recurringTransactions
                .filter(r => r.type === 'expense' || r.type === 'investment' || r.type === 'fund' || r.type === 'insurance')
                .forEach(r => {
                  const day = (!r.recurrenceType || r.recurrenceType === 'monthly-date') ? (r.day || 1) : null;
                  const amount = Number(r.amount || 0);
                  if (amount === 0) return;

                  if (r.paymentMethod === 'credit' && r.cardId) {
                    // クレカ払いの定期支払い → 対象カードのcreditGroupに合算
                    const card = creditCards.find(c => c.id === r.cardId) || creditCards[0];
                    if (card) {
                      const payDay = card.paymentDay || 10;
                      const existing = creditGroups.find(g => g.cardId === card.id);
                      const detail = { date: `毎月${day || '?'}日`, category: r.category || r.name, memo: r.name + '（定期）', amount };
                      if (existing) {
                        existing.amount += amount;
                        existing.details.push(detail);
                      } else {
                        creditGroups.push({ kind: 'credit', name: card.name, cardId: card.id, amount, day: payDay, isPast: payDay <= todayDay, details: [detail] });
                      }
                    }
                  } else {
                    // 現金・振替払い → 固定費リスト
                    const icon = r.type === 'investment' ? '📈' : r.type === 'fund' ? '📊' : r.type === 'insurance' ? '🛡️' : '🔄';
                    fixedItems.push({ kind: 'fixed', name: r.name, amount, day, category: r.category, isPast: day !== null && day <= todayDay, icon });
                  }
                });

              const allItems = [...creditGroups, ...fixedItems]
                .filter(i => i.amount > 0)
                .sort((a, b) => (a.day ?? 99) - (b.day ?? 99));

              if (allItems.length === 0) return null;

              const remainingTotal = allItems.filter(i => !i.isPast).reduce((s, i) => s + i.amount, 0);
              const totalAll = allItems.reduce((s, i) => s + i.amount, 0);

              return (
                <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
                  {/* ヘッダー */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setShowCFList(!showCFList)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>今月の支払い予定</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>{allItems.length}件</span>
                        <span className={`text-xs ${theme.textSecondary} ml-auto mr-2`} style={{ display: 'inline-block', transform: showCFList ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {remainingTotal > 0 && (
                        <span className="text-xs tabular-nums flex items-center gap-1" style={{ color: theme.red }}>
                          <span className={`text-[10px] ${theme.textSecondary}`}>未払い</span>
                          <span className="font-bold">¥{remainingTotal.toLocaleString()}</span>
                        </span>
                      )}
                      <span className={`text-xs tabular-nums ml-auto font-black ${theme.text}`}>
                        月計 ¥{totalAll.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 展開リスト */}
                  {showCFList && (
                    <div className="border-t animate-fadeIn" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <div className="divide-y" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                        {allItems.map((item, i) => {
                          const groupKey = item.kind === 'credit' ? `credit-${item.cardId}` : `fixed-${i}`;
                          const isExpanded = !!expandedCreditGroups[groupKey];
                          const canExpand = item.kind === 'credit' && item.details && item.details.length > 1;
                          return (
                            <div key={i}>
                              {/* メイン行 */}
                              <div
                                className={`flex items-center px-4 py-2.5 transition-colors ${canExpand ? 'cursor-pointer active:opacity-70' : ''}`}
                                style={{ opacity: item.isPast ? 0.4 : 1 }}
                                onClick={() => canExpand && setExpandedCreditGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                              >
                                <div className="w-9 shrink-0 text-center">
                                  {item.day !== null ? (
                                    <>
                                      <p className={`text-sm font-black tabular-nums leading-tight ${item.isPast ? theme.textSecondary : theme.text}`}>{item.day}</p>
                                      <p className={`text-[8px] ${theme.textSecondary} leading-none`}>日</p>
                                    </>
                                  ) : (
                                    <span className={`text-xs ${theme.textSecondary}`}>—</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mx-2">
                                  <span className="text-sm">{item.kind === 'credit' ? '💳' : (item.icon || '🔄')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-sm font-medium truncate ${theme.text}`}>{item.name}</p>
                                    {canExpand && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                                        {item.details.length}件
                                      </span>
                                    )}
                                  </div>
                                  {item.kind === 'credit' && (
                                    <p className={`text-[10px] ${theme.textSecondary}`}>クレジット引き落とし</p>
                                  )}
                                  {item.category && item.kind !== 'credit' && (
                                    <p className={`text-[10px] ${theme.textSecondary}`}>{item.category}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <p className="text-sm font-bold tabular-nums" style={{ color: item.isPast ? (darkMode ? '#555' : '#bbb') : theme.red }}>
                                      ¥{item.amount.toLocaleString()}
                                    </p>
                                    {item.isPast && <p className="text-[9px] text-green-500 font-bold">完了</p>}
                                  </div>
                                  {canExpand && (
                                    <span className={`text-xs ${theme.textSecondary} transition-transform duration-200`} style={{ display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                  )}
                                </div>
                              </div>

                              {/* 内訳（展開時） */}
                              {canExpand && isExpanded && (
                                <div className="animate-fadeIn" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                  {item.details.map((d, di) => (
                                    <div key={di} className="flex items-center pl-14 pr-4 py-2" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium truncate ${theme.text}`}>{d.category}</p>
                                        {d.memo && <p className={`text-[10px] truncate ${theme.textSecondary}`}>{d.memo}</p>}
                                        <p className={`text-[10px] ${theme.textSecondary}`}>{d.date}</p>
                                      </div>
                                      <p className="text-xs font-bold tabular-nums shrink-0 ml-3" style={{ color: darkMode ? '#888' : '#aaa' }}>
                                        ¥{d.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* 立替待ち */}
            {splitPayments.filter(s => !s.settled).length > 0 && (
              <div className={`${theme.cardGlass} rounded-xl overflow-hidden`}>
                {/* ヘッダー：常時表示 */}
                <button
                  onClick={() => setShowSplitList(!showSplitList)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">👥</span>
                    <span className={`text-sm font-semibold ${theme.text}`}>立替待ち</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white">
                      {splitPayments.filter(s => !s.settled).length}人
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>
                      合計 ¥{splitPayments.filter(s => !s.settled).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs ${theme.textSecondary}`} style={{ display:'inline-block', transform: showSplitList ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
                </button>

                {showSplitList && (
                  <div className={`border-t ${theme.border} animate-fadeIn`}>
                    {splitPayments.filter(s => !s.settled).map(sp => (
                      <div key={sp.id} className={`px-4 py-3 border-b ${theme.border} last:border-b-0`}>
                        {/* 人名と金額行 */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-bold ${theme.text}`}>{sp.person}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>{sp.category}</span>
                              <span className={`text-xs ${theme.textSecondary}`}>{sp.date}</span>
                            </div>
                            {sp.memo && (
                              <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>{sp.memo}</p>
                            )}
                            <p className="text-base font-bold tabular-nums mt-1" style={{ color: theme.accent }}>
                              ¥{sp.amount.toLocaleString()}
                            </p>
                          </div>

                          {/* 精算ボタン */}
                          <button
                            onClick={() => {
                              const settleTransaction = {
                                id: Date.now(),
                                date: new Date().toISOString().slice(0, 10),
                                category: '立替回収',
                                memo: `${sp.person}からの返金（${sp.category}）`,
                                amount: sp.amount,
                                type: 'income',
                                settled: true,
                                isSettlement: false
                              };
                              // 精算収入を記録 + 元取引のsplitMembersを更新
                              setTransactions(prev => [
                                settleTransaction,
                                ...prev.map(t => {
                                  if (t.id !== sp.transactionId) return t;
                                  const updatedMembers = (t.splitMembers || []).map(m =>
                                    m.name === sp.person && !m.settled
                                      ? { ...m, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                      : m
                                  );
                                  const allSettled = updatedMembers.every(m => m.settled);
                                  return { ...t, splitMembers: updatedMembers, splitSettled: allSettled };
                                })
                              ]);
                              setSplitPayments(prev => prev.map(s =>
                                s.id === sp.id
                                  ? { ...s, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                  : s
                              ));
                              // editingTransactionを同期（精算後の表示崩れ防止）
                              setEditingTransaction(prev => {
                                if (!prev) return prev;
                                const updatedMembers = (prev.splitMembers || []).map(m =>
                                  m.name === sp.person && !m.settled
                                    ? { ...m, settled: true, settledDate: new Date().toISOString().slice(0, 10) }
                                    : m
                                );
                                return { ...prev, splitMembers: updatedMembers, splitSettled: updatedMembers.every(m => m.settled) };
                              });
                            }}
                            className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white hover-scale transition-all"
                            style={{ backgroundColor: theme.green }}
                          >
                            精算 ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* 最近の取引 */}
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>最近の取引</h2>
                {!monthlyHistory[currentMonth] && currentBalance.cfBalance !== 0 && (
                  <button
                    onClick={() => openCloseMonthModal()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover-scale"
                    style={{ backgroundColor: theme.accent }}>
                    {formatYM(selectedMonth) + 'の収支を確定する'}
                  </button>
                )}
              </div>
              {transactions.length === 0 ? (
                <p className={`text-sm text-center py-8 ${theme.textSecondary}`}>まだ取引がありません</p>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, recentTxnLimit).map((t, idx) => (
                    <div key={t.id} onClick={() => setEditingTransaction(t)}
                      className={`flex items-center gap-3 px-1 py-2.5 rounded-xl cursor-pointer transition-all duration-200 animate-fadeIn ${darkMode ? 'hover:bg-neutral-700/30' : 'hover:bg-neutral-50'}`}
                      style={{ animationDelay: `${idx * 0.03}s` }}>
                      {/* アイコン */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                        t.isSettlement ? (darkMode?'bg-orange-500/15':'bg-orange-50') :
                        t.type==='income' ? (darkMode?'bg-green-500/15':'bg-green-50') :
                        t.paymentMethod==='credit' ? (darkMode?'bg-blue-500/15':'bg-blue-50') :
                        (darkMode?'bg-neutral-800':'bg-neutral-100')
                      }`}>
                        {t.isRecurring ? (t.isInvestment ? '📈' : '🔄') : t.isSettlement ? '💸' : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' ? '💳' : '💵')}
                      </div>
                      {/* 中央テキスト */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                          {!t.settled && t.type === 'expense' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: t.isSettlement ? 'rgba(255,159,10,0.2)' : 'rgba(255,159,10,0.15)', color: theme.orange }}>
                              {t.isSettlement ? '引落予定' : '未確定'}
                            </span>
                          )}
                          {t.isSplit && (() => {
                            const members = t.splitMembers || [];
                            const allSettled = members.length > 0 && members.every(m => m.settled);
                            const settledCount = members.filter(m => m.settled).length;
                            return (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${allSettled ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'}`}>
                                {allSettled ? '👥精算済' : `👥${settledCount}/${members.length}人`}
                              </span>
                            );
                          })()}
                        </div>
                        <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>
                          {t.memo ? t.memo : t.date}
                          {t.memo && <span className="ml-1.5 opacity-60">{t.date.slice(5)}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isSettlement ? theme.orange : t.isInvestment ? '#a855f7' : theme.red) }}>
                            {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                          </p>
                          {t.memo && <p className={`text-[10px] tabular-nums ${theme.textSecondary}`}>{t.date.slice(5)}</p>}
                      </div>
                    </div>
                  ))}
                  {transactions.length > recentTxnLimit && (
                    <button
                      onClick={() => setRecentTxnLimit(prev => prev + 10)}
                      className={`w-full mt-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${darkMode ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                    >
                      もっと見る（残り {transactions.length - recentTxnLimit} 件）
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

  );
}
