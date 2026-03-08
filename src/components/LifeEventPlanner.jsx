import React, { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, ChevronUp, Home, Settings2 } from 'lucide-react';

/**
 * ライフイベントプランナー
 * - デフォルトテンプレートがON/OFFで並ぶ
 * - 各カードでタイミング・金額・選択肢をインライン編集
 * - カスタムイベントも追加可能
 */
export default function LifeEventPlanner({
  lifeEvents, setLifeEvents,
  setShowHousingModal, housingParams,
  currentAge, darkMode, theme,
  card, txt, sub, bdr, blue, red, green, amber, fmtMan,
  setShowLifeEventModal, setEditingLifeEvent, deleteLifeEvent,
}) {
  const [expandCustom, setExpandCustom] = useState(false);

  // テンプレートイベントとカスタムイベントを分離
  const templateEvents = lifeEvents.filter(e => e.template);
  const customEvents   = lifeEvents.filter(e => !e.template);

  const updateEvent = (id, patch) => {
    setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const nowYear = new Date().getFullYear();

  // 年齢スライダー → date文字列に変換
  const ageToDate = (age) => {
    const y = nowYear + Math.max(0, age - currentAge);
    return `${y}-01`;
  };
  const dateToAge = (dateStr) => {
    if (!dateStr) return currentAge;
    const y = parseInt(dateStr.slice(0, 4));
    return currentAge + (y - nowYear);
  };

  const bg    = darkMode ? '#1c1c1e' : '#fff';
  const bg2   = darkMode ? '#252525' : '#f9fafb';
  const bg3   = darkMode ? '#2a2a2a' : '#f2f2f7';
  const green2 = '#10b981';

  // イベントカテゴリーグループ（表示順）
  const GROUPS = [
    { key: 'life',    label: '人生の節目', ids: ['tpl_marriage', 'tpl_child1', 'tpl_child2'] },
    { key: 'housing', label: '住まい',     ids: ['tpl_housing', 'tpl_reno'] },
    { key: 'money',   label: 'お金・モノ', ids: ['tpl_car1', 'tpl_car2', 'tpl_edu1', 'tpl_travel', 'tpl_care'] },
  ];

  const EventCard = ({ ev }) => {
    const [open, setOpen] = useState(false);
    const evAge = dateToAge(ev.date);
    const isHousing = ev.type === 'housing_choice';
    const isBuy = ev.housingChoice === 'buy';
    const accentColor = ev.enabled ? (isHousing ? amber : blue) : sub;

    return (
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1.5px solid ${ev.enabled ? (isHousing ? (darkMode ? '#78350f' : '#fde68a') : (darkMode ? '#1e3a5f' : '#dbeafe')) : bdr}`,
        background: ev.enabled ? bg2 : bg3,
        opacity: ev.enabled ? 1 : 0.65,
        transition: 'all 0.2s',
      }}>
        {/* ── ヘッダー行 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
          onClick={() => ev.enabled && setOpen(v => !v)}>

          {/* ON/OFFトグル */}
          <button
            onClick={(e) => { e.stopPropagation(); updateEvent(ev.id, { enabled: !ev.enabled }); }}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: ev.enabled ? accentColor : (darkMode ? '#444' : '#d1d5db'),
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
            <span style={{
              position: 'absolute', top: 2,
              left: ev.enabled ? 18 : 2,
              width: 16, height: 16, borderRadius: 8,
              background: '#fff', transition: 'left 0.2s', display: 'block',
            }} />
          </button>

          <span style={{ fontSize: 18, lineHeight: 1 }}>{ev.icon}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: txt, margin: 0 }}>{ev.name}</p>
            {ev.enabled && (
              <p style={{ fontSize: 10, color: sub, margin: 0, marginTop: 1 }}>
                {isHousing
                  ? (isBuy ? `${evAge}歳で購入` : `賃貸継続`)
                  : `${evAge}歳 · ${ev.amount > 0 ? fmtMan(ev.amount) : '無料'}`
                }
              </p>
            )}
          </div>

          {/* 金額バッジ */}
          {ev.enabled && !isHousing && ev.amount > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: red, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              -{fmtMan(ev.amount)}
            </span>
          )}
          {ev.enabled && isHousing && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: isBuy ? (darkMode ? '#78350f' : '#fef3c7') : (darkMode ? '#1a2e1a' : '#f0fdf4'),
              color: isBuy ? amber : green2,
            }}>
              {isBuy ? '購入' : '賃貸'}
            </span>
          )}

          {ev.enabled && (open
            ? <ChevronUp size={13} color={sub} />
            : <ChevronDown size={13} color={sub} />
          )}
        </div>

        {/* ── 展開パネル ── */}
        {open && ev.enabled && (
          <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${bdr}`, paddingTop: 12 }}>

            {/* 住居：選択肢ボタン */}
            {isHousing && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: sub, marginBottom: 6, fontWeight: 600 }}>住居スタイルを選択</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ev.options.map(opt => (
                    <button key={opt.key}
                      onClick={() => updateEvent(ev.id, { housingChoice: opt.key })}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: ev.housingChoice === opt.key
                          ? (opt.key === 'buy' ? amber : green2)
                          : bg3,
                        color: ev.housingChoice === opt.key ? '#fff' : sub,
                        fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                      }}>
                      <div>{opt.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.85 }}>{opt.hint}</div>
                    </button>
                  ))}
                </div>
                {isBuy && (
                  <button onClick={() => setShowHousingModal(true)} style={{
                    width: '100%', marginTop: 8, padding: '9px 12px',
                    background: darkMode ? '#0d1a2b' : '#eff6ff',
                    border: `1px solid ${darkMode ? '#1e3a5f' : '#bfdbfe'}`,
                    borderRadius: 10, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Home size={12} color={blue} />
                      <span style={{ fontSize: 11, color: blue, fontWeight: 600 }}>
                        {housingParams ? `購入設定済み（${fmtMan(housingParams.propertyPrice ?? 0)}）` : '住宅購入の詳細を設定する →'}
                      </span>
                    </div>
                    <ChevronRight size={12} color={blue} />
                  </button>
                )}
              </div>
            )}

            {/* 発生年齢スライダー */}
            {(!isHousing || isBuy) && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: sub }}>発生年齢</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                    {evAge}歳
                    {evAge > currentAge ? ` (あと${evAge - currentAge}年)` : ' (今年)'}
                  </span>
                </div>
                <input type="range"
                  min={currentAge + 1} max={currentAge + 40} step={1}
                  value={evAge}
                  onChange={e => updateEvent(ev.id, { date: ageToDate(Number(e.target.value)), age: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: accentColor }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: sub, marginTop: 1 }}>
                  <span>{currentAge + 1}歳</span><span>{currentAge + 40}歳</span>
                </div>
              </div>
            )}

            {/* 金額スライダー（住居購入以外） */}
            {!isHousing && ev.amountRange && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: sub }}>予算</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: red, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtMan(ev.amount)}
                  </span>
                </div>
                <input type="range"
                  min={ev.amountRange[0]} max={ev.amountRange[1]} step={ev.amountStep || 100000}
                  value={ev.amount}
                  onChange={e => updateEvent(ev.id, { amount: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: red }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: sub, marginTop: 1 }}>
                  <span>{fmtMan(ev.amountRange[0])}</span><span>{fmtMan(ev.amountRange[1])}</span>
                </div>
              </div>
            )}

            {/* ヒント */}
            {ev.hint && (
              <p style={{ fontSize: 10, color: sub, background: bg3, padding: '6px 8px', borderRadius: 6, marginTop: 4, lineHeight: 1.5 }}>
                💡 {ev.hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: card, borderRadius: 18, padding: 18 }}>
      {/* ── ヘッダー ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: txt, margin: 0 }}>ライフイベント</p>
          <p style={{ fontSize: 10, color: sub, margin: 0, marginTop: 2 }}>
            ONにしたイベントが資産シミュレーションに反映されます
          </p>
        </div>
        <button onClick={() => { setEditingLifeEvent(null); setShowLifeEventModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px',
            background: blue, border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>
          <Plus size={11} color="#fff" />
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>カスタム</span>
        </button>
      </div>

      {/* ── 総支出サマリー ── */}
      {(() => {
        const activeEvents = lifeEvents.filter(e => e.enabled && e.type !== 'housing_choice' && e.amount > 0);
        const total = activeEvents.reduce((s, e) => s + e.amount, 0);
        if (total === 0) return null;
        return (
          <div style={{
            marginBottom: 14, padding: '10px 14px', borderRadius: 12,
            background: darkMode ? '#200a0a' : '#fef2f2',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: sub }}>
              ライフイベント合計支出（{activeEvents.length}件）
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: red, fontVariantNumeric: 'tabular-nums' }}>
              -{fmtMan(total)}
            </span>
          </div>
        );
      })()}

      {/* ── グループ別テンプレートカード ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GROUPS.map(group => {
          const groupEvents = group.ids.map(id => templateEvents.find(e => e.id === id)).filter(Boolean);
          if (groupEvents.length === 0) return null;
          return (
            <div key={group.key}>
              <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {group.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groupEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── カスタムイベント ── */}
      {customEvents.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setExpandCustom(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              カスタムイベント（{customEvents.length}）
            </p>
            {expandCustom ? <ChevronUp size={12} color={sub} /> : <ChevronDown size={12} color={sub} />}
          </button>
          {expandCustom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customEvents.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(ev => {
                const evYear = parseInt(ev.date?.slice(0, 4));
                const evAge  = currentAge + (evYear - new Date().getFullYear());
                return (
                  <div key={ev.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12,
                  }}>
                    <span style={{ fontSize: 18 }}>{ev.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: txt, margin: 0 }}>{ev.name}</p>
                      <p style={{ fontSize: 10, color: sub, margin: 0, marginTop: 1 }}>{ev.date} · {evAge}歳</p>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: red, fontVariantNumeric: 'tabular-nums' }}>
                      -{fmtMan(ev.amount)}
                    </p>
                    <button onClick={() => { setEditingLifeEvent(ev); setShowLifeEventModal(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>✏️</button>
                    <button onClick={() => deleteLifeEvent(ev.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>🗑️</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
