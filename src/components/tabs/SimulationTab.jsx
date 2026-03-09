import React, { useCallback, useMemo, useState } from 'react';
import { Share2, X, Download, Plus, Settings2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import HousingComparisonModal from '../modals/HousingComparisonModal';
import LifePlanSettingsModal  from '../modals/LifePlanSettingsModal';
import LifeEventPlanner      from '../LifeEventPlanner';
import { LIFE_EVENT_TEMPLATES, EVENT_ICONS } from '../../constants';

// --- 小コンポーネント -------------------------------------------------------

function StatPill({ label, value, color, bg }) {
  return (
    <div className="hover-scale transition-all" style={{
      background: bg, borderRadius: 6,
      padding: '10px 14px', flex: 1, cursor: 'default',
      border: `1px solid ${color}30`,
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: color, marginBottom: 4, opacity: 0.8 }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', textShadow: `0 0 12px ${color}50` }}>{value}</p>
    </div>
  );
}

function SectionTitle({ children, action, collapsible, expanded, onToggle, sub = '#9ca3af' }) {
  const style = { fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0em', color: '#00e5ff' };
  if (collapsible) {
    return (
      <button
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: expanded ? 12 : 0, width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, transition: 'opacity 0.15s' }}
      >
        <p style={style}>{children}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {action && <span onClick={e => e.stopPropagation()}>{action}</span>}
          <span style={{ fontSize: 11, color: '#00e5ff', transition: 'transform 0.2s', opacity: 0.7,
            display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </div>
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <p style={style}>{children}</p>
      {action}
    </div>
  );
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label, retirementAge }) {
  if (!active || !payload?.length) return null;
  const fmt = (v) => {
    const abs = Math.abs(v);
    if (abs >= 100_000_000) return `¥${(abs/100_000_000).toFixed(2)}億`;
    if (abs >= 10_000)      return `¥${Math.round(abs/10000)}万`;
    return `¥${abs.toLocaleString()}`;
  };
  // 純資産を先頭に、右軸の値は後ろに
  const sorted = [...payload].sort((a, b) =>
    a.name === '純資産' ? -1 : b.name === '純資産' ? 1 : 0
  );
  return (
    <div style={{
      background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(10px)',
      borderRadius: 12, padding: '10px 14px', border: '1px solid #333',
      minWidth: 140,
    }}>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700 }}>
        {label}歳{label >= retirementAge ? ' · 老後' : ''}
      </p>
      {sorted.filter(p => p.value != null).map((p, i) => {
        const isDebt = p.name === '負債残高';
        const displayVal = isDebt ? `-${fmt(p.value)}` : fmt(p.value);
        const isRight = p.name === '不動産' || p.name === '負債残高';
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {p.name}{isRight ? ' *' : ''}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: isDebt ? red : p.color, fontVariantNumeric: 'tabular-nums' }}>
              {displayVal}
            </span>
          </div>
        );
      })}
      {sorted.some(p => p.name === '不動産' || p.name === '負債残高') && (
        <p style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>* 右軸スケール</p>
      )}
    </div>
  );
}

// --- メインコンポーネント ---------------------------------------------------

export default function SimulationTab(props) {
  const {
    theme, darkMode,
    simulationSettings, setSimulationSettings,
    lifeEvents, setLifeEvents, setShowLifeEventModal, setEditingLifeEvent, deleteLifeEvent,
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
  const [expandEvents,   setExpandEvents]   = useState(false);
  const [secStatus,      setSecStatus]      = useState(true);   // ステータスバナー
  const [secInsight,     setSecInsight]     = useState(true);   // 実績インサイト
  const [secLifePlan,    setSecLifePlan]    = useState(false);  // ライフプラン調整（デフォルト折りたたみ）
  const [secTimeline,    setSecTimeline]    = useState(true);   // タイムライングラフ
  const [secLifeEvent,   setSecLifeEvent]   = useState(true);   // ライフイベント
  const [secPhaseSnap,   setSecPhaseSnap]   = useState(false);  // フェーズ別（デフォルト折りたたみ）
  const [secHousing,     setSecHousing]     = useState(false);  // 購入vs賃貸（デフォルト折りたたみ）

  const currentAge    = userInfo?.age ? Number(userInfo.age) : 30;
  const retirementAge = lifePlan.retirementAge ?? 65;
  const lifeExpectancy = lifePlan.lifeExpectancy ?? 90;

  const { byAge, summary } = lifePlanSimulation ?? { byAge: [], summary: {} };
  const retirementTarget = lifePlan.retirementTargetAmount ?? 30000000;
  const retirementSnap   = byAge.find(r => r.age === retirementAge);
  const targetAchieved   = retirementSnap ? retirementSnap.netWorth >= retirementTarget : false;

  // --- グラフデータ ----------------------------------------------------
  const chartData = useMemo(() => {
    return byAge.map(r => ({
      age:       r.age,
      純資産:    r.netWorth,
      金融資産:  r.totalAssets,
      不動産:    r.propertyValue > 0 ? r.propertyValue : undefined,
      負債残高:  r.loanBalance  > 0 ?  r.loanBalance  : undefined,
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

  // --- カラー（テーマシステムから取得・統一）-------------------------
  const card  = theme.chart;                                  // カード背景
  const bg    = darkMode ? '#111'    : '#f2f2f7';
  const txt   = darkMode ? '#f5f5f5' : '#111';
  const sub   = darkMode ? '#aaaaaa' : '#555555';
  const bdr   = darkMode ? '#2a2a2a' : '#e5e7eb';
  const green  = theme.green;                                 // テーマ緑
  const red    = theme.red;                                   // テーマ赤
  const amber  = theme.orange;                                // テーマオレンジ→amber代替
  const blue   = theme.accent;                                // テーマアクセント

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

  // --- 年収フォーマット -------------------------------------------------
  // --- 数値フォーマット（億対応）--------------------------------------
  const fmtMan = v => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 100_000_000) return `${sign}¥${(abs / 100_000_000).toFixed(1)}億`;
    if (abs >= 10_000)      return `${sign}¥${Math.round(abs / 10_000)}万`;
    return `${sign}¥${abs.toLocaleString()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ background: card, borderRadius: 8, overflow: 'hidden' }}>
        <button onClick={() => setSecStatus(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: secStatus ? `1px solid ${bdr}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSafe
              ? <CheckCircle2 size={15} color={green} />
              : <AlertTriangle size={15} color={red} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: isSafe ? green : red }}>
              {isSafe ? `${lifeExpectancy}歳まで資産が持続` : `${depletionAge}歳で枯渇見込み`}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secStatus ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {secStatus && <div className="animate-fadeIn" style={{
          background: isSafe
            ? (darkMode ? 'rgba(0,230,118,0.04)' : 'rgba(0,200,83,0.03)')
            : (darkMode ? 'rgba(255,61,87,0.06)' : 'rgba(229,57,53,0.03)'),
          padding: '14px 16px',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {isSafe ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CheckCircle2 size={16} color={green} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: green }}>プランは持続可能です</p>
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 800, color: green, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', textShadow: `0 0 16px ${green}50` }}>
                  {lifeExpectancy}歳まで資産が持続
                </p>
                <p style={{ fontSize: 12, color: sub, marginTop: 4 }}>
                  {lifeExpectancy}歳時点の純資産: {fmtMan(finalWorth)}
                </p>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: targetAchieved ? (darkMode ? '#065f46' : '#d1fae5') : (darkMode ? '#78350f' : '#fef3c7'),
                    color: targetAchieved ? green : amber,
                  }}>
                    {targetAchieved ? `🎯 目標 ${fmtMan(retirementTarget)} 達成` : `📍 目標 ${fmtMan(retirementTarget)} まで ${fmtMan(retirementTarget - (retirementSnap?.netWorth ?? 0))} 不足`}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={16} color={red} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: red }}>資産枯渇リスクあり</p>
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 800, color: red, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', textShadow: `0 0 16px ${red}50` }}>
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
            transition: 'opacity 0.15s', opacity: 1,
          }} onMouseOver={e=>e.currentTarget.style.opacity='0.7'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
            <Share2 size={13} color={sub} />
            <span style={{ fontSize: 11, color: sub, fontWeight: 600 }}>シェア</span>
          </button>
        </div>
        </div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatPill label={`RETIRE · ${retirementAge}歳`} value={fmtMan(retireWorth)}
          color={blue} bg={darkMode ? 'rgba(0,229,255,0.06)' : 'rgba(0,229,255,0.04)'} />
        <StatPill label={`FINAL · ${lifeExpectancy}歳`} value={fmtMan(finalWorth)}
          color={finalWorth > 0 ? green : red} bg={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} />
      </div>

      <div style={{ background: card, borderRadius: 8 }}>
        <button onClick={() => setSecTimeline(v => !v)} style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: secTimeline ? `1px solid ${bdr}` : 'none',
        }}>
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>
            資産タイムライン（{currentAge}歳〜{lifeExpectancy}歳）
          </span>
          <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secTimeline ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {secTimeline && (<div className="animate-fadeIn" style={{ padding: '14px 14px 14px' }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 44, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={blue}  stopOpacity={0.3} />
                <stop offset="95%" stopColor={blue}  stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={amber} stopOpacity={0.35} />
                <stop offset="95%" stopColor={amber} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={red}   stopOpacity={0.3} />
                <stop offset="95%" stopColor={red}   stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={bdr} vertical={false} />

            <XAxis dataKey="age" tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => `${v}歳`}
              ticks={Array.from({ length: Math.ceil((lifeExpectancy - currentAge) / 5) + 1 }, (_, i) => currentAge + i * 5).filter(a => a <= lifeExpectancy)}
            />

            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => {
                if (v === 0) return '0';
                const abs = Math.abs(v);
                if (abs >= 100_000_000) return `${(v/100_000_000).toFixed(1)}億`;
                return `${Math.round(v/10000)}万`;
              }}
              width={48}
            />

            {(byAge.some(r => r.propertyValue > 0) || byAge.some(r => r.loanBalance > 0)) && (
              <YAxis yAxisId="right" orientation="right"
                tick={{ fontSize: 9, fill: sub }} tickLine={false} axisLine={false}
                tickFormatter={v => {
                  if (v === 0) return '';
                  const abs = Math.abs(v);
                  if (abs >= 100_000_000) return `${(abs/100_000_000).toFixed(1)}億`;
                  if (abs >= 10_000)      return `${Math.round(abs/10000)}万`;
                  return '';
                }}
                width={40}
              />
            )}

            <Tooltip content={<CustomTooltip retirementAge={retirementAge} />} />

            <ReferenceLine yAxisId="left" y={0} stroke={darkMode ? '#444' : '#d1d5db'} strokeDasharray="2 2" strokeOpacity={0.8} />

            <ReferenceLine yAxisId="left" x={retirementAge} stroke={amber} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'リタイア', position: 'insideTopRight', fontSize: 9, fill: amber, dy: -2 }} />

            {(lifePlan.retirementTargetAmount ?? 30000000) > 0 && (
              <ReferenceLine yAxisId="left" y={lifePlan.retirementTargetAmount ?? 30000000}
                stroke={green} strokeDasharray="5 3" strokeWidth={1.5} strokeOpacity={0.8}
                label={{ value: '目標', position: 'insideTopRight', fontSize: 9, fill: green }} />
            )}

            {eventPins.filter(ev => ev.enabled !== false).map(ev => (
              <ReferenceLine yAxisId="left" key={ev.id} x={ev.age} stroke={sub} strokeDasharray="2 3" strokeWidth={1}
                label={{ value: ev.icon || '📌', position: 'top', fontSize: 11 }} />
            ))}

            {byAge.some(r => r.propertyValue > 0) && (
              <Area yAxisId="right" type="monotone" dataKey="不動産"
                stroke={amber} strokeWidth={2}
                fill="url(#gradProp)" dot={false}
                strokeOpacity={0.9}
              />
            )}

            {byAge.some(r => r.loanBalance > 0) && (
              <Area yAxisId="right" type="monotone" dataKey="負債残高"
                stroke={red} strokeWidth={1.5} strokeDasharray="5 2"
                fill="url(#gradDebt)" dot={false} strokeOpacity={0.8}
              />
            )}

            <Area yAxisId="left" type="monotone" dataKey="純資産" stroke={blue} strokeWidth={2.5}
              fill="url(#gradNet)" dot={false} activeDot={{ r: 4, fill: blue }} />

          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingLeft: 8 }}>
          {[
            { color: blue,  label: '純資産（左軸）' },
            ...(byAge.some(r => r.propertyValue > 0) ? [{ color: amber, label: '不動産（右軸）' }] : []),
            ...(byAge.some(r => r.loanBalance > 0)   ? [{ color: red,   label: '負債残高（右軸）', dashed: true }] : []),
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
        </div>)}
      </div>

      {(recentMonthlyAverages || monthlyGapImpact || incomeGrowthEstimate !== null) && (
        <div style={{ background: card, borderRadius: 8 }}>
          <button onClick={() => setSecInsight(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: secInsight ? `1px solid ${bdr}` : 'none',
          }}>
            <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>実績ベースのインサイト</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: sub, fontWeight: 600 }}>家計簿の実績から</span>
              <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secInsight ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
          </button>
          {secInsight && (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px' }}>

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
                          setLifePlan(prev => ({ ...prev, monthlyExpense: avgExp }));
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
                    onClick={() => setLifePlan(prev => ({ ...prev, incomeGrowthRate: incomeGrowthEstimate }))}
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
          )}
        </div>
      )}

      <div style={{ background: card, borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: secLifePlan ? 12 : 0 }}>
          <button onClick={() => setSecLifePlan(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>ライフプラン調整</span>
            <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secLifePlan ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowLifePlanSettings(true); }} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: darkMode ? '#2a2a2a' : '#f5f5f5',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>
            <Settings2 size={12} color={sub} />
            <span style={{ fontSize: 11, color: sub, fontWeight: 600 }}>詳細設定</span>
          </button>
        </div>
        {secLifePlan && (<div className="animate-fadeIn" style={{ padding: '0 16px 16px' }}>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>現役フェーズ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'annualIncome',   label: '年収',     min: 2000000, max: 30000000, step: 500000,
                fmt: v => v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${Math.round(v/10000)}万` },
              { key: 'monthlyExpense', label: '月間生活費', min: 50000, max: 800000, step: 10000,
                fmt: v => `¥${v.toLocaleString()}` },
              { key: 'incomeGrowthRate', label: '昇給率', min: 0, max: 5, step: 0.5,
                fmt: v => v === 0 ? '考慮しない' : `${v}%/年` },
            ].map(({ key, label, min, max, step, fmt }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: txt, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(lifePlan[key] ?? min)}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={lifePlan[key] ?? min}
                  onChange={e => setLifePlan(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: blue }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: bdr, marginBottom: 14 }} />

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>リタイア</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: sub }}>リタイア年齢</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: amber }}>{retirementAge}歳</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[55, 60, 65, 70].map(age => (
                  <button key={age} onClick={() => setLifePlan(prev => ({ ...prev, retirementAge: age }))}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: retirementAge === age ? amber : (darkMode ? '#2a2a2a' : '#f2f2f7'),
                      color: retirementAge === age ? '#fff' : sub,
                      transition: 'all 0.15s',
                    }}>{age}歳</button>
                ))}
              </div>
            </div>

            {[
              { key: 'retirementTargetAmount', label: 'リタイア目標資産', min: 5000000, max: 200000000, step: 1000000,
                fmt: v => v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${Math.round(v/10000)}万` },
            ].map(({ key, label, min, max, step, fmt }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: green, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(lifePlan[key] ?? 30000000)}
                    {targetAchieved ? ' 🎯' : ' 📍'}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={lifePlan[key] ?? 30000000}
                  onChange={e => setLifePlan(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: green }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: bdr, marginBottom: 14 }} />

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>老後の収支</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'retirementMonthlyIncome',  label: '月収（年金等）', min: 0, max: 500000, step: 5000,
                fmt: v => `¥${v.toLocaleString()}` },
              { key: 'retirementMonthlyExpense', label: '月間支出',       min: 50000, max: 500000, step: 5000,
                fmt: v => `¥${v.toLocaleString()}` },
            ].map(({ key, label, min, max, step, fmt }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: txt, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(lifePlan[key] ?? min)}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={lifePlan[key] ?? min}
                  onChange={e => setLifePlan(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: theme.purple }}
                />
              </div>
            ))}
          </div>

          {(() => {
            const cf = (lifePlan.retirementMonthlyIncome ?? 0) - (lifePlan.retirementMonthlyExpense ?? 0);
            return (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: cf >= 0 ? (darkMode?'#0d2b1a':'#f0fdf4') : (darkMode?'#200a0a':'#fef2f2') }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: cf >= 0 ? green : red }}>
                  老後月次収支 {cf >= 0 ? '+' : ''}{cf.toLocaleString()}円
                  {cf < 0 ? '（毎月取り崩し）' : '（黒字・資産維持）'}
                </p>
              </div>
            );
          })()}
        </div>

        <div style={{ height: 1, background: bdr, marginBottom: 12 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'monthlyInvestment', label: '月々の積立投資', min: 0, max: 200000, step: 5000,
              fmt: v => `¥${v.toLocaleString()}`, color: theme.purple, obj: 'sim' },
            { key: 'returnRate',        label: '想定利回り',     min: 0, max: 12,     step: 0.5,
              fmt: v => `${v}%`,                 color: blue,     obj: 'sim' },
          ].map(({ key, label, min, max, step, fmt, color, obj }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: sub }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(simulationSettings[key] ?? min)}
                </span>
              </div>
              <input type="range" min={min} max={max} step={step}
                value={simulationSettings[key] ?? min}
                onChange={e => setSimulationSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: color }}
              />
            </div>
          ))}
        </div>
        </div>)}
      </div>

      <div style={{ background: card, borderRadius: 16 }}>
        <button onClick={() => setSecLifeEvent(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: secLifeEvent ? `1px solid ${bdr}` : 'none',
        }}>
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>ライフイベント</span>
          <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secLifeEvent ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>
        {secLifeEvent && <div className="animate-fadeIn" style={{ paddingBottom: 8 }}><LifeEventPlanner
        lifeEvents={lifeEvents}
        setLifeEvents={setLifeEvents}
        setShowHousingModal={setShowHousingModal}
        housingParams={housingParams}
        currentAge={currentAge}
        darkMode={darkMode}
        theme={theme}
        card={card}
        txt={txt}
        sub={sub}
        bdr={bdr}
        blue={blue}
        red={red}
        green={green}
        amber={amber}
        fmtMan={fmtMan}
        setShowLifeEventModal={setShowLifeEventModal}
        setEditingLifeEvent={setEditingLifeEvent}
        deleteLifeEvent={deleteLifeEvent}
      /></div>}
      </div>

      <div style={{ background: card, borderRadius: 16, padding: 18 }}>
        <SectionTitle collapsible expanded={secPhaseSnap} onToggle={() => setSecPhaseSnap(v => !v)}>フェーズ別スナップショット</SectionTitle>
        {secPhaseSnap && <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: '現在',                                          age: currentAge },
            { label: `${Math.round((currentAge+retirementAge)/2)}歳`, age: Math.round((currentAge+retirementAge)/2) },
            { label: `${retirementAge}歳（リタイア）`,                age: retirementAge },
            { label: `${Math.round((retirementAge+lifeExpectancy)/2)}歳`, age: Math.round((retirementAge+lifeExpectancy)/2) },
            { label: `${lifeExpectancy}歳（寿命）`,                   age: lifeExpectancy },
          ].map(({ label, age }) => {
            const snap = byAge.find(r => r.age === age) || byAge[byAge.length - 1];
            if (!snap) return null;
            const grossAssets = snap.totalAssets + snap.propertyValue;
            const total = Math.max(1, grossAssets);
            const bars = [
              { label: '貯金',   val: snap.savings,                        color: blue    },
              { label: '投資',   val: snap.regularInvest + snap.nisaInvest, color: theme.purple },
              { label: '不動産', val: snap.propertyValue,                  color: amber   },
            ].filter(b => b.val > 0);
            const hasLoan = snap.loanBalance > 0;
            return (
              <div key={age} style={{ padding: '12px 14px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: txt }}>{label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: snap.netWorth >= 0 ? blue : red, fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                      純資産 {fmtMan(snap.netWorth)}
                    </span>
                    {hasLoan && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: red, fontVariantNumeric: 'tabular-nums' }}>
                        ローン残債 -{fmtMan(snap.loanBalance)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', display: 'flex', background: darkMode ? '#333' : '#e5e7eb' }}>
                  {bars.map(b => (
                    <div key={b.label} style={{ width: `${b.val/total*100}%`, background: b.color }} />
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {bars.map(b => (
                      <span key={b.label} style={{ fontSize: 10, color: sub }}>
                        <span style={{ color: b.color, fontWeight: 700 }}>■</span> {b.label} {fmtMan(b.val)}
                      </span>
                    ))}
                  </div>
                  {hasLoan && (
                    <span style={{ fontSize: 10, color: red, fontWeight: 600 }}>
                      ▼ 負債 {fmtMan(snap.loanBalance)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}
      </div>

      {housingParams && housingComparison && (() => {
        const hc      = housingComparison;
        const yrs     = housingParams.compareYears ?? 30;
        const summary = hc.summary ?? {};
        const refBuy  = hc.buyScenarios?.find(s => s.key === 'fixed' || s.key === 'neutral') || hc.buyScenarios?.[0];
        const buyEnd  = summary.buyFinal  ?? refBuy?.finalNetAssets ?? 0;
        const rentEnd = summary.rentFinal ?? hc.rentScenario?.finalNetAssets ?? 0;
        const isBuyWin = summary.winner === 'buy';
        const netDiff  = summary.diff ?? Math.abs(buyEnd - rentEnd);
        const pAge     = housingParams.purchaseAge ?? currentAge;
        // 購入側の総コスト（頭金＋利息＋管理費等）
        const buyTotalInterest = refBuy?.totalInterest ?? 0;
        const buyAcqCost       = refBuy?.acquisitionCost ?? 0;
        const buyRunning       = (refBuy?.yearlyData ?? []).reduce((s,r) => s + r.runningCost, 0);
        const buyTotal         = (housingParams.downPayment ?? 0) + buyTotalInterest + buyAcqCost + buyRunning;
        const rentTotal        = hc.rentScenario?.totalRentPaid ?? 0;

        return (
          <div style={{ background: card, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: secHousing ? 12 : 0 }}>
              <button onClick={() => setSecHousing(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5ff' }}>購入 vs 賃貸 比較（{yrs}年間）</span>
                <span style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: secHousing ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowHousingModal(true); }} style={{
                padding: '5px 10px', background: 'none',
                border: `1px solid ${blue}`, borderRadius: 8,
                color: blue, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>設定変更</button>
            </div>
            {secHousing && (<div className="animate-fadeIn">

            <div style={{
              marginBottom: 12, padding: '10px 12px',
              background: darkMode ? '#0d1a2b' : '#eff6ff',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <p style={{ fontSize: 12, color: blue, fontWeight: 600 }}>
                {pAge > currentAge
                  ? `${pAge}歳（あと${pAge-currentAge}年）で購入予定`
                  : `現時点で購入済みとして計算`}
              </p>
            </div>

            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 12,
              background: isBuyWin
                ? (darkMode ? '#0d2b1a' : '#f0fdf4')
                : (darkMode ? '#1a0d2b' : '#faf5ff'),
              border: `1.5px solid ${isBuyWin ? (darkMode?'#166534':'#a7f3d0') : (darkMode?'#4c1d95':'#ddd6fe')}`,
            }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: isBuyWin ? green : theme.purple, marginBottom: 4 }}>
                {isBuyWin ? '🏠 購入が有利' : '🔑 賃貸が有利'}
                <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8 }}>
                  差額 {fmtMan(Math.abs(netDiff))}
                </span>
              </p>
              <p style={{ fontSize: 11, color: sub }}>
                {yrs}年後の純資産ベースで比較。不動産売却益・運用益を含む。
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '🏠', label: '購入', totalCost: buyTotal,  endAsset: buyEnd,  color: blue,      scenarios: hc.buyScenarios?.length },
                { icon: '🔑', label: '賃貸', totalCost: rentTotal, endAsset: rentEnd, color: theme.purple, scenarios: null },
              ].map(({ icon, label, totalCost, endAsset, color }) => (
                <div key={label} style={{ padding: '12px', background: darkMode ? '#1c1c1e' : '#fff', borderRadius: 12, border: `1px solid ${darkMode?'#2a2a2a':'#e5e7eb'}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{icon} {label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>
                      <p style={{ fontSize: 10, color: sub }}>総コスト</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: red, fontVariantNumeric: 'tabular-nums' }}>-{fmtMan(totalCost)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: sub }}>{yrs}年後の資産</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: green, fontVariantNumeric: 'tabular-nums' }}>+{fmtMan(endAsset)}</p>
                    </div>
                    <div style={{ paddingTop: 4, borderTop: `1px solid ${darkMode?'#2a2a2a':'#e5e7eb'}` }}>
                      <p style={{ fontSize: 10, color: sub }}>純損益</p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: (endAsset-totalCost)>=0?green:red, fontVariantNumeric: 'tabular-nums' }}>
                        {endAsset-totalCost>=0?'+':''}{fmtMan(endAsset-totalCost)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const loanAmt = (housingParams.propertyPrice||0) - (housingParams.downPayment||0);
              const monthlyLoan = loanAmt > 0
                ? Math.round(loanAmt*(housingParams.interestRate/100/12)*Math.pow(1+housingParams.interestRate/100/12,housingParams.loanMonths)/(Math.pow(1+housingParams.interestRate/100/12,housingParams.loanMonths)-1))
                : 0;
              const monthlyBuy  = monthlyLoan + (housingParams.managementFee||0) + Math.round((housingParams.propertyTax||0)/12);
              const monthlyRent = housingParams.monthlyRent || 0;
              const diff = monthlyBuy - monthlyRent;
              return (
                <div style={{ marginTop: 10, padding: '10px 14px', background: darkMode?'#252525':'#f9fafb', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: sub, marginBottom: 8 }}>月次コスト（購入年齢時点）</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: sub }}>購入月額</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: blue, fontVariantNumeric: 'tabular-nums' }}>¥{monthlyBuy.toLocaleString()}</p>
                    </div>
                    <span style={{ color: sub, fontSize: 16 }}>vs</span>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: sub }}>賃貸月額</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: theme.purple, fontVariantNumeric: 'tabular-nums' }}>¥{monthlyRent.toLocaleString()}</p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: sub }}>差額</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: diff>0?red:green, fontVariantNumeric: 'tabular-nums' }}>
                        {diff>0?'+':''}{diff<0?'-':''}¥{Math.abs(diff).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>)}
          </div>
        );
      })()}

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
          userInfo={userInfo}
        />
      )}

      {shareModal && shareUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
          <div style={{ background: card, borderRadius: 16, padding: 20, maxWidth: 360, width: '100%' }}>
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
