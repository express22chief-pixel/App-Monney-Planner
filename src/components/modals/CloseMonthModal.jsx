import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, Sparkles } from 'lucide-react';
import { calcFutureImpact } from '../../utils/calc';

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
  } = props;

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
          <p style={{ fontSize: 17, fontWeight: 800, color: txt }}>
            {formatYM(targetMonth)}の収支を確定
          </p>
          <p style={{ fontSize: 12, color: sub, marginTop: 2 }}>集計を確定して資産に反映します</p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'PL（発生ベース）', val: tb?.plBalance ?? 0 },
              { label: 'CF（現金ベース）', val: cfBalance },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: sub, marginBottom: 4 }}>{label}</p>
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
                <span style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }} style={{ color: theme.accent }}>
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
          <button onClick={() => closeMonth(targetMonth)} style={{
            flex: 2, padding: '13px', background: theme.accent,
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
          }}>確定する</button>
        </div>
      </div>
    </div>
  );
}
