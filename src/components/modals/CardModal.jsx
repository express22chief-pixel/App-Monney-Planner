/**
 * CardModal.jsx
 * クレジットカード追加・編集モーダル。
 * PayPay連携フラグ（isPayPayLinked）を追加。
 */
import React, { useState } from 'react';

export default function CardModal(props) {
  const { theme, darkMode, editingCard, setCreditCards, setShowCardModal } = props;

  const [isPayPayLinked, setIsPayPayLinked] = useState(
    editingCard ? (editingCard.isPayPayLinked || false) : false
  );

  const handleSave = () => {
    const name          = document.getElementById('card-name').value.trim();
    const closingDay    = Number(document.getElementById('card-closing').value);
    const paymentMonth  = Number(document.getElementById('card-payment-month').value);
    const paymentDay    = Number(document.getElementById('card-payment-day').value);
    const nonBusinessDay = document.getElementById('card-non-business').value;

    if (!name) { alert('カード名を入力してください'); return; }
    if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
      alert('引き落とし日は1〜31の数字を入力してください'); return;
    }

    if (editingCard) {
      setCreditCards(prev => prev.map(c =>
        c.id === editingCard.id
          ? { ...c, name, closingDay, paymentMonth, paymentDay, nonBusinessDay, isPayPayLinked }
          : c
      ));
    } else {
      setCreditCards(prev => [
        ...prev,
        { id: Date.now(), name, closingDay, paymentMonth, paymentDay, nonBusinessDay, isPayPayLinked },
      ]);
    }
    setShowCardModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${theme.text}`}>
            {editingCard ? 'カードを編集' : 'カードを追加'}
          </h2>
          <button onClick={() => setShowCardModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
        </div>

        <div className="space-y-4">
          
          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>カード名</label>
            <input
              type="text"
              placeholder="例: 楽天カード"
              defaultValue={editingCard ? editingCard.name : ''}
              id="card-name"
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
            />
          </div>

          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>締め日</label>
              <select
                id="card-closing"
                defaultValue={editingCard ? editingCard.closingDay : 15}
                className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
              >
                {[5, 10, 15, 20, 25].map(d => <option key={d} value={d}>{d}日</option>)}
                <option value={31}>末日</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし月</label>
              <select
                id="card-payment-month"
                defaultValue={editingCard ? editingCard.paymentMonth : 1}
                className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
              >
                <option value={1}>翌月</option>
                <option value={2}>翌々月</option>
              </select>
            </div>
          </div>

          
          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし日</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                id="card-payment-day"
                defaultValue={editingCard ? editingCard.paymentDay : ''}
                placeholder="例: 27"
                maxLength={2}
                className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
              />
              <span className={`text-sm ${theme.textSecondary} whitespace-nowrap`}>日</span>
            </div>
          </div>

          
          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし日が土日祝の場合</label>
            <select
              id="card-non-business"
              defaultValue={editingCard ? (editingCard.nonBusinessDay || 'next') : 'next'}
              className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}
            >
              <option value="next">翌営業日に振り替え（多数派）</option>
              <option value="prev">前営業日に振り替え</option>
              <option value="none">振り替えなし</option>
            </select>
          </div>

          
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: isPayPayLinked
                ? '#FF4B4B18'
                : (darkMode ? '#1a1a1a' : '#f8fafc'),
              border: `1.5px solid ${isPayPayLinked ? '#FF4B4B55' : (darkMode ? '#2a2a2a' : '#e5e7eb')}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setIsPayPayLinked(v => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔴</span>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: darkMode ? '#f5f5f5' : '#111',
                  }}>
                    PayPay連携カード
                  </div>
                  <div style={{ fontSize: 11, color: darkMode ? '#737373' : '#9ca3af', marginTop: 1 }}>
                    PayPay CSV読み込み時にこのカードを自動適用
                  </div>
                </div>
              </div>
              
              <div style={{
                width: 42, height: 24, borderRadius: 12, position: 'relative',
                backgroundColor: isPayPayLinked ? '#FF4B4B' : (darkMode ? '#404040' : '#d1d5db'),
                transition: 'background-color 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: isPayPayLinked ? 21 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg font-bold text-white"
            style={{ backgroundColor: theme.accent }}
          >
            {editingCard ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
