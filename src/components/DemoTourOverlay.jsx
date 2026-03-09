import React, { useEffect, useState, useCallback } from 'react';

const SLIDES = [
  {
    id: 'home',
    tab: 'home',
    title: '家計簿タブ',
    body: 'クレカの引き落とし予定が自動で並びます。今月あといくら使えるか、キャッシュフローをリアルタイムで把握できます。',
    accent: '#00e5ff',
    autoSec: 5,
    position: 'bottom',
  },
  {
    id: 'calendar',
    tab: 'calendar',
    title: '履歴タブ',
    body: 'カレンダーで支出・収入・引き落とし予定を一覧できます。日付ごとの収支が色で分かります。',
    accent: '#a855f7',
    autoSec: 5,
    position: 'bottom',
  },
  {
    id: 'assets',
    tab: 'assets',
    title: '資産タブ',
    body: '月締めするたびに貯金・投資が積み上がります。資産の内訳と推移グラフで資産形成の進捗を確認できます。',
    accent: '#10b981',
    autoSec: 5,
    position: 'bottom',
  },
  {
    id: 'simulation',
    tab: 'simulation',
    title: '計画タブ',
    body: '年収・生活費・積立投資を入力すると、65歳時点の純資産が即計算されます。ライフイベントの影響もグラフで確認できます。',
    accent: '#f59e0b',
    autoSec: 6,
    position: 'bottom',
  },
  {
    id: 'finish',
    tab: 'home',
    title: '準備完了です',
    body: 'デモデータで全機能を試せます。気に入ったら「自分のデータで始める」を押してください。',
    accent: '#00e5ff',
    autoSec: null,
    position: 'center',
  },
];

export default function DemoTourOverlay({ setActiveTab, exitDemo, darkMode }) {
  const [idx, setIdx]       = useState(0);
  const [progress, setProgress] = useState(0);

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) return;
    const next = SLIDES[idx + 1];
    setActiveTab(next.tab);
    setIdx(idx + 1);
    setProgress(0);
  }, [idx, isLast, setActiveTab]);

  // タブ遷移（初回 + スライド変化時）
  useEffect(() => {
    setActiveTab(slide.tab);
  }, [slide.tab, setActiveTab]);

  // 自動進行タイマー
  useEffect(() => {
    if (!slide.autoSec || isLast) return;
    setProgress(0);
    const total = slide.autoSec * 1000;
    const tick  = 50;
    let elapsed = 0;
    const iv = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(elapsed / total * 100, 100));
      if (elapsed >= total) {
        clearInterval(iv);
        goNext();
      }
    }, tick);
    return () => clearInterval(iv);
  }, [idx, slide.autoSec, isLast, goNext]);

  const sub  = darkMode ? '#888' : '#666';
  const bg   = darkMode ? 'rgba(14,14,14,0.97)' : 'rgba(255,255,255,0.97)';
  const txt  = darkMode ? '#f5f5f5' : '#111';
  const bdr  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      pointerEvents: 'none',
    }}>
      {/* 薄いオーバーレイ（上下だけ） */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.45) 100%)',
        pointerEvents: 'none',
      }} />

      {/* カード */}
      <div style={{
        position: 'absolute',
        ...(slide.position === 'center'
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 40px)', maxWidth: 380 }
          : { bottom: 96, left: 16, right: 16 }
        ),
        background: bg,
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        border: `1px solid ${bdr}`,
        overflow: 'hidden',
        pointerEvents: 'all',
      }}>
        {/* プログレスバー */}
        <div style={{ height: 3, background: darkMode ? '#1a1a1a' : '#f0f0f0' }}>
          <div style={{
            height: '100%',
            background: slide.accent,
            width: isLast ? '100%' : `${progress}%`,
            transition: 'width 0.05s linear',
            boxShadow: `0 0 8px ${slide.accent}80`,
          }} />
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* ドットインジケーター */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{
                height: 3, borderRadius: 2,
                flex: i === idx ? 2 : 1,
                background: i <= idx ? slide.accent : (darkMode ? '#333' : '#e0e0e0'),
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <p style={{
              fontSize: 14, fontWeight: 800, color: slide.accent,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.01em',
            }}>{slide.title}</p>
            <span style={{ fontSize: 10, color: sub, flexShrink: 0, paddingTop: 2 }}>
              {idx + 1} / {SLIDES.length}
            </span>
          </div>

          <p style={{ fontSize: 13, color: txt, lineHeight: 1.65, marginBottom: 16 }}>
            {slide.body}
          </p>

          {isLast ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => exitDemo()}
                style={{
                  flex: 2, padding: '12px 0', borderRadius: 12,
                  background: slide.accent, border: 'none',
                  color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                }}
              >自分のデータで始める</button>
              <button
                onClick={() => {
                  setActiveTab('home');
                  setIdx(0);
                }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: darkMode ? '#222' : '#f0f0f0', border: 'none',
                  color: sub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >デモを続ける</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={goNext}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12,
                  background: slide.accent, border: 'none',
                  color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                次へ
                {slide.autoSec && (
                  <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>
                    ({Math.ceil(slide.autoSec - progress / 100 * slide.autoSec)}s)
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const last = SLIDES.length - 1;
                  setActiveTab(SLIDES[last].tab);
                  setIdx(last);
                  setProgress(100);
                }}
                style={{
                  padding: '11px 14px', borderRadius: 12,
                  background: 'none', border: `1px solid ${bdr}`,
                  color: sub, fontSize: 11, cursor: 'pointer',
                }}
              >スキップ</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
