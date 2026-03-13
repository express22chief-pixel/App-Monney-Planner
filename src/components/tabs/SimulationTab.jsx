import React, { useCallback, useMemo, useState } from 'react';
import { Share2, X, Download, Plus, Settings2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import HousingComparisonModal from '../modals/HousingComparisonModal';
import LifePlanSettingsModal  from '../modals/LifePlanSettingsModal';
import LifeEventPlanner      from '../LifeEventPlanner';
import { LIFE_EVENT_TEMPLATES, EVENT_ICONS } from '../../constants';
import { calcTakeHome } from '../../utils/calc';

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
function CustomTooltip({ active, payload, label, retirementAge, red }) {
  if (!active || !payload?.length) return null;
  const fmt = (v) => {
    const abs = Math.abs(v);
    if (abs >= 100_000_000) return `¥${(abs/100_000_000).toFixed(2)}億`;
    if (abs >= 10_000)      return `¥${Math.round(abs/10000)}万`;
    return `¥${abs.toLocaleString()}`;
  };
  const order = ['純資産', '金融資産', '不動産', '負債'];
  const sorted = [...payload]
    .filter(p => p.value != null && p.value !== 0)
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  return (
    <div style={{
      background: 'rgba(12,12,12,0.97)', backdropFilter: 'blur(10px)',
      borderRadius: 12, padding: '10px 14px', border: '1px solid #2a2a2a',
      minWidth: 150,
    }}>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700 }}>
        {label}歳{label >= retirementAge ? ' · 老後' : ''}
      </p>
      {sorted.map((p, i) => {
        const isDebt = p.name === '負債';
        const val = isDebt ? Math.abs(p.value) : p.value;
        const isPrimary = p.name === '純資産';
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', gap: 16,
            marginBottom: isPrimary ? 6 : 3,
            paddingBottom: isPrimary ? 6 : 0,
            borderBottom: isPrimary ? '1px solid #2a2a2a' : 'none',
          }}>
            <span style={{ fontSize: isPrimary ? 12 : 10, color: isPrimary ? '#e5e7eb' : '#9ca3af', fontWeight: isPrimary ? 700 : 400 }}>
              {isDebt ? '負債残高' : p.name}
            </span>
            <span style={{ fontSize: isPrimary ? 13 : 11, fontWeight: isPrimary ? 900 : 700,
              color: isDebt ? red : p.color, fontVariantNumeric: 'tabular-nums' }}>
              {isDebt ? `-${fmt(val)}` : fmt(val)}
            </span>
          </div>
        );
      })}
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
    monteCarloResults, monteCarloChartData, scenarioResults,
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
  const [showBasis,      setShowBasis]      = useState(false); // 計算根拠パネル
  const [jobChangeAmount, setJobChangeAmount] = useState(0);    // 転職シミュ
  const [subTab,          setSubTab]          = useState('forecast'); // サブタブ: forecast | scenario | insight
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
      age:      r.age,
      純資産:   r.netWorth,
      金融資産: r.totalAssets,
      不動産:   r.propertyValue > 0 ? r.propertyValue : 0,
      負債:     r.loanBalance   > 0 ? -r.loanBalance  : 0,
    }));
  }, [byAge]);

  // 老後資産減少の理由テキストを生成
  const retirementDrawdownNote = useMemo(() => {
    if (!byAge.length || !lifePlan) return null;
    const retSnap = byAge.find(r => r.age === (lifePlan.retirementAge ?? 65));
    const endSnap = byAge[byAge.length - 1];
    if (!retSnap || !endSnap) return null;
    const drop = retSnap.netWorth - endSnap.netWorth;
    if (drop <= 0) return null;

    const monthlyShortfall = (lifePlan.retirementMonthlyExpense ?? 200000) - (lifePlan.retirementMonthlyIncome ?? 150000);
    const parts = [];
    if (monthlyShortfall > 0) {
      parts.push(`年金等では月${Math.round(monthlyShortfall/10000)}万不足のため毎月取り崩し`);
    }
    const hasLoan = byAge.filter(r => r.age >= (lifePlan.retirementAge ?? 65)).some(r => r.loanBalance > 0);
    if (hasLoan) parts.push('住宅ローン返済継続');
    const medAge = 75;
    if ((lifePlan.lifeExpectancy ?? 90) > medAge) parts.push('75歳以降は医療費増加を加算');
    if (!parts.length) return null;
    return { drop, parts };
  }, [byAge, lifePlan]);

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

  // ===== C: 貯蓄率KPI =====
  const savingsRateData = useMemo(() => {
    const today = new Date();
    const toYM = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const ym = toYM(today);
    if (monthlyHistory[ym]) return null; // 締め済みの月は対象外
    // 直近3ヶ月の締め済み月から平均貯蓄率を計算
    const closedMonths = Object.entries(monthlyHistory)
      .filter(([, h]) => h.plIncome > 0)
      .map(([, h]) => ({ rate: h.plBalance / h.plIncome }))
      .slice(-3);
    if (closedMonths.length === 0) return null;
    const avg = Math.round((closedMonths.reduce((a, b) => a + b.rate, 0) / closedMonths.length) * 100);
    const latest = Math.round(closedMonths[closedMonths.length - 1].rate * 100);
    const grade = latest >= 50 ? { label: 'FIRE圏', color: '#0cff8c' }
                : latest >= 30 ? { label: '優秀',   color: '#00e5ff' }
                : latest >= 20 ? { label: '良好',   color: '#a855f7' }
                : latest >= 10 ? { label: '標準',   color: '#ff9f0a' }
                :                { label: '要改善', color: '#ff453a' };
    return { latest, avg, grade };
  }, [monthlyHistory]);

  // ===== B: ライフステージ先読み =====
  const lifeStageData = useMemo(() => {
    const age = userInfo?.age ? Number(userInfo.age) : null;
    if (!age) return null;
    const totalAssets = (assetData?.savings || 0) + (assetData?.investments || 0);
    const income = userInfo?.annualIncome ? Number(userInfo.annualIncome) : 0;
    const events = [];
    if (age < 35) {
      const y = Math.max(1, 32 - age);
      events.push({ icon: '💍', label: '結婚', age: age+y, need: 3000000, note: '結婚式・新生活費用の平均', urgency: y<=3?'high':'mid' });
    }
    if (age >= 28 && age <= 50) {
      const y = Math.max(1, 46 - age);
      if (y < 20) events.push({ icon: '🎓', label: '教育費（大学入学）', age: age+y, need: 5000000, note: '私立文系4年間の目安', urgency: y<=5?'high':'mid' });
    }
    if (age < 45) {
      const y = Math.max(1, 38 - age);
      const dp = income > 0 ? Math.round(income * 0.2 * 2) : 8000000;
      events.push({ icon: '🏠', label: '住宅頭金', age: age+y, need: dp, note: '物件価格の20%が目安', urgency: y<=3?'high':y<=7?'mid':'low' });
    }
    const retireAge = lifePlan?.retirementAge || 65;
    const retireNeeded = Math.max(0, 20000000 - totalAssets);
    if (retireNeeded > 0) {
      const y = Math.max(1, retireAge - age);
      events.push({ icon: '🏖️', label: '老後資金', age: retireAge, need: retireNeeded, note: '金融庁試算の2000万円基準', urgency: y<=10?'high':'low' });
    }
    return events.map(ev => {
      const years = Math.max(0.5, ev.age - age);
      return { ...ev, yearsTo: Math.round(years*10)/10, monthly: Math.round(ev.need / (years*12)) };
    }).sort((a,b) => a.yearsTo - b.yearsTo).slice(0, 3);
  }, [userInfo, assetData, lifePlan]);

  // ===== L: 転職シミュレーター =====
  const jobChangeData = useMemo(() => {
    if (!jobChangeAmount) return null;
    const age = userInfo?.age ? Number(userInfo.age) : 35;
    const retireAge = lifePlan?.retirementAge || 65;
    const years = Math.max(1, retireAge - age);
    const r = (simulationSettings?.returnRate || 5) / 100 / 12;
    const n = years * 12;
    const monthlyChange = Math.round(jobChangeAmount * 10000 * 0.75 / 12);
    const futureValue = Math.round(monthlyChange * ((Math.pow(1+r, n) - 1) / r));
    const currentMonthly = simulationSettings?.monthlyInvestment || 0;
    const yearsEarlier = currentMonthly > 0 ? Math.round(Math.abs(monthlyChange) / currentMonthly * 3 * 10) / 10 : null;
    return { monthlyChange, futureValue, yearsEarlier, isPositive: jobChangeAmount > 0 };
  }, [jobChangeAmount, userInfo, lifePlan, simulationSettings]);
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

  // ===== サブタブ定義 =====
  const SUB_TABS = [
    { id: 'forecast', label: '予測', icon: '📈' },
    { id: 'insight',  label: 'インサイト', icon: '💡' },
    { id: 'scenario', label: 'シナリオ', icon: '🎛️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ===== サブタブスイッチャー ===== */}
      <div style={{
        display: 'flex', gap: 6, padding: '12px 0 10px',
        position: 'sticky', top: 0, zIndex: 10,
        background: darkMode ? '#0a0a0a' : '#f5f5f5',
      }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
            background: subTab === tab.id
              ? (darkMode ? '#1c1c1e' : '#fff')
              : 'transparent',
            color: subTab === tab.id ? blue : sub,
            boxShadow: subTab === tab.id ? (darkMode ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.1)') : 'none',
          }}>
            <span style={{ marginRight: 4 }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>

      {subTab === 'forecast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {(() => {
        if (!recentMonthlyAverages || recentMonthlyAverages.months < 2) return null;
        const avg = recentMonthlyAverages;
        const planIncome  = (lifePlan.annualIncome ?? 0) / 12;
        const planExpense = lifePlan.monthlyExpense ?? 0;
        const incDiff  = avg.avgIncome  - planIncome;
        const expDiff  = avg.avgExpense - planExpense;
        const bigDiff  = Math.abs(incDiff) > planIncome * 0.1 || Math.abs(expDiff) > planExpense * 0.1;
        if (!bigDiff) return null;
        return (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: darkMode ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)',
            border: `1px solid rgba(245,158,11,0.25)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: amber, marginBottom: 4 }}>
                  📊 直近{avg.months}ヶ月の実績がプランと乖離しています
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Math.abs(incDiff) > planIncome * 0.1 && (
                    <span style={{ fontSize: 10, color: sub }}>
                      収入: 実績 <strong style={{ color: txt }}>¥{Math.round(avg.avgIncome/10000)}万</strong><span> / </span>プラン ¥{Math.round(planIncome/10000)}万
                      <span style={{ color: incDiff > 0 ? green : red, marginLeft: 4 }}>({incDiff > 0 ? '+' : ''}{Math.round(incDiff/10000)}万)</span>
                    </span>
                  )}
                  {Math.abs(expDiff) > planExpense * 0.1 && (
                    <span style={{ fontSize: 10, color: sub }}>
                      支出: 実績 <strong style={{ color: txt }}>¥{Math.round(avg.avgExpense/10000)}万</strong><span> / </span>プラン ¥{Math.round(planExpense/10000)}万
                      <span style={{ color: expDiff > 0 ? red : green, marginLeft: 4 }}>({expDiff > 0 ? '+' : ''}{Math.round(expDiff/10000)}万)</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  const updates = {};
                  if (Math.abs(incDiff) > planIncome * 0.1) updates.annualIncome = Math.round(avg.avgIncome * 12 / 100000) * 100000;
                  if (Math.abs(expDiff) > planExpense * 0.1) updates.monthlyExpense = Math.round(avg.avgExpense / 5000) * 5000;
                  setLifePlan(prev => ({ ...prev, ...updates }));
                }}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: amber, color: '#000', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >実績で更新</button>
            </div>
          </div>
        );
      })()}

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
        {secTimeline && (
        <div className="animate-fadeIn" style={{ padding: '14px 14px 14px' }}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFinancial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={blue}  stopOpacity={0.18} />
                <stop offset="100%" stopColor={blue} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="gradProperty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={amber} stopOpacity={0.22} />
                <stop offset="100%" stopColor={amber} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradDebtFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={red}   stopOpacity={0.18} />
                <stop offset="100%" stopColor={red}  stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={bdr} vertical={false} />

            <XAxis dataKey="age" tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => `${v}歳`}
              ticks={Array.from({ length: Math.ceil((lifeExpectancy - currentAge) / 5) + 1 }, (_, i) => currentAge + i * 5).filter(a => a <= lifeExpectancy)}
            />

            <YAxis tick={{ fontSize: 10, fill: sub }}
              tickFormatter={v => {
                if (v === 0) return '0';
                const abs = Math.abs(v);
                if (abs >= 100_000_000) return `${(v/100_000_000).toFixed(1)}億`;
                return `${Math.round(v/10000)}万`;
              }}
              width={48}
            />

            <Tooltip content={<CustomTooltip retirementAge={retirementAge} red={red} />} />

            <ReferenceLine y={0} stroke={darkMode ? '#555' : '#d1d5db'} strokeDasharray="2 2" strokeOpacity={0.8} />

            <ReferenceLine x={retirementAge} stroke={amber} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: 'リタイア', position: 'insideTopRight', fontSize: 9, fill: amber, dy: -2 }} />

            {(lifePlan.retirementTargetAmount ?? 30000000) > 0 && (
              <ReferenceLine y={lifePlan.retirementTargetAmount ?? 30000000}
                stroke={green} strokeDasharray="5 3" strokeWidth={1} strokeOpacity={0.6}
                label={{ value: '目標', position: 'insideTopRight', fontSize: 9, fill: green }} />
            )}



            {byAge.some(r => r.loanBalance > 0) && (
              <Area type="monotone" dataKey="負債"
                stroke={red} strokeWidth={1} strokeOpacity={0.5}
                fill="url(#gradDebtFill)" dot={false}
              />
            )}

            {byAge.some(r => r.propertyValue > 0) && (
              <Area type="monotone" dataKey="不動産"
                stroke={amber} strokeWidth={1} strokeOpacity={0.5}
                fill="url(#gradProperty)" dot={false}
              />
            )}

            <Area type="monotone" dataKey="金融資産"
              stroke={blue} strokeWidth={1} strokeOpacity={0.4}
              fill="url(#gradFinancial)" dot={false}
            />

            <Line type="monotone" dataKey="純資産"
              stroke={blue} strokeWidth={3}
              dot={false} activeDot={{ r: 5, fill: blue, stroke: '#000', strokeWidth: 2 }}
            />

          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingLeft: 4, flexWrap: 'wrap' }}>
          {[
            { color: blue,  label: '純資産', line: true, bold: true },
            { color: blue,  label: '金融資産', area: true },
            ...(byAge.some(r => r.propertyValue > 0) ? [{ color: amber, label: '不動産',  area: true }] : []),
            ...(byAge.some(r => r.loanBalance > 0)   ? [{ color: red,   label: '負債残高', area: true }] : []),
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {item.line
                ? <div style={{ width: 18, height: 3, borderRadius: 2, background: item.color }} />
                : <div style={{ width: 12, height: 10, borderRadius: 2, background: item.color, opacity: 0.4 }} />
              }
              <span style={{ fontSize: 10, color: item.bold ? blue : sub, fontWeight: item.bold ? 700 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {retirementDrawdownNote && (
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${bdr}`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: sub, marginBottom: 5 }}>
              📉 リタイア後に資産が減る主な理由（{fmtMan(retirementDrawdownNote.drop)}減少）
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {retirementDrawdownNote.parts.map((p, i) => (
                <p key={i} style={{ fontSize: 10, color: sub }}>・{p}</p>
              ))}
            </div>
          </div>
        )}
        </div>
        )}
      </div>

      {/* 計算根拠パネル */}
      <div style={{ background: darkMode ? '#1a1a1a' : '#f9fafb', borderRadius: 8, overflow: 'hidden' }}>
        <button
          onClick={() => setShowBasis(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: sub }}>📐 計算根拠を確認</span>
          <span style={{ fontSize: 10, color: sub }}>{showBasis ? '▲' : '▼'}</span>
        </button>
        {showBasis && (
          <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'リタイア年齢', val: `${lifePlan?.retirementAge ?? 65}歳` },
              { label: '想定寿命', val: `${lifePlan?.lifeExpectancy ?? 90}歳` },
              { label: '運用利回り（税引前）', val: `年${simulationSettings?.returnRate ?? 5}%`, note: '複利計算・課税20.315%考慮済み' },
              { label: 'インフレ率', val: (simulationSettings?.inflationRate ?? 0) > 0 ? `年${simulationSettings.inflationRate}%` : '考慮しない' },
              { label: '月間積立額', val: `¥${((simulationSettings?.monthlyInvestment ?? 0) + (simulationSettings?.monthlySavings ?? 0)).toLocaleString()}`, note: '投資＋貯金の合計' },
              { label: '計算方式', val: '複利（月次）', note: 'NISA非課税枠・一括投資・ライフイベントを反映' },
            ].map(({ label, val, note }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#eee'}` }}>
                <div>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  {note && <p style={{ fontSize: 9, color: darkMode ? '#444' : '#bbb', marginTop: 1 }}>{note}</p>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: txt, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
              </div>
            ))}
            <p style={{ fontSize: 9, color: darkMode ? '#444' : '#ccc', marginTop: 4 }}>
              ※ 将来の運用成果を保証するものではありません。あくまで参考値としてご利用ください。
            </p>
          </div>
        )}
      </div>

      </div>
      )}

      {subTab === 'scenario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* モンテカルロシミュレーション */}
      <div style={{ background: card, borderRadius: 12, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
        <button
          onClick={() => setSimulationSettings(prev => ({ ...prev, showMonteCarloSimulation: !prev.showMonteCarloSimulation }))}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: simulationSettings.showMonteCarloSimulation ? `1px solid ${bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: txt }}>確率的シミュレーション</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: blue, padding: '2px 8px', borderRadius: 10, background: darkMode ? 'rgba(0,229,255,0.1)' : 'rgba(59,130,246,0.08)' }}>100通り</span>
          </div>
          <span style={{ fontSize: 11, color: sub, opacity: 0.7, display: 'inline-block', transform: simulationSettings.showMonteCarloSimulation ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </button>
        {simulationSettings.showMonteCarloSimulation && monteCarloChartData && monteCarloChartData.length > 0 && (() => {
          const bandData = monteCarloChartData.map(d => ({
            ...d,
            バンド幅: Math.max(0, (d['範囲上限'] ?? 0) - (d['範囲下限'] ?? 0)),
          }));
          const last = bandData[bandData.length - 1];
          return (
            <div style={{ padding: '16px 16px 14px' }}>
              <p style={{ fontSize: 11, color: sub, lineHeight: 1.7, marginBottom: 14 }}>
                利回りにランダムな変動を加えた100通りの結果。<strong style={{ color: txt }}>青い帯</strong>は中央50%の幅、<strong style={{ color: '#0cff8c' }}>緑</strong>が最良・<strong style={{ color: '#ff453a' }}>赤</strong>が最悪シナリオです。
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={bandData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mcBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={blue} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={blue} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2a2a2a' : '#ebebeb'} vertical={false} />
                  <XAxis dataKey="年" tick={{ fontSize: 10, fill: sub }} />
                  <YAxis
                    tickFormatter={v => {
                      if (v === 0) return '0';
                      const abs = Math.abs(v);
                      if (abs >= 100_000_000) return `${(v/100_000_000).toFixed(1)}億`;
                      return `${Math.round(v/10000)}万`;
                    }}
                    tick={{ fontSize: 10, fill: sub }} width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      background: darkMode ? '#1c1c1e' : '#fff',
                      border: `1px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
                      borderRadius: 10, fontSize: 12,
                      color: darkMode ? '#f5f5f5' : '#111',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    }}
                    formatter={(v, name) => {
                      if (name === 'バンド幅' || name === '範囲下限') return null;
                      const fmt = val => val >= 100_000_000 ? `¥${(val/100_000_000).toFixed(1)}億` : `¥${Math.round(val/10000)}万`;
                      const labels = { '平均': '平均シナリオ', '最大': '最良シナリオ', '最小': '最悪シナリオ' };
                      return [fmt(v), labels[name] ?? name];
                    }}
                    labelFormatter={label => `${label}後`}
                  />
                  <Area type="monotone" dataKey="範囲下限" stroke="none" fill="transparent" legendType="none" />
                  <Area type="monotone" dataKey="バンド幅" stroke="none" fill="url(#mcBandGrad)" legendType="none" />
                  <Line type="monotone" dataKey="最小" stroke="#ff453a" strokeWidth={1.5} strokeDasharray="5 3" dot={false} strokeOpacity={0.85} />
                  <Line type="monotone" dataKey="最大" stroke="#0cff8c" strokeWidth={1.5} strokeDasharray="5 3" dot={false} strokeOpacity={0.85} />
                  <Line type="monotone" dataKey="平均" stroke={blue} strokeWidth={2.5} dot={false}
                    activeDot={{ r: 5, fill: blue, stroke: darkMode ? '#000' : '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
              {/* 凡例 */}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingLeft: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { type: 'line', color: '#0cff8c', label: '最良シナリオ' },
                  { type: 'line', color: blue,      label: '平均', bold: true },
                  { type: 'line', color: '#ff453a', label: '最悪シナリオ' },
                  { type: 'band', color: blue,      label: '中央50%の幅' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {item.type === 'band' ? (
                      <div style={{ width: 16, height: 10, borderRadius: 3, background: `${blue}35`, border: `1px solid ${blue}70` }} />
                    ) : (
                      <div style={{ width: 18, height: item.bold ? 3 : 2, borderRadius: 2, background: item.color, opacity: item.bold ? 1 : 0.85 }} />
                    )}
                    <span style={{ fontSize: 11, color: item.bold ? blue : sub, fontWeight: item.bold ? 700 : 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              {/* 最終値サマリー */}
              {last && (
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '最良', value: last['最大'], color: '#0cff8c' },
                    { label: '平均', value: last['平均'], color: blue },
                    { label: '最悪', value: last['最小'], color: '#ff453a' },
                  ].map(({ label, value, color }) => {
                    const fmt = v => v >= 100_000_000 ? `¥${(v/100_000_000).toFixed(1)}億` : v >= 10_000 ? `¥${Math.round(v/10000)}万` : `¥0`;
                    return (
                      <div key={label} style={{ padding: '10px 8px', borderRadius: 10, background: darkMode ? '#0a0a0a' : '#f8f8f8', textAlign: 'center', border: `1px solid ${bdr}` }}>
                        <p style={{ fontSize: 10, color: sub, marginBottom: 4 }}>{label}</p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{fmt(value)}</p>
                        <p style={{ fontSize: 9, color: sub, marginTop: 2 }}>{last['年']}後</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize: 10, color: darkMode ? '#2a2a2a' : '#d1d5db', marginTop: 10, textAlign: 'right' }}>
                ※将来の運用成果を保証するものではありません
              </p>
            </div>
          );
        })()}
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
                    <strong style={{ color: blue, marginLeft: 4 }}>{incomeGrowthEstimate}%<span>/</span>年</strong>
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

        <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: darkMode ? '#0d1f2d' : '#eff6ff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11 }}>⚙️</span>
          <p style={{ fontSize: 11, color: darkMode ? '#60a5fa' : '#2563eb', margin: 0 }}>
            NISA・利回り・インフレ率などの詳細は <strong>設定タブ → 積立・投資目標</strong> で設定できます
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>現役フェーズ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'annualIncome',   label: '年収',     min: 2000000, max: 30000000, step: 500000,
                fmt: v => v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${Math.round(v/10000)}万`, inputFmt: v => String(Math.round(v/10000)), parseFn: v => Math.round(Number(v)*10000) },
              { key: 'monthlyExpense', label: '月間生活費', min: 50000, max: 800000, step: 10000,
                fmt: v => `¥${v.toLocaleString()}`, inputFmt: v => String(v), parseFn: v => Number(v) },
              { key: 'incomeGrowthRate', label: '昇給率', min: 0, max: 5, step: 0.5,
                fmt: v => v === 0 ? '考慮しない' : `${v}%<span>/</span>年`, inputFmt: v => String(v), parseFn: v => Number(v) },
            ].map(({ key, label, min, max, step, fmt, inputFmt, parseFn }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  <input
                    type="text" inputMode="decimal"
                    value={inputFmt(lifePlan[key] ?? min)}
                    onChange={e => { const v = parseFn(e.target.value.replace(new RegExp('[^0-9.]', 'g'), '')); if (!isNaN(v) && v >= min && v <= max) setLifePlan(prev => ({ ...prev, [key]: v })); }}
                    style={{ width: 80, padding: '3px 8px', borderRadius: 8, border: `1px solid ${bdr}`, background: darkMode ? '#1a1a1a' : '#f5f5f5', color: txt, fontSize: 13, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                  />
                </div>
                <input type="range" min={min} max={max} step={step}
                  value={lifePlan[key] ?? min}
                  onChange={e => setLifePlan(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: blue }}
                />
                {key === 'incomeGrowthRate' && lifePlan.incomeGrowthRate > 0 && (() => {
                  const rate = lifePlan.incomeGrowthRate / 100;
                  const base = lifePlan.annualIncome ?? 6000000;
                  const milestones = [5, 10, 20, 30].map(y => ({
                    age: currentAge + y,
                    gross: Math.round(base * Math.pow(1 + rate, y)),
                  })).filter(m => m.age < retirementAge);
                  if (milestones.length === 0) return null;
                  return (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {milestones.map(m => (
                        <div key={m.age} style={{
                          padding: '3px 8px', borderRadius: 6,
                          background: darkMode ? 'rgba(0,229,255,0.07)' : 'rgba(0,229,255,0.06)',
                          border: `1px solid rgba(0,229,255,0.18)`,
                        }}>
                          <span style={{ fontSize: 10, color: sub }}>{m.age}歳 </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: blue, fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>
                            {m.gross >= 10_000_000 ? `${(m.gross/10_000_000).toFixed(1)}千万` : `${Math.round(m.gross/10_000)}万`}
                          </span>
                          <span style={{ fontSize: 9, color: sub, marginLeft: 2 }}>
                            手取{Math.round(calcTakeHome(m.gross)/10_000)}万
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: sub }}>{label}</span>
                  <input
                    type="text" inputMode="decimal"
                    value={String(lifePlan[key] ?? min)}
                    onChange={e => { const v = Number(e.target.value.replace(new RegExp('[^0-9]', 'g'), '')); if (!isNaN(v) && v >= min && v <= max) setLifePlan(prev => ({ ...prev, [key]: v })); }}
                    style={{ width: 90, padding: '3px 8px', borderRadius: 8, border: `1px solid ${bdr}`, background: darkMode ? '#1a1a1a' : '#f5f5f5', color: txt, fontSize: 13, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                  />
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
              fmt: v => `¥${v.toLocaleString()}`, color: theme.purple },
            { key: 'returnRate',        label: '想定利回り',     min: 0, max: 12,     step: 0.5,
              fmt: v => `${v}%`,                 color: blue },
          ].map(({ key, label, min, max, step, fmt, color }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: sub }}>{label}</span>
                <input
                  type="text" inputMode="decimal"
                  value={String(simulationSettings[key] ?? min)}
                  onChange={e => { const v = Number(e.target.value.replace(new RegExp('[^0-9.]', 'g'), '')); if (!isNaN(v) && v >= min && v <= max) setSimulationSettings(prev => ({ ...prev, [key]: v })); }}
                  style={{ width: 80, padding: '3px 8px', borderRadius: 8, border: `1px solid ${bdr}`, background: darkMode ? '#1a1a1a' : '#f5f5f5', color: txt, fontSize: 13, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                />
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
            ...(lifeExpectancy > 75 ? [{ label: '75歳（後期高齢）', age: 75 }] : []),
            { label: `${lifeExpectancy}歳（寿命）`,                   age: lifeExpectancy },
          ].filter(m => m.age >= currentAge && m.age <= lifeExpectancy)
          .map(({ label, age }) => {
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

      </div>
      )}

      {/* ===== インサイトタブ: BCL 3カード ===== */}
      {subTab === 'insight' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* --- C: 貯蓄率KPI --- */}
          <div style={{ borderRadius: 12, overflow: 'hidden', background: card, border: `1px solid ${bdr}` }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${bdr}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: sub, marginBottom: 10 }}>貯蓄率トラッカー</p>
              {savingsRateData ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 800, color: savingsRateData.grade.color }}>{savingsRateData.latest}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: savingsRateData.grade.color, padding: '2px 8px', borderRadius: 20, background: `${savingsRateData.grade.color}20` }}>{savingsRateData.grade.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 9, color: sub, marginBottom: 2 }}>3ヶ月平均</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: sub }}>{savingsRateData.avg}%</p>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: darkMode ? '#1a1a1a' : '#f0f0f0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(savingsRateData.latest, 100)}%`, borderRadius: 3, background: savingsRateData.grade.color, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: darkMode ? '#333' : '#ddd' }}>0%</span>
                    <span style={{ fontSize: 9, color: darkMode ? '#444' : '#ccc' }}>目標20%</span>
                    <span style={{ fontSize: 9, color: darkMode ? '#444' : '#ccc' }}>FIRE圏50%</span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: sub, marginBottom: 4 }}>📊 月を締めると表示されます</p>
                  <p style={{ fontSize: 11, color: darkMode ? '#333' : '#ccc' }}>1ヶ月分の締め処理後に貯蓄率が計算されます</p>
                </div>
              )}
            </div>
            <div style={{ padding: '8px 14px', background: darkMode ? '#080808' : '#fafafa' }}>
              <p style={{ fontSize: 10, color: sub }}>※前月締め確定値ベース。今月分は月締め後に反映。</p>
            </div>
          </div>

          {/* --- B: ライフステージ先読み --- */}
          <div style={{ borderRadius: 12, background: card, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${bdr}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: sub }}>UPCOMING MILESTONES</p>
            </div>
            {lifeStageData && lifeStageData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lifeStageData.map((ev, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < lifeStageData.length-1 ? `1px solid ${darkMode?'#141414':'#f5f5f5'}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: ev.urgency==='high'?'rgba(255,69,58,0.12)':ev.urgency==='mid'?'rgba(255,159,10,0.12)':'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ev.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: txt, marginBottom: 2 }}>{ev.label}</p>
                          <p style={{ fontSize: 9, color: sub }}>{ev.note}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: ev.urgency==='high'?'#ff453a':ev.urgency==='mid'?'#ff9f0a':'#00e5ff' }}>¥{(ev.need/10000).toFixed(0)}万</p>
                          <p style={{ fontSize: 9, color: sub }}>{ev.yearsTo}年後・{ev.age}歳</p>
                        </div>
                      </div>
                      <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 6, background: darkMode?'#0a0a0a':'#f8f8f8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: sub }}>月々</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: txt }}>¥{ev.monthly.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: sub }}>の積立が必要</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: sub, marginBottom: 4 }}>👤 年齢を設定すると表示されます</p>
                <p style={{ fontSize: 11, color: darkMode?'#333':'#ccc' }}>設定タブ → ユーザー情報から年齢を入力してください</p>
              </div>
            )}
            <div style={{ padding: '8px 16px', background: darkMode?'#080808':'#fafafa', borderTop: `1px solid ${bdr}` }}>
              <p style={{ fontSize: 9, color: sub, textAlign: 'center' }}>※ライフプラン設定で年齢・家族構成を更新すると精度が上がります</p>
            </div>
          </div>

          {/* --- L: 転職シミュレーター --- */}
          <div style={{ borderRadius: 12, background: card, border: `1px solid ${bdr}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 12px', borderBottom: jobChangeData ? `1px solid ${bdr}` : 'none' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: sub, marginBottom: 10 }}>転職シミュレーター</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 12, color: sub, whiteSpace: 'nowrap' }}>年収が</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[-100, -50, 50, 100, 200].map(v => (
                    <button key={v} onClick={() => setJobChangeAmount(jobChangeAmount === v ? 0 : v)}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${jobChangeAmount===v?(v>0?'#0cff8c':'#ff453a'):bdr}`,
                        background: jobChangeAmount===v?(v>0?'rgba(12,255,140,0.1)':'rgba(255,69,58,0.1)'):'transparent',
                        color: jobChangeAmount===v?(v>0?'#0cff8c':'#ff453a'):sub }}>
                      {v > 0 ? `+${v}万` : `${v}万`}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: sub, whiteSpace: 'nowrap' }}>変わったら</p>
              </div>
            </div>
            {jobChangeData ? (
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: darkMode?'#080808':'#f8f8f8' }}>
                    <p style={{ fontSize: 9, color: sub, marginBottom: 4 }}>手取り増減/月</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: jobChangeData.isPositive?'#0cff8c':'#ff453a' }}>
                      {jobChangeData.isPositive?'+':''}¥{jobChangeData.monthlyChange.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: darkMode?'#080808':'#f8f8f8' }}>
                    <p style={{ fontSize: 9, color: sub, marginBottom: 4 }}>退職までの総資産差</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: jobChangeData.isPositive?'#0cff8c':'#ff453a' }}>
                      {jobChangeData.isPositive?'+':''}{(jobChangeData.futureValue/10000).toFixed(0)}万
                    </p>
                  </div>
                </div>
                {jobChangeData.yearsEarlier && jobChangeData.isPositive && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(12,255,140,0.06)', border: '1px solid rgba(12,255,140,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🚀</span>
                    <p style={{ fontSize: 11, color: '#0cff8c', fontWeight: 600 }}>目標達成が約{jobChangeData.yearsEarlier}年早まります</p>
                  </div>
                )}
                <p style={{ fontSize: 9, color: darkMode?'#333':'#ddd', marginTop: 8, textAlign: 'right' }}>
                  ※複利({simulationSettings?.returnRate||5}%/年)・手取り75%換算の概算
                </p>
              </div>
            ) : (
              <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: sub }}>👆 年収の変化幅を選んでください</p>
              </div>
            )}
          </div>

        </div>
      )}

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
    </div>
  );
}
