import React from 'react';

export default function ClosingCheckModal(props) {
  const { theme, darkMode, showClosingCheckModal, setShowClosingCheckModal, dismissedClosingAlerts, setDismissedClosingAlerts, transactions, setTransactions, creditCards } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme.text}`}>💳 引き落とし額の確認</h2>
              <button onClick={() => setShowClosingCheckModal(null)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>
            <div className={`rounded-lg p-4 mb-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
              <p className={`text-xs ${theme.textSecondary} mb-1`}>{showClosingCheckModal.card.name}</p>
              <p className={`text-xs ${theme.textSecondary} mb-3`}>引き落とし日: {showClosingCheckModal.settleDateStr}</p>
              <p className={`text-sm ${theme.textSecondary} mb-1`}>このアプリの記録上の合計</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: '#6366f1' }}>¥{showClosingCheckModal.total.toLocaleString()}</p>
            </div>
            <p className={`text-sm ${theme.text} mb-2`}>実際のカード請求額と合っていますか？</p>
            <p className={`text-xs ${theme.textSecondary} mb-4`}>違う場合は差額を「未記録の支出」として追加できます。</p>
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>実際の請求額（カードアプリ等で確認）</label>
                <input type="text" inputMode="numeric" id="actual-amount"
                  placeholder={String(showClosingCheckModal.total)}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
              </div>
              <button onClick={() => {
                const actual = Number(document.getElementById('actual-amount').value.replace(new RegExp('[^0-9]', 'g'), ''));
                if (!actual) {
                  setDismissedClosingAlerts(prev => ({ ...prev, [showClosingCheckModal.alertKey]: true }));
                  setShowClosingCheckModal(null);
                  return;
                }
                const diff = actual - showClosingCheckModal.total;
                if (Math.abs(diff) > 0) {
                  const settleTx = {
                    id: Date.now(),
                    date: showClosingCheckModal.settleDateStr,
                    category: 'クレジット引き落とし（' + showClosingCheckModal.card.name + '）',
                    amount: -Math.abs(actual),
                    type: 'expense',
                    paymentMethod: 'cash',
                    settled: new Date(showClosingCheckModal.settleDateStr) <= new Date(),
                    isSettlement: true,
                    parentTransactionId: null,
                    cardId: String(showClosingCheckModal.card.id),
                    memo: '請求額確認で修正（差額 ¥' + Math.abs(diff).toLocaleString() + (diff > 0 ? ' 未記録あり' : ' 過剰記録') + '）'
                  };
                  const existingSettlements = transactions.filter(t =>
                    t.isSettlement && String(t.cardId) === String(showClosingCheckModal.card.id) &&
                    t.date === showClosingCheckModal.settleDateStr
                  );
                  setTransactions(prev => [
                    ...prev.filter(t => !(t.isSettlement && String(t.cardId) === String(showClosingCheckModal.card.id) && t.date === showClosingCheckModal.settleDateStr)),
                    settleTx
                  ]);
                  alert((diff > 0 ? '差額 ¥' + diff.toLocaleString() + ' の未記録支出が見つかりました。引き落とし予定を実際の金額に更新しました。' : '記録が実際より多い状態でした。引き落とし予定を更新しました。'));
                }
                setDismissedClosingAlerts(prev => ({ ...prev, [showClosingCheckModal.alertKey]: true }));
                setShowClosingCheckModal(null);
              }}
                className="w-full py-3 rounded-lg font-bold text-white" style={{ backgroundColor: '#6366f1' }}>
                確認完了
              </button>
              <button onClick={() => {
                setDismissedClosingAlerts(prev => ({ ...prev, [showClosingCheckModal.alertKey]: true }));
                setShowClosingCheckModal(null);
              }} className={`w-full py-3 rounded-lg font-semibold text-sm ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                スキップ
              </button>
            </div>
          </div>
        </div>

  );
}
