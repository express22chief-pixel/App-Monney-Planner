/**
 * MonthReviewBanner
 * 月が変わったとき自動表示される「先月を振り返る」バナー。
 * 「月締め」という言葉を使わず、自然な文脈で収支確定に誘導する。
 */
import React, { useMemo } from 'react';

function formatYM(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
}

export default function MonthReviewBanner({
  theme, darkMode,
  monthReviewTarget,
  setShowMonthReview,
  openCloseMonthModal,
  calculateMonthlyBalance,
  monthlyHistory,
}) {
  if (!monthReviewTarget) return null;

  const mb = calculateMonthlyBalance(monthReviewTarget);
  const isSurplus = mb.plBalance >= 0;
  const fmtMan = (v) => v >= 10000
    ? `¥${Math.round(Math.abs(v) / 10000 * 10) / 10}万`
    : `¥${Math.abs(v).toLocaleString()}`;

  const txt    = theme.textHex   || (darkMode ? '#f0f0f0' : '#0a0a0a');
  const sub    = theme.subHex    || (darkMode ? '#888'    : '#666');
  const bdr    = theme.borderHex || (darkMode ? '#1f1f1f' : '#e8e8e6');
  const card   = theme.cardHex   || (darkMode ? '#111'    : '#fff');
  const accent = theme.accent    || '#00e5ff';
  const green  = theme.green     || '#00e676';
  const red    = theme.red       || '#ff3d57';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 45,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      padding: '0 0 72px', // ボトムナビの上
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: card,
        borderRadius: '20px 20px 0 0',
        border: `1px solid ${bdr}`,
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* ヘッダー */}
        <div style={{
          padding: '20px 20px 14px',
          borderBottom: `1px solid ${bdr}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 4, letterSpacing: '0.04em' }}>
              📅 {formatYM(monthReviewTarget)}のまとめ
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: txt }}>
              先月の収支を振り返りましょう
            </p>
            <p style={{ fontSize: 12, color: sub, marginTop: 4, lineHeight: 1.6 }}>
              貯金・投資への振り分けを確認して<br/>今月のスタートを切りましょう
            </p>
          </div>
          <button
            onClick={() => setShowMonthReview(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 18, padding: '0 0 0 12px', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* 先月サマリー */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: '収入', value: mb.plIncome,  color: green },
              { label: '支出', value: mb.plExpense, color: red },
              { label: '収支', value: mb.plBalance, color: isSurplus ? green : red },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                textAlign: 'center', padding: '10px 4px',
                borderRadius: 10, background: darkMode ? '#181818' : '#f5f5f5',
                border: `1px solid ${bdr}`,
              }}>
                <p style={{ fontSize: 10, color: sub, marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                  {label === '収支' && isSurplus ? '+' : ''}{fmtMan(value)}
                </p>
              </div>
            ))}
          </div>

          {/* メッセージ */}
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14,
            background: isSurplus
              ? (darkMode ? 'rgba(0,230,118,0.07)' : 'rgba(0,200,83,0.06)')
              : (darkMode ? 'rgba(255,61,87,0.07)'  : 'rgba(229,57,53,0.06)'),
            border: `1px solid ${isSurplus
              ? (darkMode ? 'rgba(0,230,118,0.2)' : 'rgba(0,200,83,0.15)')
              : (darkMode ? 'rgba(255,61,87,0.2)'  : 'rgba(229,57,53,0.15)')}`,
          }}>
            {isSurplus ? (
              <p style={{ fontSize: 12, color: green, lineHeight: 1.6 }}>
                <strong>{fmtMan(mb.plBalance)}</strong> の黒字です 🎉<br/>
                <span style={{ color: sub, fontSize: 11 }}>貯金・投資への振り分けを確定しましょう</span>
              </p>
            ) : (
              <p style={{ fontSize: 12, color: red, lineHeight: 1.6 }}>
                <strong>{fmtMan(Math.abs(mb.plBalance))}</strong> の赤字でした<br/>
                <span style={{ color: sub, fontSize: 11 }}>内容を確認して今月に活かしましょう</span>
              </p>
            )}
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowMonthReview(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `1px solid ${bdr}`, background: 'none',
                color: sub, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >あとで</button>
            <button
              onClick={() => {
                setShowMonthReview(false);
                openCloseMonthModal(monthReviewTarget);
              }}
              style={{
                flex: 2, padding: '12px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${accent}, #0072ff)`,
                color: '#fff', fontSize: 13, fontWeight: 800,
                boxShadow: `0 4px 14px ${accent}40`,
              }}
            >振り分けを確定する →</button>
          </div>
        </div>

      </div>
    </div>
  );
}
