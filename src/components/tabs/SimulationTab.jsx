import React, { useRef, useState, useCallback } from 'react';
import { lifeEventTemplates, eventIcons } from '../../constants';
import { Zap, Share2, X, Download, Home } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { calculateWithdrawalSimulation } from '../../utils/calc';
import HousingComparisonModal from '../modals/HousingComparisonModal';

// -- シェアカード生成（Canvas） ----------------------------------------------
function generateShareCard({ finalValue, achievement, years, targetAmount, totalTaxSaved, useNisa, monthlyInvestment, returnRate, simulationResults, userInfo, darkMode }) {
  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景グラデーション
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, darkMode ? '#0a0a0a' : '#f0fdf4');
  bg.addColorStop(1, darkMode ? '#0d1f0f' : '#ecfdf5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 装飾円（背景）
  const drawCircle = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCircle(W * 0.85, H * 0.1, 320, darkMode ? '#10b98122' : '#10b98118');
  drawCircle(W * 0.1, H * 0.85, 260, darkMode ? '#3b82f618' : '#3b82f614');

  // アプリ名
  ctx.fillStyle = darkMode ? '#10b981' : '#059669';
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.fillText('Money Planner', 72, 88);

  // タグライン
  ctx.fillStyle = darkMode ? '#6b7280' : '#9ca3af';
  ctx.font = '26px -apple-system, sans-serif';
  ctx.fillText('資産形成シミュレーション', 72, 128);

  // 区切り線
  ctx.strokeStyle = darkMode ? '#10b98133' : '#10b98144';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(72, 152); ctx.lineTo(W - 72, 152); ctx.stroke();

  // メインカード背景
  const cardX = 60, cardY = 175, cardW = W - 120, cardH = 270;
  ctx.fillStyle = darkMode ? '#111827cc' : '#ffffffcc';
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();

  // 「予想資産額」ラベル
  ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
  ctx.font = '600 26px -apple-system, sans-serif';
  ctx.fillText('予想資産額', cardX + 40, cardY + 58);

  // 予想資産額（大きく）
  ctx.fillStyle = darkMode ? '#10b981' : '#059669';
  const valueStr = '¥' + finalValue.toLocaleString();
  ctx.font = `bold ${valueStr.length > 12 ? 72 : 84}px -apple-system, sans-serif`;
  ctx.fillText(valueStr, cardX + 40, cardY + 148);

  // 目標達成率バー
  const barX = cardX + 40, barY = cardY + 180, barW = cardW - 80, barH = 14;
  ctx.fillStyle = darkMode ? '#374151' : '#d1fae5';
  roundRect(ctx, barX, barY, barW, barH, 7); ctx.fill();
  ctx.fillStyle = darkMode ? '#10b981' : '#059669';
  roundRect(ctx, barX, barY, barW * (achievement / 100), barH, 7); ctx.fill();

  // 達成率テキスト
  ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
  ctx.font = '24px -apple-system, sans-serif';
  ctx.fillText(`目標達成率: ${achievement.toFixed(1)}%　／　目標: ¥${targetAmount.toLocaleString()}`, cardX + 40, cardY + 232);

  // スタッツ3列
  const stats = [
    { label: '運用期間', value: `${years}年` },
    { label: '月々の積立', value: `¥${monthlyInvestment.toLocaleString()}` },
    { label: '想定利回り', value: `${returnRate}%` },
  ];
  if (useNisa && totalTaxSaved > 0) stats.push({ label: 'NISA節税効果', value: `¥${totalTaxSaved.toLocaleString()}` });

  const cols = stats.length <= 3 ? 3 : 4;
  const colW = (W - 120) / cols;
  stats.forEach((s, i) => {
    const cx = 60 + colW * i + colW / 2;
    const cy = 495;
    ctx.fillStyle = darkMode ? '#111827cc' : '#ffffffcc';
    roundRect(ctx, 60 + colW * i + 8, cy - 52, colW - 16, 108, 20); ctx.fill();
    ctx.fillStyle = darkMode ? '#6b7280' : '#9ca3af';
    ctx.font = '22px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, cx, cy - 14);
    ctx.fillStyle = darkMode ? '#f9fafb' : '#111827';
    ctx.font = 'bold 30px -apple-system, sans-serif';
    ctx.fillText(s.value, cx, cy + 28);
    ctx.textAlign = 'left';
  });

  // グラフエリア
  const gX = 60, gY = 640, gW = W - 120, gH = 290;
  ctx.fillStyle = darkMode ? '#111827cc' : '#ffffffcc';
  roundRect(ctx, gX, gY, gW, gH, 20); ctx.fill();

  if (simulationResults && simulationResults.length > 1) {
    const maxVal = Math.max(...simulationResults.map(r => r.totalValue));
    const pts = simulationResults.map((r, i) => ({
      x: gX + 40 + (i / (simulationResults.length - 1)) * (gW - 80),
      y: gY + gH - 40 - (r.totalValue / maxVal) * (gH - 70),
    }));

    // グラデーション塗り
    const gradient = ctx.createLinearGradient(0, gY, 0, gY + gH);
    gradient.addColorStop(0, darkMode ? '#10b98155' : '#10b98133');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, gY + gH - 40);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, gY + gH - 40);
    ctx.closePath();
    ctx.fill();

    // 折れ線
    ctx.strokeStyle = darkMode ? '#10b981' : '#059669';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // X軸ラベル（5点）
    ctx.fillStyle = darkMode ? '#6b7280' : '#9ca3af';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const labelIndices = [0, Math.floor(simulationResults.length / 4), Math.floor(simulationResults.length / 2), Math.floor(simulationResults.length * 3 / 4), simulationResults.length - 1];
    labelIndices.forEach(idx => {
      if (simulationResults[idx]) {
        ctx.fillText(`${simulationResults[idx].year}年後`, pts[idx].x, gY + gH - 8);
      }
    });
    ctx.textAlign = 'left';
  }

  // フッター
  ctx.fillStyle = darkMode ? '#374151' : '#d1fae5';
  ctx.font = '22px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Money Planner で資産シミュレーション', W / 2, H - 32);
  ctx.textAlign = 'left';

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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
    aggressive:   { label: '積極的', icon: '🚀', description: '成長重視',    returnRate: 7, monthlyInvestment: 50000, monthlySavings: 20000, useLumpSum: true,  volatility: 0.15 }
  };

  const [shareImg, setShareImg] = useState(null);

  const handleShare = useCallback(() => {
    const canvas = generateShareCard({
      finalValue, achievement, years: simulationSettings.years,
      targetAmount: simulationSettings.targetAmount,
      totalTaxSaved, useNisa: simulationSettings.useNisa,
      monthlyInvestment: simulationSettings.monthlyInvestment,
      returnRate: simulationSettings.returnRate,
      simulationResults, userInfo, darkMode,
    });
    setShareImg(canvas.toDataURL('image/png'));
  }, [finalValue, achievement, totalTaxSaved, simulationSettings, simulationResults, userInfo, darkMode]);


  const finalValue = simulationResults[simulationResults.length - 1]?.totalValue || 0;
  const achievement = Math.min((finalValue / simulationSettings.targetAmount) * 100, 100);
  const totalTaxSaved = simulationResults[simulationResults.length - 1]?.taxSaved || 0;
  const futureAge = (userInfo?.age ? Number(userInfo.age) : 25) + simulationSettings.years;
  const futureBenchmark = calculateBenchmark(futureAge);

  return (
          <div className="space-y-3 animate-fadeIn">


            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide flex items-center gap-2`}>
                <Zap size={16} style={{ color: theme.accent }} />
                投資スタイル
              </h2>
              
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(riskProfiles).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => applyRiskProfile(key)}
                    className={`p-3 rounded-lg transition-all duration-200 hover-scale ${
                      simulationSettings.riskProfile === key ? 'ring-2 scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: simulationSettings.riskProfile === key 
                        ? (darkMode ? '#262626' : '#f5f5f5')
                        : (darkMode ? '#171717' : '#fafafa'),
                      ringColor: theme.accent
                    }}
                  >
                    <div className="text-2xl mb-1">{profile.icon}</div>
                    <div className={`text-xs font-semibold ${theme.text}`}>{profile.label}</div>
                    <div className={`text-xs ${theme.textSecondary} mt-1`}>{profile.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full ${theme.cardGlass} rounded-xl p-4 flex items-center justify-between hover-scale transition-all`}
            >
              <div className="text-left">
                <p className={`text-sm font-semibold ${theme.text}`}>積立・投資目標の設定</p>
                <p className={`text-xs ${theme.textSecondary} mt-0.5`}>目標金額・運用期間・利回りなど</p>
              </div>
              <span className={`text-lg ${theme.textSecondary}`}>›</span>
            </button>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>Life Events</h2>
                <button
                  onClick={() => {
                    setEditingLifeEvent(null);
                    setShowLifeEventModal(true);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  + 追加
                </button>
              </div>

              {lifeEvents.length === 0 ? (
                <p className={`${theme.textSecondary} text-center py-3 text-sm`}>イベントを追加</p>
              ) : (
                <div className="space-y-2">
                  {lifeEvents.sort((a, b) => a.date.localeCompare(b.date)).map((event, idx) => (
                    <div key={event.id} className={`flex items-center justify-between p-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg animate-fadeIn`} style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">{event.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${theme.text}`}>{event.name}</p>
                          <p className={`text-xs ${theme.textSecondary} tabular-nums`}>{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tabular-nums" style={{ color: theme.red }}>
                          ¥{event.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => {
                            setEditingLifeEvent(event);
                            setShowLifeEventModal(true);
                          }}
                          className="text-blue-500 transition-transform duration-200 hover:scale-110"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteLifeEvent(event.id)}
                          className="text-red-500 transition-transform duration-200 hover:scale-110"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide`}>
                  {simulationSettings.years}年後の予測
                </h2>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Share2 size={12} />
                  シェア
                </button>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} rounded-xl p-4 mb-3`}>
                <p className={`text-xs ${theme.textSecondary} mb-1 font-medium uppercase tracking-wide`}>予想資産額</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: theme.green }}>
                  ¥{finalValue.toLocaleString()}
                </p>
                <div className={`w-full ${darkMode ? 'bg-neutral-700' : 'bg-neutral-200'} rounded-full h-2 my-2 overflow-hidden`}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${achievement}%`,
                      backgroundColor: theme.green
                    }}
                  />
                </div>
                <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                  目標達成率: {achievement.toFixed(1)}%
                </p>

                {simulationSettings.useNisa && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${darkMode ? '#262626' : '#d1fae5'}` }}>
                    <p className="text-xs font-semibold tabular-nums" style={{ color: theme.green }}>
                      💰 NISA節税効果: 約¥{totalTaxSaved.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {achievement >= 100 ? (
                <div className={`${darkMode ? 'bg-neutral-800' : 'bg-green-50'} border-2 rounded-xl p-3 text-center mb-3 animate-pulse-once`} style={{ borderColor: theme.green }}>
                  <p className="text-xl mb-1">🎉</p>
                  <p className="text-sm font-semibold" style={{ color: theme.green }}>目標達成可能</p>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-neutral-800' : 'bg-orange-50'} border-2 rounded-xl p-3 mb-3`} style={{ borderColor: theme.orange }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.orange }}>💡 追加投資が必要</p>
                  <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-orange-700'}`}>
                    月々約<span className="font-bold tabular-nums"> ¥{(Math.max(0, Math.ceil((simulationSettings.targetAmount - finalValue) / (simulationSettings.years * 12) / 1000) * 1000)).toLocaleString()}</span>円
                  </p>
                </div>
              )}

              <div className="mb-4">
                {!simulationSettings.showMonteCarloSimulation && (
                  <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3 mb-3`}>
                    <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>
                      {simulationSettings.years}年後の資産構成
                    </h3>
                    <div className="flex gap-2 mb-2">
                      {(() => {
                        const lastResult = simulationResults[simulationResults.length - 1];
                        const total = lastResult?.totalValue || 1;
                        const savingsPercent = ((lastResult?.savings || 0) / total * 100).toFixed(1);
                        const investPercent = ((lastResult?.regularInvestment || 0) / total * 100).toFixed(1);
                        const nisaPercent = ((lastResult?.nisaInvestment || 0) / total * 100).toFixed(1);
                        const dryPowderPercent = ((lastResult?.dryPowder || 0) / total * 100).toFixed(1);
                        
                        return (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>貯金</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: '#3b82f6' }}>
                                {savingsPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.savings || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#a855f7' }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>投資</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: '#a855f7' }}>
                                {investPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.regularInvestment || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                            {simulationSettings.useNisa && (
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.green }}></div>
                                  <span className={`text-xs ${theme.textSecondary}`}>NISA</span>
                                </div>
                                <p className="text-sm font-bold tabular-nums" style={{ color: theme.green }}>
                                  {nisaPercent}%
                                </p>
                                <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                  ¥{((lastResult?.nisaInvestment || 0) / 10000).toFixed(0)}万
                                </p>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.accent }}></div>
                                <span className={`text-xs ${theme.textSecondary}`}>待機</span>
                              </div>
                              <p className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>
                                {dryPowderPercent}%
                              </p>
                              <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                                ¥{((lastResult?.dryPowder || 0) / 10000).toFixed(0)}万
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden flex">
                      {(() => {
                        const lastResult = simulationResults[simulationResults.length - 1];
                        const total = lastResult?.totalValue || 1;
                        const savingsPercent = ((lastResult?.savings || 0) / total * 100);
                        const investPercent = ((lastResult?.regularInvestment || 0) / total * 100);
                        const nisaPercent = ((lastResult?.nisaInvestment || 0) / total * 100);
                        const dryPowderPercent = ((lastResult?.dryPowder || 0) / total * 100);
                        
                        return (
                          <>
                            <div style={{ width: `${savingsPercent}%`, backgroundColor: '#3b82f6' }}></div>
                            <div style={{ width: `${investPercent}%`, backgroundColor: '#a855f7' }}></div>
                            {simulationSettings.useNisa && (
                              <div style={{ width: `${nisaPercent}%`, backgroundColor: theme.green }}></div>
                            )}
                            <div style={{ width: `${dryPowderPercent}%`, backgroundColor: theme.accent }}></div>
                          </>
                        );
                      })()}
                    </div>
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
                      <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip 
                        formatter={(value) => `¥${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}
                      />
                      <Area type="monotone" dataKey="最大" stroke="none" fill="none" />
                      <Area type="monotone" dataKey="範囲上限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                      <Area type="monotone" dataKey="範囲下限" stroke="none" fill={theme.accent} fillOpacity={0.2} />
                      <Line type="monotone" dataKey="平均" stroke={theme.accent} strokeWidth={3} dot={false} />
                    </AreaChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorNisa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.green} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={theme.green} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorDryPowder" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.accent} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={theme.accent} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                      <XAxis dataKey="年" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} />
                      <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px', fontWeight: 500 }} tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 500 }} />
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
          </div>

          {/* -- 複数シナリオ�-較 -- */}
          {scenarioResults && (
            <div className={`${theme.cardGlass} rounded-xl p-4`}>
              <h2 className={`text-sm font-semibold ${theme.text} mb-1 uppercase tracking-wide`}>シナリオ比較</h2>
              <p className={`text-xs ${theme.textSecondary} mb-3`}>積立額を増やした場合の {simulationSettings.years}年後の差</p>

              {/* 最終値の�-較バー */}
              <div className="space-y-3 mb-4">
                {scenarioResults.map((s) => {
                  const val = s.results[s.results.length - 1]?.totalValue || 0;
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
                      <div className={`w-full rounded-full overflow-hidden`} style={{ height: '8px', backgroundColor: darkMode ? '#2a2a2a' : '#f3f4f6' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(val / maxVal) * 100}%`, backgroundColor: s.color, opacity: 0.85 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 差額ハイライト */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {scenarioResults.slice(1).map((s) => {
                  const diff = (s.results[s.results.length-1]?.totalValue || 0) - (scenarioResults[0].results[scenarioResults[0].results.length-1]?.totalValue || 0);
                  return (
                    <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                      <p className={`text-xs ${theme.textSecondary} mb-0.5`}>{s.label}にした場合</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: s.color }}>+¥{diff.toLocaleString()}</p>
                      <p className={`text-xs ${theme.textSecondary}`}>の増加</p>
                    </div>
                  );
                })}
              </div>

              {/* 折れ線グラフ */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scenarioResults[0].results.map((r, i) => ({
                  year: r.year,
                  ...Object.fromEntries(scenarioResults.map(s => [s.label, s.results[i]?.totalValue || 0]))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                  <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
                  <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
                  <Tooltip formatter={(v) => `¥${v.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {scenarioResults.map(s => (
                    <Line key={s.label} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={s.label === '現状' ? 2 : 2.5} dot={false} strokeDasharray={s.label === '現状' ? '4 2' : undefined} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* -- 取り崩しシミュレーション -- */}
          {simulationSettings.useWithdrawal && finalValue > 0 && (() => {
            const wd = calculateWithdrawalSimulation(finalValue, {
              monthlyWithdrawal: simulationSettings.withdrawalMonthly,
              returnRate: simulationSettings.withdrawalReturnRate,
              inflationRate: simulationSettings.withdrawalInflationRate,
              years: simulationSettings.withdrawalYears,
            });
            const isSustainable = wd.depletedYear === null;
            return (
              <div className={`${theme.cardGlass} rounded-xl p-4`}>
                <h2 className={`text-sm font-semibold ${theme.text} mb-3 uppercase tracking-wide flex items-center gap-2`}>
                  <span>📉</span> 取り崩しフェーズ予測
                </h2>
                <div className={`rounded-xl p-4 mb-3 ${isSustainable ? (darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50') : (darkMode ? 'bg-red-950/40' : 'bg-red-50')}`}>
                  <p className={`text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    月々 ¥{simulationSettings.withdrawalMonthly.toLocaleString()} 取り崩した場合
                  </p>
                  {isSustainable ? (
                    <>
                      <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{simulationSettings.withdrawalYears}年間 持続可能 ✅</p>
                      <p className={`text-xs mt-1 ${theme.textSecondary}`}>{simulationSettings.withdrawalYears}年後の残高: ¥{wd.finalValue.toLocaleString()}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{wd.depletedYear}年目で枯渇 ⚠️</p>
                      <p className={`text-xs mt-1 ${theme.textSecondary}`}>取り崩し額を減らすか、積立額を増やすことを検討してください</p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: '取り崩し開始資産', value: `¥${finalValue.toLocaleString()}` },
                    { label: '累計取り崩し額', value: `¥${(wd.results[wd.results.length-1]?.cumulativeWithdrawn ?? 0).toLocaleString()}` },
                    { label: '想定インフレ率', value: `${simulationSettings.withdrawalInflationRate}%/年` },
                    { label: '最終月取り崩し額', value: `¥${(wd.results[wd.results.length-1]?.monthlyWithdrawal ?? 0).toLocaleString()}` },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                      <p className={`text-xs ${theme.textSecondary} mb-0.5`}>{s.label}</p>
                      <p className={`text-sm font-bold tabular-nums ${theme.text}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <h3 className={`text-xs font-semibold ${theme.text} mb-2 uppercase tracking-wide`}>残高推移（名目 vs 実質）</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={wd.results}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.accent} stopOpacity={0.4}/><stop offset="95%" stopColor={theme.accent} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                    <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
                    <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
                    <Tooltip formatter={(v) => `¥${v.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="balance" name="残高（名目）" stroke="#ef4444" fill="url(#colorBalance)" />
                    <Area type="monotone" dataKey="realValue" name="残高（実質）" stroke={theme.accent} fill="url(#colorReal)" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* -- 持ち家 vs 賃貸 �-較 -- */}
          <div className={`${theme.cardGlass} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className={`text-sm font-semibold ${theme.text} uppercase tracking-wide flex items-center gap-2`}>
                  <Home size={14} /> 持ち家 vs 賃貸
                </h2>
                {!housingComparison && (
                  <p className={`text-xs ${theme.textSecondary} mt-0.5`}>条件を設定してシミュレーション</p>
                )}
              </div>
              <button
                onClick={() => setShowHousingModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#3b82f6' }}
              >
                {housingComparison ? '設定を変更' : '設定する'}
              </button>
            </div>

            {!housingComparison && (
              <div className={`rounded-xl p-6 text-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                <p className="text-3xl mb-2">🏠</p>
                <p className={`text-sm font-semibold ${theme.text} mb-1`}>購入 vs 賃貸+投資の比較</p>
                <p className={`text-xs ${theme.textSecondary}`}>
                  物件価格・ローン条件・家賃を入力すると<br />どちらが有利かを純資産で比較します
                </p>
              </div>
            )}

            {housingComparison && (() => {
              const { buyScenarios, rentScenario, summary } = housingComparison;
              const refBuy = buyScenarios.find(s => s.key === 'fixed' || s.key === 'neutral') || buyScenarios[0];
              const hp = housingParams;

              // グラフデータ生成
              const chartData = Array.from({ length: hp.compareYears }, (_, i) => {
                const row = { year: i + 1 };
                buyScenarios.forEach(s => {
                  row[s.label] = s.yearlyData[i]?.netAssets || 0;
                });
                row['賃貸＋投資'] = rentScenario.yearlyData[i]?.netAssets || 0;
                return row;
              });

              const allColors = [...buyScenarios.map(s => s.color), '#a78bfa'];
              const allLabels = [...buyScenarios.map(s => s.label), '賃貸＋投資'];

              return (
                <div className="space-y-3">
                  {/* 勝�-�バナー */}
                  <div className={`rounded-xl p-4 ${summary.winner === 'buy'
                    ? (darkMode ? 'bg-blue-950/40' : 'bg-blue-50')
                    : (darkMode ? 'bg-purple-950/40' : 'bg-purple-50')}`}>
                    <p className={`text-xs font-medium mb-1 ${theme.textSecondary}`}>{hp.compareYears}年後の純資産比較</p>
                    <p className="text-xl font-bold" style={{ color: summary.winner === 'buy' ? '#3b82f6' : '#a78bfa' }}>
                      {summary.winner === 'buy' ? '🏠 購入が有利' : '🔑 賃貸＋投資が有利'}
                      　差額 ¥{summary.diff.toLocaleString()}
                    </p>
                    {summary.crossoverYear && (
                      <p className={`text-xs mt-1 ${theme.textSecondary}`}>
                        {summary.crossoverYear}年目に逆転
                      </p>
                    )}
                  </div>

                  {/* 最終純資産の�-較 */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '🏠 購入', value: summary.buyFinal, color: '#3b82f6',
                        lines: [
                          `金融資産 ¥${(refBuy.yearlyData[hp.compareYears-1]?.financialAssets / 10000).toFixed(0)}万`,
                          `不動産  ¥${(refBuy.finalProperty / 10000).toFixed(0)}万`,
                          `残債   -¥${(refBuy.finalLoan / 10000).toFixed(0)}万`,
                        ]},
                      { label: '🔑 賃貸＋投資', value: summary.rentFinal, color: '#a78bfa',
                        lines: [
                          `金融資産 ¥${(rentScenario.finalNetAssets / 10000).toFixed(0)}万`,
                          `総家賃 -¥${(rentScenario.totalRentPaid / 10000).toFixed(0)}万`,
                          `（参考）`,
                        ]},
                    ].map(s => (
                      <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${theme.textSecondary}`}>{s.label}</p>
                        <p className="text-base font-bold tabular-nums mb-2" style={{ color: s.color }}>¥{s.value.toLocaleString()}</p>
                        {s.lines.map(line => (
                          <p key={line} className={`text-xs tabular-nums ${theme.textSecondary}`}>{line}</p>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 純資�-�推移グラフ */}
                  <h3 className={`text-xs font-semibold ${theme.text} uppercase tracking-wide`}>純資産推移</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#262626' : '#f5f5f5'} />
                      <XAxis dataKey="year" stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `${v}年`} />
                      <YAxis stroke={darkMode ? '#737373' : '#a3a3a3'} style={{ fontSize: '10px' }} tickFormatter={v => `¥${(v/10000).toFixed(0)}万`} />
                      <Tooltip formatter={(v, name) => [`¥${Number(v).toLocaleString()}`, name]} contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', border: `1px solid ${darkMode ? '#262626' : '#e5e5e5'}`, borderRadius: '8px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {summary.crossoverYear && (
                        <ReferenceLine x={summary.crossoverYear} stroke="#f59e0b" strokeDasharray="4 2"
                          label={{ value: `${summary.crossoverYear}年目逆転`, position: 'top', fontSize: 9, fill: '#f59e0b' }} />
                      )}
                      {allLabels.map((label, i) => (
                        <Line key={label} type="monotone" dataKey={label} stroke={allColors[i]} strokeWidth={label === '賃貸＋投資' ? 2.5 : 2}
                          dot={false} strokeDasharray={label === '賃貸＋投資' ? '5 3' : undefined} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* ローン控除・�-済詳細 */}
                  <div className={`rounded-xl p-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-semibold ${theme.text} mb-2`}>住宅ローン詳細</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        ['総返済額',           `¥${refBuy.totalRepayment.toLocaleString()}`],
                        ['うち利息',           `¥${refBuy.totalInterest.toLocaleString()}`],
                        ['ローン控除（累計）',  `¥${refBuy.totalTaxCredit.toLocaleString()}`],
                        ['実質総コスト',       `¥${(refBuy.totalRepayment - refBuy.totalTaxCredit).toLocaleString()}`],
                        ['完済予定',           refBuy.finalLoan === 0
                          ? `${new Date().getFullYear() + hp.loanMonths / 12}年頃`
                          : `比較期間後も継続`],
                        ['控除適用期間',       `最大13年（年収2,000万以下）`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className={`text-xs ${theme.textSecondary}`}>{k}</span>
                          <span className={`text-xs font-bold tabular-nums ${theme.text}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 変動金利の場合：シナリオ別最終�-� */}
                  {hp.rateType === 'variable' && buyScenarios.length > 1 && (
                    <div className={`rounded-xl p-3 ${darkMode ? 'bg-yellow-950/30' : 'bg-yellow-50'}`}>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#d97706' }}>⚡ 変動金利シナリオ別の純資産</p>
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

          {/* -- 住宅比較モー�-ル -- */}
          {showHousingModal && (
            <HousingComparisonModal
              theme={theme} darkMode={darkMode}
              housingParams={housingParams}
              setHousingParams={setHousingParams}
              setShowHousingModal={setShowHousingModal}
            />
          )}

          {/* -- シェア画像プレビューモー�-ル -- */}
          {shareImg && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShareImg(null)}
            >
              <div
                className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl`}
                style={{ backgroundColor: darkMode ? '#1c1c1e' : '#ffffff' }}
                onClick={e => e.stopPropagation()}
              >
                {/* ヘッ�-ー */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${darkMode ? '#2c2c2e' : '#e5e7eb'}` }}>
                  <span className={`text-sm font-semibold ${theme.text}`}>シェア画像</span>
                  <button onClick={() => setShareImg(null)} className={theme.textSecondary}>
                    <X size={18} />
                  </button>
                </div>

                {/* �-�像プレビュー */}
                <div className="p-4">
                  <img src={shareImg} alt="シェア画像" className="w-full rounded-xl" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />
                </div>

                {/* ボタン */}
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = shareImg;
                      a.download = `money-planner-simulation-${new Date().toISOString().slice(0,10)}.png`;
                      a.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: theme.accent }}
                  >
                    <Download size={14} />
                    保存する
                  </button>
                  {navigator.share && (
                    <button
                      onClick={() => {
                        fetch(shareImg)
                          .then(r => r.blob())
                          .then(blob => {
                            const file = new File([blob], 'simulation.png', { type: 'image/png' });
                            navigator.share({ files: [file], title: 'Money Planner', text: `${simulationSettings.years}年後の資産シミュレーション結果` });
                          });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                      style={{ backgroundColor: darkMode ? '#2c2c2e' : '#f3f4f6', color: darkMode ? '#f9fafb' : '#111827' }}
                    >
                      <Share2 size={14} />
                      共有する
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

  );
}
