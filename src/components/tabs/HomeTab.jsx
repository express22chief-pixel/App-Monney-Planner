import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function HomeTab(props) {
  const [showPayments, setShowPayments] = useState(false);   // 今月の支払い予定
  const [showSplit2,   setShowSplit2]   = useState(false);   // 立替待ち（ローカル制御）
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
    setShowAllTransactions,
    setShowAddTransaction, setShowBudgetModal, dismissedClosingAlerts,
    setDismissedClosingAlerts, setShowClosingCheckModal,
    expandedCreditGroups, setExpandedCreditGroups,
    setEditingTransaction,
    setShowTutorial, setTutorialPage,
    setShowRecurringModal, setEditingRecurring, deleteRecurring,
    getSettlementDate, setActiveTab,
    wallets, walletBalances,
    userInfo, lifePlan, assetData,
  } = props;
  const formatYM = (ym) => { const [y, m] = ym.split('-'); return `${y}年${parseInt(m)}月`; };

  // ①③ インサイト & 月末予測（今月のみ）
  const insightData = useMemo(() => {
    const today = new Date();
    const toYM  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const ym    = toYM(today);
    if (monthlyHistory[ym]) return null;
    const bal    = calculateMonthlyBalance(ym);
    const inc    = bal.plIncome  || 0;
    const exp    = bal.plExpense || 0;
    const cf     = bal.cfBalance || 0;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    const daysPassed  = today.getDate();
    const daysLeft    = daysInMonth - daysPassed;
    const dailyRate   = daysPassed > 0 ? exp / daysPassed : 0;
    const projectedExp = Math.round(dailyRate * daysInMonth);
    const projectedDiff = inc - projectedExp;
    const cfLeft = cf - Math.round(dailyRate * daysLeft);
    const msgs = [];
    if (inc > 0 && exp > 0) {
      const ratio = exp / inc;
      if (ratio < 0.6)  msgs.push({ icon: '📈', text: `このペースだと今月 +¥${Math.abs(projectedDiff).toLocaleString()} 黒字予測`, color: '#0cff8c' });
      else if (ratio < 0.9) msgs.push({ icon: '👍', text: `支出は収入の${Math.round(ratio*100)}%。良いペースです`, color: '#00e5ff' });
      else msgs.push({ icon: '⚠️', text: `支出が収入の${Math.round(ratio*100)}%。このペースは要注意`, color: '#ff9f0a' });
    }
    if (cf > 0 && daysPassed > 0) {
      msgs.push({ icon: '💳', text: `今月あと¥${cfLeft.toLocaleString()}使えます（CF残高ベース）`, color: '#a855f7' });
    }
    return { msgs, projectedExp, projectedDiff, daysLeft, inc, exp };
  }, [transactions, recurringTransactions, monthlyHistory, calculateMonthlyBalance]);

  // ④ 初回チェックリスト
  const checklistItems = useMemo(() => {
    const today = new Date();
    const toYM  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const ym    = toYM(today);
    const hasCard   = creditCards && creditCards.length > 0;
    const hasTxn3   = transactions.filter(t => t.date.startsWith(ym)).length >= 3;
    const hasClosed = Object.keys(monthlyHistory).length > 0;
    const hasSimu   = true;
    const allDone   = hasCard && hasTxn3 && hasClosed;
    if (allDone) return null;
    return [
      { label: 'クレカを登録する',       done: hasCard,   action: () => setActiveTab('settings') },
      { label: '今月の取引を3件入力する', done: hasTxn3,   action: () => setShowAddTransaction(true) },
      { label: '今月を締める',            done: hasClosed, action: () => openCloseMonthModal() },
    ];
  }, [creditCards, transactions, monthlyHistory]);

  // ===== C: 貯蓄率KPI =====
  const savingsRateData = useMemo(() => {
    const today = new Date();
    const toYM = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const ym = toYM(today);
    const bal = calculateMonthlyBalance(ym);
    const income = bal.plIncome || 0;
    const cfIncome = bal.cfIncome || 0;
    if (income <= 0) return null;
    // PL貯蓄率：発生ベース収入から支出を引いた割合
    const plSurplus = bal.plBalance || 0;
    const plRate = Math.round((plSurplus / income) * 100);
    // CF貯蓄率：実際に手元に残った割合
    const cfSurplus = bal.cfBalance || 0;
    const cfRate = cfIncome > 0 ? Math.round((cfSurplus / cfIncome) * 100) : null;
    // 過去3ヶ月平均
    const past3 = [-1, -2, -3].map(offset => {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const pym = toYM(d);
      if (monthlyHistory[pym]) {
        const h = monthlyHistory[pym];
        return h.plBalance && h.plIncome ? h.plBalance / h.plIncome : null;
      }
      return null;
    }).filter(v => v !== null);
    const avg3 = past3.length > 0 ? Math.round((past3.reduce((a,b) => a+b, 0) / past3.length) * 100) : null;
    // 目標貯蓄率（FIRE基準: 25%が最低ライン、50%でFIRE加速）
    const grade = plRate >= 50 ? { label: 'FIRE圏', color: '#0cff8c' }
                : plRate >= 30 ? { label: '優秀',   color: '#00e5ff' }
                : plRate >= 20 ? { label: '良好',   color: '#a855f7' }
                : plRate >= 10 ? { label: '標準',   color: '#ff9f0a' }
                :                { label: '要改善', color: '#ff453a' };
    return { plRate, cfRate, avg3, grade, income, plSurplus };
  }, [transactions, recurringTransactions, monthlyHistory, calculateMonthlyBalance]);

  // ===== B: ライフステージ先読み =====
  const lifeStageData = useMemo(() => {
    const age = userInfo?.age ? Number(userInfo.age) : null;
    if (!age) return null;
    const totalAssets = (assetData?.savings || 0) + (assetData?.investments || 0);
    const income = userInfo?.annualIncome ? Number(userInfo.annualIncome) : 0;
    const events = [];

    // 結婚（未婚想定、30代前半）
    if (age < 35 && !(lifePlan?.isMarried)) {
      const yearsTo = Math.max(1, 32 - age);
      events.push({ icon: '💍', label: '結婚', age: age + yearsTo, need: 3000000,
        note: '結婚式・新生活費用の平均', urgency: yearsTo <= 3 ? 'high' : 'mid' });
    }
    // 子供の教育費（子供の年齢を逆算）
    if (age >= 28 && age <= 50) {
      const childAge = lifePlan?.childAge || null;
      const targetAge = childAge ? childAge + 18 : null;
      const yearsToEdu = targetAge ? targetAge - age : Math.max(1, 46 - age);
      if (yearsToEdu > 0 && yearsToEdu < 20) {
        events.push({ icon: '🎓', label: '教育費（大学入学）', age: age + yearsToEdu, need: 5000000,
          note: '私立文系4年間の目安', urgency: yearsToEdu <= 5 ? 'high' : 'mid' });
      }
    }
    // 住宅購入
    if (age < 45 && !lifePlan?.hasHouse) {
      const yearsTo = Math.max(1, 38 - age);
      const downPayment = income > 0 ? Math.round(income * 0.2 * 2) : 8000000;
      events.push({ icon: '🏠', label: '住宅頭金', age: age + yearsTo, need: downPayment,
        note: '物件価格の20%が目安', urgency: yearsTo <= 3 ? 'high' : yearsTo <= 7 ? 'mid' : 'low' });
    }
    // 老後資金（65歳までに2000万）
    const yearsToRetire = Math.max(1, (lifePlan?.retirementAge || 65) - age);
    const retireNeeded = Math.max(0, 20000000 - totalAssets);
    if (retireNeeded > 0) {
      events.push({ icon: '🏖️', label: '老後資金', age: lifePlan?.retirementAge || 65, need: retireNeeded,
        note: '金融庁試算の2000万円基準', urgency: yearsToRetire <= 10 ? 'high' : 'low' });
    }

    // 月々の必要積立額を逆算
    const withMonthly = events.map(ev => {
      const years = Math.max(0.5, ev.age - age);
      const monthly = Math.round(ev.need / (years * 12));
      return { ...ev, yearsTo: Math.round(years * 10) / 10, monthly };
    });

    return withMonthly.sort((a, b) => a.yearsTo - b.yearsTo).slice(0, 3);
  }, [userInfo, assetData, lifePlan]);

  // ===== L: 転職シミュレーター =====
  const [jobChangeAmount, setJobChangeAmount] = useState(0); // 万円単位
  const jobChangeData = useMemo(() => {
    if (!jobChangeAmount || jobChangeAmount === 0) return null;
    const age = userInfo?.age ? Number(userInfo.age) : 35;
    const retireAge = lifePlan?.retirementAge || 65;
    const years = Math.max(1, retireAge - age);
    const returnRate = (simulationSettings?.returnRate || 5) / 100;
    const annualChange = jobChangeAmount * 10000;
    const monthlyChange = Math.round(annualChange * 0.75 / 12); // 手取り換算（概算）
    // 複利で積み上がる追加資産
    const r = returnRate / 12;
    const n = years * 12;
    const futureValue = monthlyChange * ((Math.pow(1 + r, n) - 1) / r);
    // 目標達成が何年早まるか（現在の貯蓄率ベース）
    const currentMonthly = simulationSettings?.monthlyInvestment || 0;
    const yearsEarlier = currentMonthly > 0
      ? Math.round((Math.abs(monthlyChange) / currentMonthly) * 3 * 10) / 10
      : null;
    return {
      annualChange,
      monthlyChange,
      futureValue: Math.round(futureValue),
      yearsEarlier: jobChangeAmount > 0 ? yearsEarlier : null,
      isPositive: jobChangeAmount > 0,
    };
  }, [jobChangeAmount, userInfo, lifePlan, simulationSettings]);

  return (
          <div className="space-y-3 animate-fadeIn">

            {unclosedMonths.length > 0 && (
              <div style={{ borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${theme.orange}`, backgroundColor: darkMode ? 'rgba(255,145,0,0.08)' : 'rgba(255,109,0,0.05)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1" style={{ color: theme.orange }}>⚠ 未締めの月があります</p>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>以下の月の収支がまだ確定していません。</p>
                    <p className={`text-xs mb-2`} style={{ color: darkMode ? '#888' : '#999' }}>確定すると貯金・投資額が資産タブに反映され、翌月の管理を始められます。</p>
                    <div className="flex flex-wrap gap-2">
                      {unclosedMonths.map(ym => (
                        <button
                          key={ym}
                          onClick={() => openCloseMonthModal(ym)}
                          style={{
                            padding: '6px 12px', borderRadius: 4,
                            border: `1px solid ${theme.orange}`,
                            background: `${theme.orange}20`,
                            color: theme.orange, fontSize: 11, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.04em', cursor: 'pointer',
                          }}
                        >
                          {formatYM(ym)}の収支を確定する
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* checklist */}
            {checklistItems && (
              <div style={{ borderRadius: 10, padding: '12px 14px', background: darkMode ? '#0f0f0f' : '#f8f8f8', border: `1px solid ${darkMode ? '#1e1e1e' : '#e8e8e8'}` }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#00e5ff', marginBottom: 10, textTransform: 'uppercase' }}>GETTING STARTED</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {checklistItems.map((item, i) => (
                    <button key={i} onClick={item.done ? undefined : item.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: item.done ? 'default' : 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${item.done ? '#0cff8c' : (darkMode ? '#333' : '#ccc')}`, background: item.done ? '#0cff8c20' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.done && <span style={{ fontSize: 10, color: '#0cff8c' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: item.done ? (darkMode ? '#444' : '#bbb') : (darkMode ? '#e0e0e0' : '#333'), textDecoration: item.done ? 'line-through' : 'none', fontWeight: item.done ? 400 : 600 }}>{item.label}</span>
                      {!item.done && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#00e5ff' }}>→</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* today insight */}
            {insightData && insightData.msgs.length > 0 && (
              <div style={{ borderRadius: 10, padding: '10px 14px', background: darkMode ? '#0a0a0a' : '#f5f5f5', border: `1px solid ${darkMode ? '#1a1a1a' : '#ebebeb'}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {insightData.msgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontSize: 12, color: m.color, fontWeight: 600, lineHeight: 1.4 }}>{m.text}</span>
                  </div>
                ))}
                {insightData.inc > 0 && insightData.daysLeft > 0 && (
                  <div style={{ marginTop: 2, paddingTop: 6, borderTop: `1px solid ${darkMode ? '#1a1a1a' : '#e8e8e8'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: darkMode ? '#555' : '#aaa' }}>月末まであと{insightData.daysLeft}日</span>
                    <span style={{ fontSize: 10, color: insightData.projectedDiff >= 0 ? '#0cff8c' : '#ff453a', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      予測: {insightData.projectedDiff >= 0 ? '+' : ''}¥{insightData.projectedDiff.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ===== C: 貯蓄率KPI ===== */}
            {savingsRateData && (
              <div style={{ borderRadius: 12, overflow: 'hidden', background: darkMode ? '#0f0f0f' : '#fff', border: `1px solid ${darkMode ? '#1e1e1e' : '#e5e7eb'}` }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${darkMode ? '#1a1a1a' : '#f0f0f0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: darkMode ? '#555' : '#aaa', marginBottom: 3 }}>今月の貯蓄率</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 800, color: savingsRateData.grade.color }}>
                          {savingsRateData.plRate}%
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: savingsRateData.grade.color, padding: '2px 8px', borderRadius: 20, background: `${savingsRateData.grade.color}20` }}>
                          {savingsRateData.grade.label}
                        </span>
                      </div>
                    </div>
                    {savingsRateData.avg3 !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb', marginBottom: 2 }}>3ヶ月平均</p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: darkMode ? '#666' : '#aaa' }}>{savingsRateData.avg3}%</p>
                      </div>
                    )}
                  </div>
                  {/* プログレスバー */}
                  <div style={{ height: 6, borderRadius: 3, background: darkMode ? '#1a1a1a' : '#f0f0f0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(savingsRateData.plRate, 100)}%`, borderRadius: 3, background: savingsRateData.grade.color, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: darkMode ? '#333' : '#ddd' }}>0%</span>
                    <span style={{ fontSize: 9, color: darkMode ? '#444' : '#ccc' }}>目標20%</span>
                    <span style={{ fontSize: 9, color: darkMode ? '#444' : '#ccc' }}>FIRE圏50%</span>
                  </div>
                </div>
                {savingsRateData.cfRate !== null && (
                  <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: darkMode ? '#555' : '#aaa' }}>CF（実現金）ベース</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: darkMode ? '#888' : '#666' }}>{savingsRateData.cfRate}%</span>
                  </div>
                )}
              </div>
            )}

            {/* ===== B: ライフステージ先読み ===== */}
            {lifeStageData && lifeStageData.length > 0 && (
              <div style={{ borderRadius: 12, background: darkMode ? '#0f0f0f' : '#fff', border: `1px solid ${darkMode ? '#1e1e1e' : '#e5e7eb'}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${darkMode ? '#1a1a1a' : '#f0f0f0'}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: darkMode ? '#555' : '#aaa' }}>UPCOMING MILESTONES</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {lifeStageData.map((ev, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: i < lifeStageData.length - 1 ? `1px solid ${darkMode ? '#141414' : '#f5f5f5'}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: ev.urgency === 'high' ? 'rgba(255,69,58,0.12)' : ev.urgency === 'mid' ? 'rgba(255,159,10,0.12)' : 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {ev.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: darkMode ? '#e0e0e0' : '#111', marginBottom: 2 }}>{ev.label}</p>
                            <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb' }}>{ev.note}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: ev.urgency === 'high' ? '#ff453a' : ev.urgency === 'mid' ? '#ff9f0a' : '#00e5ff' }}>
                              ¥{(ev.need / 10000).toFixed(0)}万
                            </p>
                            <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb' }}>{ev.yearsTo}年後・{ev.age}歳</p>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 6, background: darkMode ? '#0a0a0a' : '#f8f8f8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, color: darkMode ? '#555' : '#aaa' }}>月々</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: darkMode ? '#888' : '#444' }}>¥{ev.monthly.toLocaleString()}</span>
                          <span style={{ fontSize: 9, color: darkMode ? '#555' : '#aaa' }}>の積立が必要</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 16px', background: darkMode ? '#080808' : '#fafafa', borderTop: `1px solid ${darkMode ? '#141414' : '#f0f0f0'}` }}>
                  <p style={{ fontSize: 9, color: darkMode ? '#333' : '#ddd', textAlign: 'center' }}>
                    ※ライフプラン設定で家族構成・住宅取得状況を更新すると精度が上がります
                  </p>
                </div>
              </div>
            )}

            {/* ===== L: 転職シミュレーター ===== */}
            <div style={{ borderRadius: 12, background: darkMode ? '#0f0f0f' : '#fff', border: `1px solid ${darkMode ? '#1e1e1e' : '#e5e7eb'}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 12px', borderBottom: jobChangeData ? `1px solid ${darkMode ? '#1a1a1a' : '#f0f0f0'}` : 'none' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: darkMode ? '#555' : '#aaa', marginBottom: 10 }}>転職シミュレーター</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 12, color: darkMode ? '#888' : '#666', whiteSpace: 'nowrap' }}>年収が</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[-100, -50, 50, 100, 200].map(v => (
                      <button key={v} onClick={() => setJobChangeAmount(jobChangeAmount === v ? 0 : v)}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${jobChangeAmount === v ? (v > 0 ? '#0cff8c' : '#ff453a') : (darkMode ? '#2a2a2a' : '#e5e7eb')}`, background: jobChangeAmount === v ? (v > 0 ? 'rgba(12,255,140,0.1)' : 'rgba(255,69,58,0.1)') : 'transparent', color: jobChangeAmount === v ? (v > 0 ? '#0cff8c' : '#ff453a') : (darkMode ? '#666' : '#999') }}>
                        {v > 0 ? `+${v}万` : `${v}万`}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: darkMode ? '#888' : '#666', whiteSpace: 'nowrap' }}>変わったら</p>
                </div>
              </div>
              {jobChangeData && (
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: darkMode ? '#080808' : '#f8f8f8' }}>
                      <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb', marginBottom: 4 }}>手取り増減/月</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: jobChangeData.isPositive ? '#0cff8c' : '#ff453a' }}>
                        {jobChangeData.isPositive ? '+' : ''}¥{jobChangeData.monthlyChange.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: darkMode ? '#080808' : '#f8f8f8' }}>
                      <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb', marginBottom: 4 }}>退職までの総資産差</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: jobChangeData.isPositive ? '#0cff8c' : '#ff453a' }}>
                        {jobChangeData.isPositive ? '+' : ''}{(jobChangeData.futureValue / 10000).toFixed(0)}万
                      </p>
                    </div>
                  </div>
                  {jobChangeData.yearsEarlier && jobChangeData.isPositive && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(12,255,140,0.06)', border: '1px solid rgba(12,255,140,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>🚀</span>
                      <p style={{ fontSize: 11, color: '#0cff8c', fontWeight: 600 }}>
                        目標達成が約{jobChangeData.yearsEarlier}年早まります
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: 9, color: darkMode ? '#333' : '#ddd', marginTop: 8, textAlign: 'right' }}>
                    ※複利({(simulationSettings?.returnRate || 5)}%/年)・手取り75%換算の概算
                  </p>
                </div>
              )}
            </div>

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
                  className={`${theme.cardGlass} rounded-lg overflow-hidden select-none`}
                  onTouchStart={e => { e.currentTarget._startX = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const dx = e.changedTouches[0].clientX - (e.currentTarget._startX || 0);
                    // 右スワイプ=前月へ(offset-1)、左スワイプ=翌月へ(offset+1)
                    if (Math.abs(dx) > 40) setSummaryMonthOffset(o => Math.max(-11, Math.min(0, o + (dx > 0 ? -1 : 1))));
                  }}
                >

                  <div className="px-5 pt-5 pb-4" style={{
                    background: darkMode
                      ? isPositive
                        ? 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, transparent 60%)'
                        : 'linear-gradient(135deg, rgba(255,61,87,0.10) 0%, transparent 60%)'
                      : isPositive
                        ? 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, transparent 60%)'
                        : 'linear-gradient(135deg, rgba(229,57,53,0.06) 0%, transparent 60%)'
                  }}>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">

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

                    <div className="mb-1">
                      <p className={`text-[10px] font-medium ${theme.textSecondary} mb-1`}>収支</p>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 32, fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        color: isPositive ? theme.green : theme.red,
                        letterSpacing: '-0.04em',
                        textShadow: isPositive ? `0 0 20px ${theme.green}50` : `0 0 20px ${theme.red}40`,
                      }}>
                        {isPositive ? '+' : '−'}¥{Math.abs(diff).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4" style={{
                    borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                  }}>
                    {inc > 0 || exp > 0 ? (() => {
                      const savingsPct = inc > 0 ? Math.max(0, Math.round((1 - exp / inc) * 100)) : 0;
                      const expBarPct = inc > 0 ? Math.min((exp / inc) * 100, 100) : 100;
                      return (
                        <div>

                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.green }}>↑ 収入</p>
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: theme.green }}>¥{inc.toLocaleString()}</p>
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
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: theme.red }}>¥{exp.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>

                            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: theme.green, opacity: 0.25 }} />

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

                            {!isPositive && (
                              <div className="absolute top-0 right-0 h-full w-2 rounded-r-full animate-pulse" style={{ backgroundColor: theme.red }} />
                            )}
                          </div>

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

                    <div className="flex justify-center gap-1 mt-3">
                      {[-2,-1,0].map(o => (
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

            {(() => {
              // 支払い取引（引き落とし予定を除く）を日付降順でグループ化
              const visibleTxns = transactions.filter(t => !t.isSettlement);
              const showAll = recentTxnLimit >= 9999;
              const displayTxns = showAll ? visibleTxns : visibleTxns.slice(0, 3);

              // 月ごとにグループ化
              const groups = [];
              displayTxns.forEach(t => {
                const ym = t.date.slice(0, 7);
                const label = ym === currentMonth
                  ? `今月（${formatYM(ym)}）`
                  : formatYM(ym);
                const last = groups[groups.length - 1];
                if (!last || last.ym !== ym) groups.push({ ym, label, items: [t] });
                else last.items.push(t);
              });

              const TxnRow = ({ t, idx }) => (
                <div
                  key={t.id}
                  onClick={() => setEditingTransaction(t)}
                  className={`flex items-center gap-3 px-1 py-3 cursor-pointer transition-all duration-150 animate-fadeIn ${darkMode ? 'hover:bg-neutral-700/30' : 'hover:bg-neutral-50'}`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${
                    t.type==='income' ? (darkMode?'bg-green-500/15':'bg-green-50') :
                    t.paymentMethod==='credit' || t.paymentMethod==='paypay' ? (darkMode?'bg-blue-500/15':'bg-blue-50') :
                    (darkMode?'bg-neutral-800':'bg-neutral-100')
                  }`}>
                    {t.isRecurring ? (t.isInvestment ? '📈' : '🔄') : t.isCharge ? '⚡' : t.type === 'income' ? '💰' : (t.paymentMethod === 'credit' || t.paymentMethod === 'paypay' ? '💳' : t.paymentMethod === 'wallet' ? '👛' : '💵')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                      {!t.settled && t.type === 'expense' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: 'rgba(255,159,10,0.15)', color: theme.orange }}>未確定</span>
                      )}
                      {t.isSplit && (() => {
                        const members = t.splitMembers || [];
                        const allSettled = members.length > 0 && members.every(m => m.settled);
                        const settledCount = members.filter(m => m.settled).length;
                        return (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${allSettled ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-400'}`}>
                            {allSettled ? '👥精算済' : `👥${settledCount}/${members.length}人`}
                          </span>
                        );
                      })()}
                    </div>
                    <p className={`text-xs ${theme.textSecondary} mt-0.5 truncate`}>
                      {t.memo || ''}
                      {t.memo && <span className="mx-1 opacity-40">·</span>}
                      <span className="opacity-70">{t.date.slice(5).replace('-','/')}</span>
                      {t.isTransfer && <span className="ml-1.5 text-[10px] font-medium" style={{ color: '#FF9F0A' }}>💱チャージ</span>}
                      {!t.isTransfer && (t.paymentMethod === 'credit' || t.paymentMethod === 'paypay' || t.paymentMethod === 'wallet') && (
                        <span className={`ml-1.5 text-[10px] font-medium ${t.paymentMethod === 'wallet' ? (darkMode ? 'text-purple-400' : 'text-purple-500') : (darkMode ? 'text-blue-400' : 'text-blue-500')}`}>
                          {t.paymentMethod === 'paypay' ? 'PayPay' : t.paymentMethod === 'wallet' ? '📲電子マネー' : 'クレジット'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: t.amount >= 0 ? theme.green : (t.isInvestment ? '#a855f7' : theme.red) }}>
                      {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              );

              return (
                <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>

                  <div className="flex items-center justify-between px-4 py-3">
                    <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00e5ff' }}>RECENT TXN</h2>
                    <button
                      onClick={() => setShowAllTransactions && setShowAllTransactions(true)}
                      className={`text-xs font-semibold`}
                      style={{ color: theme.accent }}
                    >
                      もっと見る ›
                    </button>
                  </div>

                  {transactions.length === 0 ? (
                    <p className={`text-sm text-center py-10 ${theme.textSecondary}`}>まだ取引がありません</p>
                  ) : (
                    <>

                      {groups.map((group, gi) => (
                        <div key={group.ym}>

                          <div className={`px-4 py-1.5 ${darkMode ? 'bg-neutral-800/60' : 'bg-neutral-100/80'}`}>
                            <span className={`text-xs font-semibold ${theme.textSecondary}`}>{group.label}</span>
                          </div>

                          <div className="px-3">
                            {group.items.map((t, idx) => (
                              <div key={t.id}>
                                <TxnRow t={t} idx={gi * 10 + idx} />
                                {idx < group.items.length - 1 && (
                                  <div className={`h-px mx-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {visibleTxns.length > 3 && (
                        <button
                          onClick={() => setShowAllTransactions && setShowAllTransactions(true)}
                          className={`w-full py-3 text-xs font-semibold border-t transition-all ${darkMode ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-800/40' : 'border-neutral-100 text-neutral-500 hover:bg-neutral-50'}`}
                        >
                          もっと見る（全{visibleTxns.length}件）›
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>

              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => setShowRecurringList(!showRecurringList)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00e5ff' }}>定期支払い</span>
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
                <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>

                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setShowPayments(!showPayments)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00e5ff' }}>今月の支払い予定</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>{allItems.length}件</span>
                        <span className={`text-xs ${theme.textSecondary} ml-auto mr-2`} style={{ display: 'inline-block', transform: showPayments ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
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

                  {showPayments && (
                    <div className="border-t animate-fadeIn" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <div className="divide-y" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                        {allItems.map((item, i) => {
                          const groupKey = item.kind === 'credit' ? `credit-${item.cardId}` : `fixed-${i}`;
                          const isExpanded = !!expandedCreditGroups[groupKey];
                          const canExpand = item.kind === 'credit' && item.details && item.details.length > 1;
                          return (
                            <div key={i}>

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

            {splitPayments.filter(s => !s.settled).length > 0 && (
              <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>

                <button
                  onClick={() => setShowSplit2(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">👥</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff' }}>立替待ち</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white">
                      {splitPayments.filter(s => !s.settled).length}人
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>
                      合計 ¥{splitPayments.filter(s => !s.settled).reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs ${theme.textSecondary}`} style={{ display:'inline-block', transform: showSplit2 ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▼</span>
                </button>

                {showSplit2 && (
                  <div className={`border-t ${theme.border} animate-fadeIn`}>
                    {splitPayments.filter(s => !s.settled).map(sp => (
                      <div key={sp.id} className={`px-4 py-3 border-b ${theme.border} last:border-b-0`}>

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
                            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white hover-scale transition-all"
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

            {(() => {
              const today = new Date();
              const toYM = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              const targetMonth = toYM(new Date(today.getFullYear(), today.getMonth() + summaryMonthOffset, 1));
              const bal = calculateMonthlyBalance(targetMonth);
              const ba = budgetAnalysis;
              const isCurrentMonthView = targetMonth === toYM(today);
              if (!isCurrentMonthView) return null; // 今月だけ表示
              if (ba.income.actual === 0 && ba.expense.actual === 0) return null;
              const items = calculateCategoryExpenses();
              const catTotal = items.reduce((s,i) => s + i.amount, 0);
              return (
                <div className={`${theme.cardGlass} rounded-lg overflow-hidden`}>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#00e5ff' }}>今月の収支詳細</h2>
                    <button onClick={() => setShowBudgetModal(true)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                      予算設定 →
                    </button>
                  </div>
                  <div className={`border-t ${theme.border}`}>

                    <div className="grid grid-cols-2 divide-x" style={{ borderColor: darkMode ? '#2a2a2a' : '#f0f0f0' }}>
                      {[
                        { label: '収入 (PL)', val: ba.income.actual, color: theme.green },
                        { label: '支出 (PL)', val: ba.expense.actual, color: ba.expense.difference<=0 ? theme.green : theme.red },
                      ].map(({ label, val, color }) => (
                        <div key={label} className={`p-3 ${darkMode ? 'divide-neutral-800' : 'divide-neutral-100'}`}>
                          <p className={`text-[10px] ${theme.textSecondary} mb-0.5`}>{label}</p>
                          <p className="text-base font-bold tabular-nums" style={{ color }}>
                            ¥{(val/10000).toFixed(1)}万
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className={`px-3 py-2 flex justify-between items-center border-t ${theme.border}`}>
                      <span className={`text-xs ${theme.textSecondary}`}>月次収支（PL）</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: currentBalance.plBalance>=0?theme.green:theme.red }}>
                        {currentBalance.plBalance>=0?'+':''}¥{currentBalance.plBalance.toLocaleString()}
                      </span>
                    </div>

                    {items.length > 0 && (
                      <div className={`px-3 pt-2 pb-3 border-t ${theme.border}`}>
                        <p className={`text-[10px] font-bold ${theme.textSecondary} mb-2 uppercase tracking-wide`}>支出内訳</p>
                        <div className="space-y-2">
                          {items.slice(0,5).map((item, idx) => {
                            const pct = catTotal > 0 ? item.amount / catTotal * 100 : 0;
                            const bd = ba.categoryComparison?.[item.category];
                            return (
                              <div key={item.category}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className={`text-xs font-medium ${theme.text}`}>{item.category}</span>
                                  <div className="flex items-center gap-1.5">
                                    {bd && bd.budgeted > 0 && (
                                      <span className="text-[10px] px-1 py-0.5 rounded font-semibold"
                                        style={{ background: bd.difference<=0?'rgba(12,214,100,0.15)':'rgba(255,69,58,0.15)',
                                          color: bd.difference<=0?theme.green:theme.red }}>
                                        {bd.percentage.toFixed(0)}%
                                      </span>
                                    )}
                                    <span className={`text-xs font-semibold tabular-nums ${theme.text}`}>¥{item.amount.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode?'bg-neutral-800':'bg-neutral-200'}`}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bd&&bd.difference>0?theme.red:theme.accent }} />
                                </div>
                              </div>
                            );
                          })}
                          {items.length > 5 && (
                            <p className={`text-[10px] text-center ${theme.textSecondary}`}>他 {items.length-5} カテゴリ</p>
                          )}
                        </div>
                      </div>
                    )}

                    {!monthlyHistory[targetMonth] && currentBalance.cfBalance !== 0 && (
                      <div className="px-3 pb-3">
                        <button onClick={() => openCloseMonthModal()}
                          className="w-full py-2.5 rounded-lg font-semibold text-white transition-all hover-scale text-sm"
                          style={{ backgroundColor: theme.accent }}>
                          今月の収支を確定する
                        </button>
                        <p className={`text-[10px] text-center mt-1.5 ${theme.textSecondary}`}>確定すると資産タブに反映されます</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>

  );
}
