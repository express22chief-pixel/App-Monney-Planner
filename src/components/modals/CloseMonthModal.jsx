import React, { useMemo, useState } from 'react';
import { BarChart2, TrendingUp, Sparkles } from 'lucide-react';
import { calcFutureImpact, BENCHMARK_DATA } from '../../utils/calc';

function formatYM(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
}

export default function CloseMonthModal(props) {
  const {
    theme, darkMode,
    closingTargetMonth, closeMonthData, setCloseMonthData,
    closeMonth, setShowCloseMonthModal,
    simulationSettings, calculateMonthlyBalance, currentBalance, budgetAnalysis,
    lifePlan, userInfo,
    transactions,
  } = props;

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [step, setStep] = useState('review'); // 'review' → 'allocate'
  const targetMonth = closingTargetMonth || (currentBalance ? undefined : null);
  const tb = calculateMonthlyBalance(targetMonth);
  const cfBalance = isNaN(tb?.cfBalance) ? 0 : tb.cfBalance;

  // 将来影響計算
  const currentAge     = userInfo?.age ? Number(userInfo.age) : 30;
  const yearsRemaining = Math.max(1, (lifePlan?.retirementAge ?? 65) - currentAge);
  const returnRate     = simulationSettings?.returnRate ?? 5;

  // 余剰を全額投資した場合 vs 現在の投資額の差
  const extraInvest    = Math.max(0, closeMonthData.investAmount - (simulationSettings?.monthlyInvestment ?? 0));
  const surplusImpact  = useMemo(
    () => calcFutureImpact(closeMonthData.investAmount, yearsRemaining, returnRate),
    [closeMonthData.investAmount, yearsRemaining, returnRate]
  );
  const maxInvestImpact = useMemo(
    () => calcFutureImpact(cfBalance, yearsRemaining, returnRate),
    [cfBalance, yearsRemaining, returnRate]
  );

  const card   = theme?.chart  || (darkMode ? '#1c1c1e' : '#fff');
  const bg     = darkMode ? '#111'    : '#f2f2f7';
  const txt    = darkMode ? '#f5f5f5' : '#111';
  const sub    = darkMode ? '#9ca3af' : '#6b7280';
  const bdr    = darkMode ? '#2a2a2a' : '#e5e7eb';
  const green  = theme?.green   || '#10b981';
  const red    = theme?.red     || '#ef4444';
  const orange = theme?.orange  || '#f59e0b';
  const blue   = theme?.accent  || '#3b82f6';
  const purple = theme?.purple  || '#a855f7';

  // ──────────────────────────────────────────
  // STEP 1: 取引確認画面
  // ──────────────────────────────────────────
  if (step === 'review' && !showSummary) {
    const monthTxns = (transactions || [])
      .filter(t => t.date?.startsWith(targetMonth) && !t.isSettlement)
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalIncome  = monthTxns.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const totalExpense = Math.abs(monthTxns.filter(t => t.amount < 0).reduce((s,t) => s + t.amount, 0));

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
        <div style={{ width: '100%', maxWidth: 480, background: card, borderRadius: '20px 20px 0 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>

          {/* ヘッダー */}
          <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: blue, letterSpacing: '0.04em' }}>STEP 1 / 2</p>
              <button onClick={() => setShowCloseMonthModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 18 }}>✕</button>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: txt }}>記入漏れを確認する</p>
            <p style={{ fontSize: 12, color: sub, marginTop: 4, lineHeight: 1.6 }}>
              {formatYM(targetMonth)}の取引一覧です。<br/>漏れがなければ次へ進んでください。
            </p>
          </div>

          {/* サマリー */}
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${bdr}`, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: '収入', value: totalIncome,             color: green },
              { label: '支出', value: totalExpense,            color: red },
              { label: '件数', value: monthTxns.length + '件', color: txt, isText: true },
            ].map(({ label, value, color, isText }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: darkMode ? '#181818' : '#f5f5f5', border: `1px solid ${bdr}` }}>
                <p style={{ fontSize: 10, color: sub, marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: isText ? 14 : 12, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                  {isText ? value : `¥${Math.round(value/1000)}k`}
                </p>
              </div>
            ))}
          </div>

          {/* 取引リスト */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {monthTxns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: sub }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>📭</p>
                <p style={{ fontSize: 13 }}>この月の取引がありません</p>
              </div>
            ) : monthTxns.map((t, i) => (
              <div key={t.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid ${bdr}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  background: t.amount >= 0 ? (darkMode ? 'rgba(0,230,118,0.1)' : 'rgba(0,200,83,0.07)') : (darkMode ? 'rgba(255,61,87,0.1)' : 'rgba(229,57,53,0.07)') }}>
                  {t.amount >= 0 ? '💰' : t.paymentMethod === 'credit' ? '💳' : '💵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.category}</p>
                  <p style={{ fontSize: 10, color: sub }}>{t.date.slice(5)} {t.memo ? `· ${t.memo}` : ''}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: t.amount >= 0 ? green : red, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {t.amount >= 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* フッター */}
          <div style={{ padding: '14px 20px', flexShrink: 0, borderTop: `1px solid ${bdr}`, display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCloseMonthModal(false)}
              style={{ flex: 1, padding: '13px', background: darkMode ? '#252525' : '#f2f2f7', border: 'none', borderRadius: 12, color: sub, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              あとで追記する
            </button>
            <button onClick={() => setStep('allocate')}
              style={{ flex: 2, padding: '13px', background: blue, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              問題なし → 振り分けへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary && summaryData) {
    const isPositive = summaryData.plBalance >= 0;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(8px)', padding: '0 20px' }}>
        <div style={{ width: '100%', maxWidth: 380, background: darkMode ? '#111' : '#fff', borderRadius: 24, padding: 28, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: isPositive ? 'rgba(12,255,140,0.15)' : 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            {isPositive ? '🎉' : '📊'}
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#00e5ff', marginBottom: 6, textTransform: 'uppercase' }}>
            {formatYM(summaryData.month)} 振り返り完了
          </p>
          <p style={{ fontSize: 32, fontWeight: 900, color: isPositive ? '#0cff8c' : red, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
            {isPositive ? '+' : ''}¥{(summaryData.plBalance/10000).toFixed(1)}万
          </p>
          <p style={{ fontSize: 12, color: darkMode ? '#666' : '#bbb', marginBottom: 20 }}>今月のPL収支</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { label: '貯金に追加', val: summaryData.saved, color: blue },
              { label: '投資に追加', val: summaryData.invest, color: purple },
            ].map(({label, val, color}) => (
              <div key={label} style={{ background: darkMode ? '#1a1a1a' : '#f5f5f5', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: darkMode ? '#555' : '#aaa', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val >= 0 ? '+' : ''}¥{val.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {summaryData.peer > 0 && (
            <div style={{ background: darkMode ? '#0d0d0d' : '#f8f8f8', borderRadius: 12, padding: '10px 14px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 10, color: darkMode ? '#555' : '#aaa', marginBottom: 6 }}>同年代との比較（PL月次換算）</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: darkMode ? '#888' : '#999' }}>同世代月平均貯蓄</span>
                <span style={{ fontSize: 12, color: darkMode ? '#888' : '#999', fontVariantNumeric: 'tabular-nums' }}>¥{(summaryData.peer/12).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} / 月</span>
              </div>
              {summaryData.plBalance > 0 && (
                <p style={{ fontSize: 11, color: summaryData.plBalance > summaryData.peer/12 ? '#0cff8c' : '#ff9f0a', fontWeight: 700, marginTop: 4 }}>
                  {summaryData.plBalance > summaryData.peer/12 ? `平均より +¥${(summaryData.plBalance - summaryData.peer/12).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 上回っています 🎯` : `平均まであと +¥${(summaryData.peer/12 - summaryData.plBalance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} `}
                </p>
              )}
            </div>
          )}
          <button onClick={() => setShowSummary(false)}
            style={{ width: '100%', padding: '13px', background: '#00e5ff', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            資産タブで確認する →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, background: card,
        borderRadius: '20px 20px 0 0', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>

        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: blue, letterSpacing: '0.04em' }}>STEP 2 / 2</p>
            <button onClick={() => setStep('review')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: sub, display: 'flex', alignItems: 'center', gap: 3 }}>
              ← 取引一覧に戻る
            </button>
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: txt }}>
            振り分けを設定する
          </p>
          <p style={{ fontSize: 12, color: sub, marginTop: 2 }}>貯金・投資・待機資金への振り分けを決めて確定しましょう</p>
          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: darkMode ? 'rgba(0,229,255,0.06)' : 'rgba(59,130,246,0.06)',
            borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(0,229,255,0.15)' : 'rgba(59,130,246,0.15)'}`,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 11, color: darkMode ? '#7dd3fc' : '#3b82f6', lineHeight: 1.6, margin: 0 }}>
              <strong>振り分けとは？</strong> 月の収支を確認して、余剰資金を貯金・投資に配分する作業です。
              「いくら投資に回すか」を毎月自分で決めることで、資産形成を意識的に進められます。
            </p>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'PL（発生ベース）', val: tb?.plBalance ?? 0, tip: 'クレカ未払い含む今月の損益' },
              { label: 'CF（現金ベース）', val: cfBalance, tip: '実際に口座を出入りした現金' },
            ].map(({ label, val, tip }) => (
              <div key={label} style={{ background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: sub, marginBottom: 2 }}>{label}</p>
                {tip && <p style={{ fontSize: 9, color: darkMode ? '#555' : '#aaa', marginBottom: 4 }}>{tip}</p>}
                <p style={{ fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: val >= 0 ? green : red }}>
                  {val >= 0 ? '+' : ''}¥{val.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {budgetAnalysis?.investment?.needsWithdrawal && (!targetMonth) && (
            <div style={{ padding: '12px 14px', background: darkMode ? '#2b1a08' : '#fffbeb', borderRadius: 12, border: `1px solid ${darkMode ? '#78350f' : '#fde68a'}` }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: orange, marginBottom: 4 }}>⚠ 投資計画のお知らせ</p>
              <p style={{ fontSize: 11, color: darkMode ? '#d97706' : '#92400e' }}>
                今月のCFだけでは投資計画を達成できません。<br/>
                貯金から <strong>¥{budgetAnalysis.investment.withdrawalAmount.toLocaleString()}</strong> を取り崩して投資します。
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: purple }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: txt }}>投資へ</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: purple, fontVariantNumeric: 'tabular-nums' }}>
                  ¥{closeMonthData.investAmount.toLocaleString()}
                </span>
              </div>
              <input type="range" min="0"
                max={Math.max(cfBalance, simulationSettings?.monthlyInvestment ?? 0)}
                step="1000" value={closeMonthData.investAmount}
                onChange={e => {
                  const v = Number(e.target.value);
                  setCloseMonthData({ ...closeMonthData, investAmount: v, savedAmount: cfBalance - v - closeMonthData.dryPowderAmount });
                }}
                style={{ width: '100%', accentColor: purple }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: txt }}>待機資金へ</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: theme.accent }}>
                  ¥{closeMonthData.dryPowderAmount.toLocaleString()}
                </span>
              </div>
              <input type="range" min="0"
                max={cfBalance - closeMonthData.investAmount}
                step="1000" value={closeMonthData.dryPowderAmount}
                onChange={e => {
                  const v = Number(e.target.value);
                  setCloseMonthData({ ...closeMonthData, dryPowderAmount: v, savedAmount: cfBalance - closeMonthData.investAmount - v });
                }}
                style={{ width: '100%', accentColor: theme.accent }}
              />
            </div>
          </div>

          <div style={{ background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12, padding: '12px 14px' }}>
            {[
              { label: '貯金へ',    val: closeMonthData.savedAmount,     color: blue   },
              { label: '投資へ',    val: closeMonthData.investAmount,     color: purple },
              { label: '待機資金へ', val: closeMonthData.dryPowderAmount, color: theme.accent },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${bdr}` }}>
                <span style={{ fontSize: 12, color: sub }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                  {val >= 0 ? '+' : ''}¥{val.toLocaleString()}
                </span>
              </div>
            ))}
            {closeMonthData.savedAmount < 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: orange }}>貯金から取崩</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: orange, fontVariantNumeric: 'tabular-nums' }}>
                  ¥{Math.abs(closeMonthData.savedAmount).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {cfBalance > 0 && (
            <div style={{
              padding: '14px 16px',
              background: darkMode ? 'rgba(10,132,255,0.1)' : '#eff6ff',
              borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(10,132,255,0.3)' : '#bfdbfe'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp size={14} color={blue} />
                <p style={{ fontSize: 12, fontWeight: 700, color: blue }}>この配分が将来に与える影響</p>
                <span style={{ fontSize: 10, color: sub }}>（{yearsRemaining}年後・利回り{returnRate}%）</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: sub }}>現在の配分（投資¥{closeMonthData.investAmount.toLocaleString()}）なら</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: blue, fontVariantNumeric: 'tabular-nums' }}>
                    +¥{(surplusImpact/10000).toFixed(0)}万
                  </span>
                </div>

                {cfBalance > closeMonthData.investAmount && (
                  <>
                    <div style={{ height: 1, background: bdr }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: green, fontWeight: 600 }}>
                        💡 全額投資（¥{cfBalance.toLocaleString()}）なら
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: green, fontVariantNumeric: 'tabular-nums' }}>
                        +¥{(maxInvestImpact/10000).toFixed(0)}万
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: sub }}>
                      差額¥{(cfBalance - closeMonthData.investAmount).toLocaleString()}を追加投資すると
                      {yearsRemaining}年後に <strong style={{ color: green }}>¥{((maxInvestImpact - surplusImpact)/10000).toFixed(0)}万</strong> 多くなります
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

        <div style={{ padding: '14px 20px', flexShrink: 0, borderTop: `1px solid ${bdr}`, display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCloseMonthModal(false)} style={{
            flex: 1, padding: '13px', background: darkMode ? '#252525' : '#f2f2f7',
            border: 'none', borderRadius: 12, color: sub, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s',
          }} onMouseOver={e=>e.currentTarget.style.opacity='0.8'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>キャンセル</button>
          <button onClick={() => {
            closeMonth(targetMonth);
            const getAgeGroup = age => {
              if (age < 30) return 'under30'; if (age < 40) return '30s';
              if (age < 50) return '40s'; if (age < 60) return '50s'; return '60s';
            };
            const age   = userInfo?.age ? Number(userInfo.age) : 30;
            const ag    = getAgeGroup(age);
            const peer  = BENCHMARK_DATA[ag]?.average ?? 0;
            setSummaryData({
              month: targetMonth,
              plBalance: tb?.plBalance ?? 0,
              cfBalance,
              invest: closeMonthData.investAmount,
              saved: closeMonthData.savedAmount,
              peer,
            });
            setShowSummary(true);
          }} style={{
            flex: 2, padding: '13px', background: theme.accent,
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
          }}>振り分けを確定する</button>
        </div>
      </div>
    </div>
  );
}
