import React, { useCallback, useMemo, useState } from 'react';
import { Share2, X, Download, Plus, Settings2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import HousingComparisonModal from '../modals/HousingComparisonModal';
import LifePlanSettingsModal  from '../modals/LifePlanSettingsModal';
import { LIFE_EVENT_TEMPLATES, EVENT_ICONS } from '../../constants';

// ─── 小コンポーネント ───────────────────────────────────────────────────────

function StatPill({ label, value, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '12px 16px', flex: 1 }}>
      <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>{children}</p>
      {action}
    </div>
  );
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label, retirementAge }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(8px)',
      borderRadius: 12, padding: '10px 14px', border: '1px solid #2a2a2a',
    }}>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
        {label}歳{label >= retirementAge ? ' · リタイア後' : ''}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 12, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
          {p.name}: ¥{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── メインコンポーネント ───────────────────────────────────────────────────

export default function SimulationTab(props) {
  const {
    theme, darkMode,
    simulationSettings, setSimulationSettings,
    lifeEvents, setShowLifeEventModal, setEditingLifeEvent, deleteLifeEvent,
    addOrUpdateLifeEvent,
    userInfo, assetData,
    housingParams, setHousingParams, housingComparison,
    showHousingModal, setShowHousingModal,
    lifePlan, setLifePlan, lifePlanSimulation,
    recentMonthlyAverages, incomeGrowthEstimate, monthlyGapImpact,
    monthlyHistory, transactions, recurringTransactions,
    setActiveTab,
  } = props;

  // 実績資産推移（monthlyHistoryから累積）
  const actualAssetHistory = useMemo(() => {
    if (!monthlyHistory || !assetData) return [];
    // 締め月を時系列順に並べる
    const entries = Object.entries(monthlyHistory)
      .sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return [];
    // 各月末時点の資産合計を再構築（assetDataは現在値なので過去へ遡れないが
    // monthlyHistoryのsavedAmount/investAmountの累積から近似）
    const currentAge = userInfo?.age ? Number(userInfo.age) : 30;
    const nowYear    = new Date().getFullYear();
    return entries.map(([ym, hist]) => {
      const year = parseInt(ym.slice(0, 4));
      const age  = currentAge - (nowYear - year);
      return {
        age,
        実績余剰: hist.plBalance ?? 0,
      };
    }).filter(r => r.age >= (currentAge - 10) && r.age <= currentAge);
  }, [monthlyHistory, assetData, userInfo]);

  const [showLifePlanSettings, setShowLifePlanSettings] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [shareUrl,   setShareUrl]   = useState(null);
  const [expandEvents, setExpandEvents] = useState(false);

  const currentAge    = userInfo?.age ? Number(userInfo.age) : 30;
  const retirementAge = lifePlan.retirementAge ?? 65;
  const lifeExpectancy = lifePlan.lifeExpectancy ?? 90;

  const { byAge, summary } = lifePlanSimulation ?? { byAge: [], summary: {} };

  // ─── グラフデータ ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    return byAge.map(r => ({
      age:          r.age,
      純資産:        r.netWorth,
      金融資産:      r.totalAssets,
      不動産:        r.propertyValue,
    }));
  }, [byAge]);

  // ライフイベントのピン（グラフ上の参照線用）
  const eventPins = useMemo(() => {
    return lifeEvents.map(ev => {
      const evYear = parseInt(ev.date?.slice(0, 4));
      const evAge  = currentAge + (evYear - new Date().getFullYear());
      return { ...ev, age: evAge };
    }).filter(ev => ev.age >= currentAge && ev.age <= lifeExpectancy);
  }, [lifeEvents, currentAge, lifeExpectancy]);

  // ─── カラー ──────────────────────────────────────────────────────────
  const card = darkMode ? '#1c1c1e' : '#fff';
  const bg   = darkMode ? '#111'    : '#f2f2f7';
  const txt  = darkMode ? '#f5f5f5' : '#111';
  const sub  = '#9ca3af';
  const bdr  = darkMode ? '#2a2a2a' : '#e5e7eb';

  const green  = '#10b981';
  const red    = '#ef4444';
  const amber  = '#f59e0b';
  const blue   = '#3b82f6';

  const isSafe        = summary.isSafe;
  const depletionAge  = summary.depletionAge;
  const retireWorth   = summary.retirementNetWorth ?? 0;
  const finalWorth    = summary.finalNetWorth ?? 0;

  // シェアカード
  const generateShareCard = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 1080, 1080);
    g.addColorStop(0, '#0a0a0a'); g.addColorStop(1, '#0f2027');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = '#10b981'; ctx.font = '800 88px sans-serif';
    ctx.fillText(fmtMan(retireWorth), 80, 220);
    ctx.fillStyle = '#94a3b8'; ctx.font = '500 34px sans-serif';
    ctx.fillText(`${retirementAge}歳時点の純資産`, 80, 280);
    ctx.fillStyle = isSafe ? '#10b981' : '#ef4444';
    ctx.font = '700 28px sans-serif';
    ctx.fillText(isSafe ? `✓ ${lifeExpectancy}歳まで資産が持続します` : `⚠ ${depletionAge}歳で資産枯渇の見込み`, 80, 350);
    setShareUrl(canvas.toDataURL('image/png'));
    setShareModal(true);
  }, [retireWorth, retirementAge, isSafe, lifeExpectancy, depletionAge]);

  // ─── 年収フォーマット ─────────────────────────────────────────────────
  // ─── 数値フォーマット（億対応）──────────────────────────────────────
  const fmtMan = v => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 100_000_000) return `${sign}¥${(abs / 100_000_000).toFixed(1)}億`;
    if (abs >= 10_000)      return `${sign}¥${Math.round(abs / 10_000)}万`;
    return `${sign}¥${abs.toLocaleString()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ══════════════════════════════════════════════════════════════════
          1. ステータスバナー
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: isSafe
          ? (darkMode ? '#0a2018' : '#f0fdf4')
          : (darkMode ? '#200a0a' : '#fef2f2'),
        borderRadius: 18, padding: '16px 18px',
        border: `1.5px solid ${isSafe ? (darkMode ? '#065f46' : '#a7f3d0') : (darkMode ? '#7f1d1d' : '#fecaca')}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {isSafe ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CheckCircle2 size={16} color={green} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: green }}>プランは持続可能です</p>
                </div>
                <p style={{ fontSize: 26, fontWeight: 900, color: green, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {lifeExpectancy}歳まで資産が持続
                </p>
                <p style={{ fontSize: 12, color: sub, marginTop: 4 }}>
                  {lifeExpectancy}歳時点の純資産: {fmtMan(finalWorth)}
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={16} color={red} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: red }}>資産枯渇リスクあり</p>
                </div>
                <p style={{ fontSize: 26, fontWeight: 900, color: red, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {depletionAge}歳で枯渇見込み
                </p>
                <p style={{ fontSize: 12, color: sub, marginTop: 4 }}>
                  収入増加・支出削減・リタイア年齢の見直しを検討してください
                </p>
              </>
            )}
          </div>
          <button onClick={generateShareCard} style={{
            padding: '8px 12px', background: darkMode ? '#2a2a2a' : '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}>
            <Share2 size={13} color={sub} />
            <span style={{ fontSize: 11, color: sub, fontWeight: 600 }}>シェア</span>
          </button>
        </div>
      </div>

      {/* ── リタイア時/最終 サマリーピル ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatPill label={`${retirementAge}歳時の純資産`} value={fmtMan(retireWorth)}
          color={blue} bg={darkMode ? '#0d1a2b' : '#eff6ff'} />
        <StatPill label={`${lifeExpectancy}歳時の純資産`} value={fmtMan(finalWorth)}
          color={finalWorth > 0 ? green : red} bg={darkMode ? '#1c1c1e' : '#f9fafb'} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. タイムライングラフ
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: card, borderRadius: 18, padding: '18px 14px 14px' }}>
        <SectionTitle>
          資産タイムライン（{currentAge}歳〜{lifeExpectancy}歳）
        </SectionTitle>

        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={blue}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={blue}  stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={amber} stopOpacity={0.2} />
                <stop offset="95%" stopColor={amber} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={bdr} vertical={false} />

            <XAxis dataKey="age" tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => `${v}歳`}
              ticks={Array.from({ length: Math.ceil((lifeExpectancy - currentAge) / 5) + 1 }, (_, i) => currentAge + i * 5).filter(a => a <= lifeExpectancy)}
            />
            <YAxis tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => {
              const abs = Math.abs(v);
              if (v === 0) return '0';
              if (abs >= 100_000_000) return `${(v/100_000_000).toFixed(1)}億`;
              return `${Math.round(v/10000)}万`;
            }}
              width={48}
            />

            <Tooltip content={<CustomTooltip retirementAge={retirementAge} />} />

            {/* ゼロライン */}
            <ReferenceLine y={0} stroke={red} strokeDasharray="3 2" strokeOpacity={0.5} />

            {/* リタイア縦線 */}
            <ReferenceLine x={retirementAge} stroke={amber} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'リタイア', position: 'insideTopRight', fontSize: 9, fill: amber, dy: -2 }} />

            {/* ライフイベントピン */}
            {eventPins.map(ev => (
              <ReferenceLine key={ev.id} x={ev.age} stroke={sub} strokeDasharray="2 3" strokeWidth={1}
                label={{ value: ev.icon || '📌', position: 'top', fontSize: 12 }} />
            ))}

            {/* 不動産エリア */}
            {byAge.some(r => r.propertyValue > 0) && (
              <Area type="monotone" dataKey="不動産" stroke={amber} strokeWidth={1.5}
                fill="url(#gradProp)" dot={false} />
            )}

            {/* 純資産メインライン */}
            <Area type="monotone" dataKey="純資産" stroke={blue} strokeWidth={2.5}
              fill="url(#gradNet)" dot={false} activeDot={{ r: 4, fill: blue }} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 凡例 */}
        <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingLeft: 8 }}>
          {[
            { color: blue,  label: '純資産' },
            ...(byAge.some(r => r.propertyValue > 0) ? [{ color: amber, label: '不動産' }] : []),
            { color: amber, label: 'リタイア', dashed: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 16, height: 2,
                background: item.dashed ? 'transparent' : item.color,
                borderBottom: item.dashed ? `2px dashed ${item.color}` : 'none',
                borderRadius: 1,
              }} />
              <span style={{ fontSize: 10, color: sub }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. 家計実績インサイト
      ══════════════════════════════════════════════════════════════════ */}
      {(recentMonthlyAverages || monthlyGapImpact || incomeGrowthEstimate !== null) && (
        <div style={{ background: card, borderRadius: 18, padding: 18 }}>
          <SectionTitle
            action={
              <span style={{ fontSize: 10, color: sub, fontWeight: 600 }}>家計簿の実績から</span>
            }
          >
            実績ベースのインサイト
          </SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* 今月の過不足 → 将来影響 */}
            {monthlyGapImpact && (
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: monthlyGapImpact.diff >= 0
                  ? (darkMode ? '#0d2b1a' : '#f0fdf4')
                  : (darkMode ? '#200a0a' : '#fef2f2'),
                border: `1px solid ${monthlyGapImpact.diff >= 0
                  ? (darkMode ? '#065f46' : '#a7f3d0')
                  : (darkMode ? '#7f1d1d' : '#fecaca')}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: monthlyGapImpact.diff >= 0 ? green : red, marginBottom: 3 }}>
                      {monthlyGapImpact.diff >= 0 ? '📈 今月は計画より黒字' : '📉 今月は計画より赤字'}
                    </p>
                    <p style={{ fontSize: 12, color: sub, lineHeight: 1.5 }}>
                      計画比 <strong style={{ color: monthlyGapImpact.diff >= 0 ? green : red }}>
                        {monthlyGapImpact.diff >= 0 ? '+' : ''}¥{monthlyGapImpact.diff.toLocaleString()}
                      </strong> が{monthlyGapImpact.yearsRemaining}年後の資産に
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: monthlyGapImpact.impact >= 0 ? green : red, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                      {monthlyGapImpact.impact >= 0 ? '+' : ''}{fmtMan(Math.abs(monthlyGapImpact.impact))}
                    </p>
                    <p style={{ fontSize: 10, color: sub }}>の影響</p>
                  </div>
                </div>
              </div>
            )}

            {/* 直近3ヶ月平均 → ライフプランとの乖離 */}
            {recentMonthlyAverages && (() => {
              const avgExp = recentMonthlyAverages.avgExpense;
              const planExp = lifePlan.monthlyExpense;
              const diff = avgExp - planExp;
              const needsUpdate = Math.abs(diff) > 10000;
              return (
                <div style={{ padding: '12px 14px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: txt, marginBottom: 8 }}>
                    直近{recentMonthlyAverages.months}ヶ月の実績平均
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: needsUpdate ? 10 : 0 }}>
                    {[
                      { label: '月収入',  val: recentMonthlyAverages.avgIncome,     color: green  },
                      { label: '月支出',  val: recentMonthlyAverages.avgExpense,    color: red    },
                      { label: '月余剰',  val: recentMonthlyAverages.avgSurplus,    color: blue   },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <p style={{ fontSize: 10, color: sub, marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtMan(val)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {needsUpdate && (
                    <div style={{
                      padding: '8px 10px',
                      background: darkMode ? '#1a2a1a' : '#f0fdf4',
                      borderRadius: 8, border: `1px solid ${darkMode ? '#166534' : '#bbf7d0'}`,
                    }}>
                      <p style={{ fontSize: 11, color: green, fontWeight: 600, marginBottom: 3 }}>
                        💡 ライフプランの支出設定と{Math.abs(diff) > 0 ? (diff > 0 ? '+' : '') : ''}{fmtMan(Math.abs(diff))}の乖離があります
                      </p>
                      <button
                        onClick={() => {
                          // 実績平均をlifePlanに反映
                          props.setLifePlan(prev => ({ ...prev, monthlyExpense: avgExp }));
                        }}
                        style={{
                          padding: '5px 10px', background: green, border: 'none',
                          borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        実績（¥{avgExp.toLocaleString()}）に更新する
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 実績ベースの収入成長率 */}
            {incomeGrowthEstimate !== null && (() => {
              const planRate = lifePlan.incomeGrowthRate ?? 1;
              const diff = incomeGrowthEstimate - planRate;
              if (Math.abs(diff) < 0.3) return null;
              return (
                <div style={{ padding: '10px 12px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, color: sub, marginBottom: 4 }}>
                    過去12ヶ月の実績から推定した収入成長率:
                    <strong style={{ color: blue, marginLeft: 4 }}>{incomeGrowthEstimate}%/年</strong>
                    <span style={{ marginLeft: 6, color: diff > 0 ? green : amber }}>
                      （設定{planRate}%より{diff > 0 ? '+' : ''}{diff.toFixed(1)}%）
                    </span>
                  </p>
                  <button
                    onClick={() => props.setLifePlan(prev => ({ ...prev, incomeGrowthRate: incomeGrowthEstimate }))}
                    style={{
                      padding: '4px 10px', background: 'none',
                      border: `1px solid ${blue}`, borderRadius: 6,
                      color: blue, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    実績値（{incomeGrowthEstimate}%）に更新
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. ライフプラン設定
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: card, borderRadius: 18, padding: 18 }}>
        <SectionTitle
          action={
            <button onClick={() => setShowLifePlanSettings(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: darkMode ? '#2a2a2a' : '#f5f5f5',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              <Settings2 size={12} color={sub} />
              <span style={{ fontSize: 11, color: sub, fontWeight: 600 }}>編集</span>
            </button>
          }
        >
          ライフプランの前提
        </SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: '年収',       value: fmtMan(lifePlan.annualIncome) },
            { label: '昇給率',     value: `${lifePlan.incomeGrowthRate}%/年` },
            { label: '月間生活費', value: `¥${lifePlan.monthlyExpense.toLocaleString()}` },
            { label: 'リタイア',   value: `${retirementAge}歳` },
            { label: '老後月収',   value: `¥${lifePlan.retirementMonthlyIncome.toLocaleString()}` },
            { label: '老後月支出', value: `¥${lifePlan.retirementMonthlyExpense.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 12px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 10 }}>
              <p style={{ fontSize: 10, color: sub, marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: txt, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 投資設定へのリンク */}
        <button onClick={() => setActiveTab('settings')} style={{
          width: '100%', marginTop: 10, padding: '11px 14px',
          background: 'none', border: `1px solid ${bdr}`, borderRadius: 12,
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: sub }}>投資設定（積立額・利回り・NISA）</span>
          <ChevronRight size={14} color={sub} />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. ライフイベント
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: card, borderRadius: 18, padding: 18 }}>
        <SectionTitle
          action={
            <button onClick={() => { setEditingLifeEvent(null); setShowLifeEventModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                background: theme.accent, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <Plus size={11} color="#fff" />
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>追加</span>
            </button>
          }
        >
          ライフイベント
        </SectionTitle>

        {/* 住宅購入ショートカット */}
        <button onClick={() => setShowHousingModal(true)} style={{
          width: '100%', marginBottom: 12, padding: '12px 14px',
          background: darkMode ? '#0d1a2b' : '#eff6ff',
          border: `1px solid ${darkMode ? '#1e3a5f' : '#bfdbfe'}`,
          borderRadius: 12, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏠</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: blue }}>
                {housingParams ? '住宅購入プラン設定済み' : '住宅購入を検討する'}
              </p>
              <p style={{ fontSize: 10, color: sub }}>
                {housingParams
                  ? `${fmtMan(housingParams.propertyPrice)} · ${housingParams.rateType === 'fixed' ? '固定' : '変動'}${housingParams.interestRate}%`
                  : '購入 vs 賃貸継続を比較・資産推移に統合'}
              </p>
            </div>
          </div>
          <ChevronRight size={14} color={blue} />
        </button>

        {/* イベント一覧 */}
        {lifeEvents.length === 0 ? (
          <p style={{ fontSize: 12, color: sub, textAlign: 'center', padding: '12px 0' }}>
            イベントを追加するとグラフに反映されます
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(expandEvents ? lifeEvents : lifeEvents.slice(0, 4))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(ev => {
                  const evYear = parseInt(ev.date?.slice(0, 4));
                  const evAge  = currentAge + (evYear - new Date().getFullYear());
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12,
                    }}>
                      <span style={{ fontSize: 20 }}>{ev.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: txt }}>{ev.name}</p>
                        <p style={{ fontSize: 10, color: sub }}>{ev.date} · {evAge}歳</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: red, fontVariantNumeric: 'tabular-nums' }}>
                        -{fmtMan(ev.amount)}
                      </p>
                      <button onClick={() => { setEditingLifeEvent(ev); setShowLifeEventModal(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 3px' }}>✏️</button>
                      <button onClick={() => deleteLifeEvent(ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 3px' }}>🗑️</button>
                    </div>
                  );
                })}
            </div>
            {lifeEvents.length > 4 && (
              <button onClick={() => setExpandEvents(v => !v)} style={{
                width: '100%', marginTop: 8, padding: '8px', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 11, color: sub, fontWeight: 600,
              }}>
                {expandEvents ? '折りたたむ ▲' : `他 ${lifeEvents.length - 4} 件を見る ▼`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. フェーズ別内訳（リタイア前後の資産構成）
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: card, borderRadius: 18, padding: 18 }}>
        <SectionTitle>フェーズ別スナップショット</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: '現在', age: currentAge },
            { label: `${Math.round((currentAge + retirementAge)/2)}歳`, age: Math.round((currentAge + retirementAge)/2) },
            { label: `${retirementAge}歳（リタイア）`, age: retirementAge },
            { label: `${Math.round((retirementAge + lifeExpectancy)/2)}歳`, age: Math.round((retirementAge + lifeExpectancy)/2) },
            { label: `${lifeExpectancy}歳（寿命）`, age: lifeExpectancy },
          ].map(({ label, age }) => {
            const snap = byAge.find(r => r.age === age) || byAge[byAge.length - 1];
            if (!snap) return null;
            const total = Math.max(1, snap.totalAssets + snap.propertyValue);
            const bars = [
              { label: '貯金',    val: snap.savings,       color: blue   },
              { label: '投資',    val: snap.regularInvest + snap.nisaInvest, color: '#a855f7' },
              { label: '不動産',  val: snap.propertyValue, color: amber  },
            ].filter(b => b.val > 0);
            return (
              <div key={age} style={{ padding: '12px 14px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: snap.netWorth >= 0 ? blue : red, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtMan(snap.netWorth)}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', background: darkMode ? '#333' : '#e5e7eb' }}>
                  {bars.map(b => (
                    <div key={b.label} style={{ width: `${b.val/total*100}%`, background: b.color }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                  {bars.map(b => (
                    <span key={b.label} style={{ fontSize: 10, color: sub }}>
                      <span style={{ color: b.color, fontWeight: 700 }}>■</span> {b.label} {fmtMan(b.val)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── モーダル ──────────────────────────────────────────────────── */}
      {showLifePlanSettings && (
        <LifePlanSettingsModal
          lifePlan={lifePlan} setLifePlan={setLifePlan}
          onClose={() => setShowLifePlanSettings(false)}
          theme={theme} darkMode={darkMode}
        />
      )}

      {showHousingModal && (
        <HousingComparisonModal
          theme={theme} darkMode={darkMode}
          housingParams={housingParams}
          setHousingParams={setHousingParams}
          setShowHousingModal={setShowHousingModal}
        />
      )}

      {shareModal && shareUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
          <div style={{ background: card, borderRadius: 20, padding: 20, maxWidth: 360, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: txt }}>シェア画像</p>
              <button onClick={() => setShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub }}><X size={18} /></button>
            </div>
            <img src={shareUrl} alt="share" style={{ width: '100%', borderRadius: 12, marginBottom: 14 }} />
            <a href={shareUrl} download="lifeplan.png" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 12, background: theme.accent, borderRadius: 12, color: '#fff',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              <Download size={14} /> 保存
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
