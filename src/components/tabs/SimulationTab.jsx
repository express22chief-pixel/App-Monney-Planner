import React, { useCallback, useMemo } from 'react';
import { lifeEventTemplates, eventIcons } from '../../constants';
import { Zap, Share2, Home, X, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { calculateWithdrawalSimulation } from '../../utils/calc';
import HousingComparisonModal from '../modals/HousingComparisonModal';

export default function SimulationTab(props) {
  const {
    theme, darkMode, simulationSettings, setSimulationSettings,
    simulationResults, monteCarloResults, scenarioResults, chartData, monteCarloChartData,
    lifeEvents, setShowLifeEventModal, setEditingLifeEvent, deleteLifeEvent,
    applyRiskProfile, userInfo, assetData, calculateBenchmark, setActiveTab,
    housingParams, setHousingParams, housingComparison,
    showHousingModal, setShowHousingModal,
  } = props;

  const riskProfiles = {
    conservative: { label: '保守的', icon: '🛡️', description: '安全性重視', returnRate: 3, monthlyInvestment: 20000, monthlySavings: 50000, useLumpSum: false, volatility: 0.05 },
    standard:     { label: '標準的', icon: '⚖️', description: 'バランス重視', returnRate: 5, monthlyInvestment: 30000, monthlySavings: 30000, useLumpSum: true,  volatility: 0.10 },
    aggressive:   { label: '積極的', icon: '🚀', description: '成長重視',    returnRate: 7, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: true,  volatility: 0.15 },
  };

  const finalValue     = simulationResults[simulationResults.length - 1]?.totalValue || 0;
  const achievement    = Math.min((finalValue / simulationSettings.targetAmount) * 100, 100);
  const totalTaxSaved  = simulationResults[simulationResults.length - 1]?.taxSaved || 0;
  const futureAge      = (userInfo?.age ? Number(userInfo.age) : 25) + simulationSettings.years;
  const futureBenchmark = calculateBenchmark(futureAge);

  const [shareModal, setShareModal] = React.useState(false);
  const [shareUrl, setShareUrl]     = React.useState(null);

  const generateShareCard = useCallback(() => {
    const canvas  = document.createElement('canvas');
    canvas.width  = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(60, 60, 960, 960, 32);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 36px sans-serif';
    ctx.fillText('Money Planner', 100, 140);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText('Y' + finalValue.toLocaleString(), 100, 280);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 32px sans-serif';
    ctx.fillText(simulationSettings.years + '年後の予測資産', 100, 330);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(100, 380, 880, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.roundRect(100, 380, 880 * (achievement / 100), 20, 10);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px sans-serif';
    ctx.fillText('目標達成率 ' + achievement.toFixed(1) + '%', 100, 440);
    setShareUrl(canvas.toDataURL('image/png'));
    setShareModal(true);
  }, [finalValue, achievement, simulationSettings, totalTaxSaved]);

  const withdrawalSim = useMemo(() => {
    if (!simulationSettings.useWithdrawal) return null;
    return calculateWithdrawalSimulation(finalValue, {
      monthlyWithdrawal: simulationSettings.withdrawalMonthly,
      returnRate:        simulationSettings.withdrawalReturnRate,
      inflationRate:     simulationSettings.withdrawalInflationRate,
      years:             simulationSettings.withdrawalYears,
    });
  }, [simulationSettings, finalValue]);

  return (
    <div className="space-y-3 animate-fadeIn">

      <div className={`${theme.cardGlass} rounded-xl p-4`}>
        <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide flex items-center gap-2`}>
          <Zap size={16} style={{ color: theme.accent }} />
          投資スタイル
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(riskProfiles).map(([key, profile]) => (
            <button key={key} onClick={() => applyRiskProfile(key)}
              className={`p-3 rounded-lg transition-all duration-200 hover-scale ${simulationSettings.riskProfile === key ? 'ring-2 scale-105' : ''}`}
              style={{ backgroundColor: simulationSettings.riskProfile === key ? (darkMode ? '#262626' : '#f5f5f5') : (darkMode ? '#171717' : '#fafafa'), ringColor: theme.accent }}>
              <div className="text-2xl mb-1">{profile.icon}</div>
              <div className={`text-xs font-semibold ${theme.text}`}>{profile.label}</div>
              <div className={`text-xs ${theme.textSecondary} mt-1`}>{profile.description}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setActiveTab('settings')}
        className={`w-full ${theme.cardGlass} rounded-xl p-4 flex items-center justify-between hover-scale transition-all`}>
        <div className="text-left">
          <p className={`text-sm font-semibold ${theme.text}`}>積立・投資目標の設定</p>
          <p className={`text-xs ${theme.textSecondary} mt-0.5`}>目標金額・運用期間・利回りなど</p>
        </div>
        <span className={`text-lg ${theme.textSecondary}`}>›</span>
      </button>

      <div className={`${theme.cardGlass} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>Life Events</h2>
          <button onClick={() => { setEditingLifeEvent(null); setShowLifeEventModal(true); }}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover-scale"
            style={{ backgroundColor: theme.accent }}>
            + 追加
          </button>
        </div>
        {lifeEvents.length === 0 ? (
          <p className={`${theme.textSecondary} text-center py-3 text-sm`}>イベントを追加</p>
        ) : (
          <div className="space-y-2">
            {lifeEvents.sort((a, b) => a.date.localeCompare(b.date)).map((event, idx) => (
              <div key={event.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg`}>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xl">{event.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.text}`}>{event.name}</p>
                    <p className={`text-xs ${theme.textSecondary} tabular-nums`}>{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>¥{event.amount.toLocaleString()}</p>
                  <button onClick={() => { setEditingLifeEvent(event); setShowLifeEventModal(true); }} className="text-blue-500">✏️</button>
                  <button onClick={() => deleteLifeEvent(event.id)} className="text-red-500">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${theme.cardGlass} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>{simulationSettings.years}年後の予測</h2>
          <button onClick={generateShareCard}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: theme.accent }}>
            <Share2 size={12} /> シェア
          </button>
        </div>

        <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} rounded-xl p-4 mb-3`}>
          <p className={`text-xs ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>予想資産額</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: theme.green }}>¥{finalValue.toLocaleString()}</p>
          <div className={`w-full ${darkMode ? 'bg-neutral-700' : 'bg-neutral-200'} rounded-full h-2 my-2 overflow-hidden`}>
            <div className="h-2 rounded-full" style={{ width: `${achievement}%`, backgroundColor: theme.green }} />
          </div>
          <p className={`text-xs ${theme.textSecondary} tabular-nums`}>目標達成率: {achievement.toFixed(1)}%</p>
          {simulationSettings.useNisa && (
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${darkMode ? '#262626' : '#d1fae5'}` }}>
              <p className="text-xs font-semibold tabular-nums" style={{ color: theme.green }}>
                NISA節税効果: 約¥{totalTaxSaved.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {achievement >= 100 ? (
          <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} border-2 rounded-xl p-3 text-center mb-3`} style={{ borderColor: theme.green }}>
            <p className="text-xl mb-1">🎉</p>
            <p className="text-sm font-semibold" style={{ color: theme.green }}>目標達成可能</p>
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-neutral-800' : 'bg-orange-50'} border-2 rounded-xl p-3 mb-3`} style={{ borderColor: theme.orange }}>
            <p className="text-xs font-semibold mb-1" style={{ color: theme.orange }}>追加投資が必要</p>
            <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-orange-700'}`}>
              月々約<span className="font-bold tabular-nums"> ¥{(Math.max(0, Math.ceil((simulationSettings.targetAmount - finalValue) / (simulationSettings.years * 12) / 1000) * 1000)).toLocaleString()}</span>円
            </p>
          </div>
        )}

        <div className="mb-4">
          {!simulationSettings.showMonteCarloSimulation && (
            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 mb-3`}>
              <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>{simulationSettings.years}年後の資産構成</h3>
              {(() => {
                const last = simulationResults[simulationResults.length - 1];
                const total = last?.totalValue || 1;
                const items = [
                  { label: '貯金', val: last?.savings || 0, color: '#3b82f6' },
                  { label: '投資', val: last?.regularInvestment || 0, color: '#a855f7' },
                  ...(simulationSettings.useNisa ? [{ label: 'NISA', val: last?.nisaInvestment || 0, color: theme.green }] : []),
                  { label: '待機', val: last?.dryPowder || 0, color: theme.accent },
                ];
                return (
                  <>
                    <div className="flex gap-2 mb-2">
                      {items.map(item => (
                        <div key={item.label} className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                            <span className={`text-xs ${theme.textSecondary}`}>{item.label}</span>
                          </div>
                          <p className="text-sm font-bold tabular-nums" style={{ color: item.color }}>{(item.val / total * 100).toFixed(1)}%</p>
                          <p className={`text-xs ${theme.textSecondary} tabular-nums`}>¥{(item.val / 10000).toFixed(0)}万</p>
                        </div>
                      ))}
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden flex">
                      {items.map(item => (
                        <div key={item.label} style={{ width: `${item.val / total * 100}%`, backgroundColor: item.color }} />
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>
            {simulationSettings.showMonteCarloSimulation ? '100通りの未来予測' : '資産推移'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            {simulationSettings.showMonteCarloSimulation ? (
              <AreaChart data={monteCarloChartData}>
                <defs>
                  <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.accent} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                <XAxis dataKey="年" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} />
                <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={v => `¥${(v/1000000).toFixed(0)}M`} />
                <Tooltip formatter={v => `¥${v.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }} />
                <Area type="monotone" dataKey="最大" stroke="none" fill="none" />
                <Area type="monotone" dataKey="範囲上限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                <Area type="monotone" dataKey="範囲下限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                <Line type="monotone" dataKey="平均" stroke={theme.accent} strokeWidth={3} dot={false} />
              </AreaChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorNisa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.green} stopOpacity={0.6}/><stop offset="95%" stopColor={theme.green} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorDryPowder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.accent} stopOpacity={0.6}/><stop offset="95%" stopColor={theme.accent} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                <XAxis dataKey="年" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} />
                <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={v => `¥${(v/1000000).toFixed(0)}M`} />
                <Tooltip formatter={v => `¥${v.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                <Area type="monotone" dataKey="貯金" stackId="1" stroke="#3b82f6" fill="url(#colorSavings)" />
                <Area type="monotone" dataKey="課税口座" stackId="1" stroke="#a855f7" fill="url(#colorInvest)" />
                {simulationSettings.useNisa && <Area type="monotone" dataKey="NISA" stackId="1" stroke={theme.green} fill="url(#colorNisa)" />}
                <Area type="monotone" dataKey="待機資金" stackId="1" stroke={theme.accent} fill="url(#colorDryPowder)" />
                {simulationSettings.inflationRate > 0 && (
                  <Line type="monotone" dataKey="実質価値" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {scenarioResults && (
        <div className={`${theme.cardGlass} rounded-xl p-4`}>
          <h2 className={`text-sm font-semibold ${theme.text} mb-1 uppercase tracking-wide`}>シナリオ比較</h2>
          <p className={`text-xs ${theme.textSecondary} mb-3`}>積立額を増やした場合の{simulationSettings.years}年後の差</p>
          <div className="space-y-3 mb-4">
            {scenarioResults.map((s) => {
              const val    = s.results[s.results.length - 1]?.totalValue || 0;
              const maxVal = scenarioResults[scenarioResults.length - 1].results[scenarioResults[scenarioResults.length - 1].results.length - 1]?.totalValue || 1;
              return (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className={`text-xs font-medium ${theme.text}`}>{s.label}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>¥{val.toLocaleString()}</span>
                  </div>
                  <div className={`w-full h-2 ${darkMode ? 'bg-neutral-700' : 'bg-neutral-200'} rounded-full overflow-hidden`}>
                    <div className="h-2 rounded-full" style={{ width: `${(val / maxVal) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {scenarioResults.slice(1).map((s) => {
              const base = scenarioResults[0].results[scenarioResults[0].results.length - 1]?.totalValue || 0;
              const val  = s.results[s.results.length - 1]?.totalValue || 0;
              return (
                <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <p className={`text-xs ${theme.textSecondary} mb-0.5`}>{s.label} の上乗せ</p>
                  <p className="text-base font-bold tabular-nums" style={{ color: s.color }}>+¥{(val - base).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={Array.from({ length: simulationSettings.years }, (_, i) => {
              const row = { year: i + 1 };
              scenarioResults.forEach(s => { row[s.label] = s.results[i]?.totalValue || 0; });
              return row;
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
              <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
              <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
              <Tooltip formatter={v => `¥${Number(v).toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {scenarioResults.map((s, i) => (
                <Line key={s.label} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2}
                  dot={false} strokeDasharray={i === 0 ? '5 3' : undefined} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {simulationSettings.useWithdrawal && withdrawalSim && (() => {
        const { results, depletedYear, sustainableYears } = withdrawalSim;
        return (
          <div className={`${theme.cardGlass} rounded-xl p-4`}>
            <h2 className="text-sm font-semibold mb-1 uppercase tracking-wide" style={{ color: '#ef4444' }}>取り崩しフェーズ</h2>
            <p className={`text-xs ${theme.textSecondary} mb-3`}>
              {simulationSettings.years}年後の資産から月¥{simulationSettings.withdrawalMonthly.toLocaleString()}ずつ取り崩した場合
            </p>
            <div className={`rounded-xl p-4 mb-3 ${depletedYear ? (darkMode ? 'bg-red-950/30' : 'bg-red-50') : (darkMode ? 'bg-green-950/30' : 'bg-green-50')}`}>
              <p className="text-xs font-semibold mb-1" style={{ color: depletedYear ? '#ef4444' : '#10b981' }}>
                {depletedYear ? `${depletedYear}年目に資産枯渇` : `${sustainableYears}年間持続可能`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: '取り崩し開始資産', val: `¥${finalValue.toLocaleString()}`, color: theme.accent },
                { label: '累計取り崩し額', val: `¥${(results[results.length - 1]?.cumulativeWithdrawn || 0).toLocaleString()}`, color: '#f59e0b' },
                { label: 'インフレ率', val: `${simulationSettings.withdrawalInflationRate}%/年`, color: '#a78bfa' },
                { label: '最終月取り崩し額', val: `¥${(results[results.length - 1]?.monthlyWithdrawal || 0).toLocaleString()}`, color: '#ef4444' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <p className={`text-xs ${theme.textSecondary} mb-0.5`}>{item.label}</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: item.color }}>{item.val}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={results.map(r => ({ year: r.year, 残高: r.balance, 実質価値: r.realValue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
                <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
                <Tooltip formatter={v => `¥${Number(v).toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="残高" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="実質価値" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      <div className={`${theme.cardGlass} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide flex items-center gap-2`}>
              <Home size={14} /> 持ち家 vs 賃貸
            </h2>
            {!housingComparison && <p className={`text-xs ${theme.textSecondary} mt-0.5`}>条件を設定してシミュレーション</p>}
          </div>
          <button onClick={() => setShowHousingModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#3b82f6' }}>
            {housingComparison ? '設定を変更' : '設定する'}
          </button>
        </div>

        {!housingComparison && (
          <div className={`rounded-xl p-6 text-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
            <p className="text-3xl mb-2">🏠</p>
            <p className={`text-sm font-semibold ${theme.text} mb-1`}>購入 vs 賃貸+投資の比較</p>
            <p className={`text-xs ${theme.textSecondary}`}>物件価格・ローン条件・家賃を入力すると<br />どちらが有利かを純資産で比較します</p>
          </div>
        )}

        {housingComparison && (() => {
          const { buyScenarios, rentScenario, summary } = housingComparison;
          const refBuy = buyScenarios.find(s => s.key === 'fixed' || s.key === 'neutral') || buyScenarios[0];
          const hp = housingParams;
          const chartData3 = Array.from({ length: hp.compareYears }, (_, i) => {
            const row = { year: i + 1 };
            buyScenarios.forEach(s => { row[s.label] = s.yearlyData[i]?.netAssets || 0; });
            row['賃貸+投資'] = rentScenario.yearlyData[i]?.netAssets || 0;
            return row;
          });
          return (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 ${summary.winner === 'buy' ? (darkMode ? 'bg-blue-950/40' : 'bg-blue-50') : (darkMode ? 'bg-purple-950/40' : 'bg-purple-50')}`}>
                <p className={`text-xs font-medium mb-1 ${theme.textSecondary}`}>{hp.compareYears}年後の純資産比較</p>
                <p className="text-xl font-bold" style={{ color: summary.winner === 'buy' ? '#3b82f6' : '#a78bfa' }}>
                  {summary.winner === 'buy' ? '🏠 購入が有利' : '🔑 賃貸+投資が有利'} 差額 ¥{summary.diff.toLocaleString()}
                </p>
                {summary.crossoverYear && <p className={`text-xs mt-1 ${theme.textSecondary}`}>{summary.crossoverYear}年目に逆転</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏠 購入', value: summary.buyFinal, color: '#3b82f6',
                    lines: [`金融資産 ¥${((refBuy.yearlyData[hp.compareYears-1]?.financialAssets||0)/10000).toFixed(0)}万`, `不動産 ¥${(refBuy.finalProperty/10000).toFixed(0)}万`, `残債 -¥${(refBuy.finalLoan/10000).toFixed(0)}万`] },
                  { label: '🔑 賃貸+投資', value: summary.rentFinal, color: '#a78bfa',
                    lines: [`金融資産 ¥${(rentScenario.finalNetAssets/10000).toFixed(0)}万`, `総家賃 -¥${(rentScenario.totalRentPaid/10000).toFixed(0)}万`, ''] },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-semibold mb-1 ${theme.textSecondary}`}>{s.label}</p>
                    <p className="text-base font-bold tabular-nums mb-2" style={{ color: s.color }}>¥{s.value.toLocaleString()}</p>
                    {s.lines.map((line, i) => <p key={i} className={`text-xs tabular-nums ${theme.textSecondary}`}>{line}</p>)}
                  </div>
                ))}
              </div>

              <h3 className={`text-xs font-semibold ${theme.text} uppercase tracking-wide`}>純資産推移</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                  <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
                  <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
                  <Tooltip formatter={(v, name) => [`¥${Number(v).toLocaleString()}`, name]} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {summary.crossoverYear && (
                    <ReferenceLine x={summary.crossoverYear} stroke="#f59e0b" strokeDasharray="4 2"
                      label={{ value: `${summary.crossoverYear}年逆転`, position: 'top', fontSize: 9, fill: '#f59e0b' }} />
                  )}
                  {[...buyScenarios.map(s => s.label), '賃貸+投資'].map((label, i) => (
                    <Line key={label} type="monotone" dataKey={label}
                      stroke={[...buyScenarios.map(s => s.color), '#a78bfa'][i]}
                      strokeWidth={label === '賃貸+投資' ? 2.5 : 2}
                      dot={false} strokeDasharray={label === '賃貸+投資' ? '5 3' : undefined} />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                <p className={`text-xs font-semibold ${theme.text} mb-2`}>住宅ローン詳細</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ['総返済額', `¥${refBuy.totalRepayment.toLocaleString()}`],
                    ['うち利息', `¥${refBuy.totalInterest.toLocaleString()}`],
                    ['ローン控除（累計）', `¥${refBuy.totalTaxCredit.toLocaleString()}`],
                    ['実質総コスト', `¥${(refBuy.totalRepayment - refBuy.totalTaxCredit).toLocaleString()}`],
                    ['完済予定', refBuy.finalLoan === 0 ? `${new Date().getFullYear() + hp.loanMonths/12}年頃` : '比較期間後も継続'],
                    ['控除適用期間', '最大13年（年収2,000万以下）'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className={`text-xs ${theme.textSecondary}`}>{k}</span>
                      <span className={`text-xs font-bold tabular-nums ${theme.text}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hp.rateType === 'variable' && buyScenarios.length > 1 && (
                <div className={`rounded-xl p-3 ${darkMode ? 'bg-yellow-950/30' : 'bg-yellow-50'}`}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#d97706' }}>変動金利シナリオ別の純資産</p>
                  {buyScenarios.map(s => (
                    <div key={s.key} className="flex justify-between items-center py-1">
                      <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>¥{s.finalNetAssets.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {showHousingModal && (
        <HousingComparisonModal
          theme={theme} darkMode={darkMode}
          housingParams={housingParams}
          setHousingParams={setHousingParams}
          setShowHousingModal={setShowHousingModal}
        />
      )}

      {shareModal && shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-4 max-w-sm w-full`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-semibold ${theme.text}`}>シェア画像</p>
              <button onClick={() => setShareModal(false)} className={theme.textSecondary}><X size={18} /></button>
            </div>
            <img src={shareUrl} alt="share" className="w-full rounded-xl mb-3" />
            <div className="flex gap-2">
              <a href={shareUrl} download="money-planner.png"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: theme.accent }}>
                <Download size={14} /> 保存
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
