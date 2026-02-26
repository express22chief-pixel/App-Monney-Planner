import React from 'react';

export default function CardModal(props) {
  const { theme, darkMode, editingCard, setCreditCards, setShowCardModal } = props;

  return (
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme.text}`}>{editingCard ? 'カードを編集' : 'カードを追加'}</h2>
              <button onClick={() => setShowCardModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>カード名</label>
                <input type="text" placeholder="例: 楽天カード"
                  defaultValue={editingCard ? editingCard.name : ''}
                  id="card-name"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>締め日</label>
                  <select id="card-closing"
                    defaultValue={editingCard ? editingCard.closingDay : 15}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    {[5,10,15,20,25].map(d => <option key={d} value={d}>{d}日</option>)}<option value={31}>末日</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし月</label>
                  <select id="card-payment-month"
                    defaultValue={editingCard ? editingCard.paymentMonth : 1}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    <option value={1}>翌月</option>
                    <option value={2}>翌々月</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし日</label>
                <div className="flex items-center gap-2">
                  <input type="text" inputMode="numeric" id="card-payment-day"
                    defaultValue={editingCard ? editingCard.paymentDay : ''}
                    placeholder="例: 27"
                    maxLength={2}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <span className={`text-sm ${theme.textSecondary} whitespace-nowrap`}>日</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>引き落とし日が土日祝の場合</label>
                <select id="card-non-business"
                  defaultValue={editingCard ? (editingCard.nonBusinessDay || 'next') : 'next'}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                  <option value="next">翌営業日に振り替え（多数派）</option>
                  <option value="prev">前営業日に振り替え</option>
                  <option value="none">振り替えなし（口座に余裕を持たせる）</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const name = document.getElementById('card-name').value.trim();
                  const closingDay = Number(document.getElementById('card-closing').value);
                  const paymentMonth = Number(document.getElementById('card-payment-month').value);
                  const paymentDay = Number(document.getElementById('card-payment-day').value);
                  const nonBusinessDay = document.getElementById('card-non-business').value;
                  if (!name) { alert('カード名を入力してください'); return; }
                  if (!paymentDay || paymentDay < 1 || paymentDay > 31) { alert('引き落とし日は1〜31の数字を入力してください'); return; }
                  if (editingCard) {
                    setCreditCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, name, closingDay, paymentMonth, paymentDay, nonBusinessDay } : c));
                  } else {
                    setCreditCards(prev => [...prev, { id: Date.now(), name, closingDay, paymentMonth, paymentDay, nonBusinessDay }]);
                  }
                  setShowCardModal(false);
                }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: theme.accent }}>
                {editingCard ? '更新する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}

  );
}
