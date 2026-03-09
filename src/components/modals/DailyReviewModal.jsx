import React from 'react';

export default function DailyReviewModal(props) {
  const { theme, darkMode, dailyReviewDate, dailyReviewTxns, setDailyReviewTxns, dailyReviewAddForm, setDailyReviewAddForm, setShowDailyReview, expenseCategories, incomeCategories, creditCards, transactions, setTransactions } = props;

  return (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className={`${theme.cardGlass} rounded-t-3xl w-full max-w-lg animate-slideUp`} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className={`text-base font-bold ${theme.text}`}>📋 昨日の記録を確認</h2>
                <p className={`text-xs ${theme.textSecondary} mt-0.5`}>{dailyReviewDate}（前日）</p>
              </div>
              <button onClick={() => { setShowDailyReview(false); setDailyReviewAddForm(null); }}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-100 text-neutral-500'} text-sm`}>✕</button>
            </div>

            <div className="overflow-y-auto px-5 pb-5 flex-1">
              {dailyReviewTxns.length === 0 ? (
                <div className={`rounded-lg p-4 text-center mb-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <p className="text-2xl mb-2">🤔</p>
                  <p className={`text-sm font-semibold ${theme.text} mb-1`}>前日の取引が登録されていません</p>
                  <p className={`text-xs ${theme.textSecondary}`}>記録漏れがあれば追加しておきましょう</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {dailyReviewTxns.map(t => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${theme.text} truncate`}>{t.category}</p>
                        {t.memo && <p className={`text-xs ${theme.textSecondary} truncate`}>{t.memo}</p>}
                        <p className={`text-xs ${theme.textSecondary}`}>{t.paymentMethod === 'credit' ? '💳' : '💵'} {t.paymentMethod === 'credit' ? 'クレカ' : '現金'}</p>
                      </div>
                      <p className={`text-sm font-bold ml-3 flex-shrink-0 ${t.amount > 0 ? 'text-emerald-400' : (darkMode ? 'text-white' : 'text-neutral-800')}`}>
                        {t.amount > 0 ? '+' : ''}¥{Math.abs(t.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className={`text-right text-xs ${theme.textSecondary}`}>
                    合計 {dailyReviewTxns.filter(t => t.amount < 0).length}件支出 / {dailyReviewTxns.filter(t => t.amount > 0).length}件収入
                  </div>
                </div>
              )}

              {dailyReviewAddForm ? (
                <div className={`rounded-lg p-4 space-y-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} mb-4`}>
                  <p className={`text-xs font-bold ${theme.text}`}>前日分を追加</p>
                  <div className="flex gap-2">
                    {['expense', 'income'].map(tp => (
                      <button key={tp} onClick={() => setDailyReviewAddForm(prev => ({ ...prev, type: tp, category: '' }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${dailyReviewAddForm.type === tp ? 'text-white' : (darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}
                        style={dailyReviewAddForm.type === tp ? { backgroundColor: theme.accent } : {}}>
                        {tp === 'expense' ? '支出' : '収入'}
                      </button>
                    ))}
                  </div>
                  <select value={dailyReviewAddForm.category} onChange={e => setDailyReviewAddForm(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    <option value="">カテゴリを選択</option>
                    {(dailyReviewAddForm.type === 'expense' ? expenseCategories : incomeCategories).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme.textSecondary}`}>¥</span>
                    <input type="text" inputMode="numeric" placeholder="金額" value={dailyReviewAddForm.amount}
                      onChange={e => setDailyReviewAddForm(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9]/g, '') }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  </div>
                  <select value={dailyReviewAddForm.paymentMethod} onChange={e => setDailyReviewAddForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                    <option value="cash">現金</option>
                    <option value="credit">クレジットカード</option>
                  </select>
                  {dailyReviewAddForm.paymentMethod === 'credit' && (
                    <select value={dailyReviewAddForm.cardId || ''} onChange={e => setDailyReviewAddForm(prev => ({ ...prev, cardId: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                      {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <input type="text" placeholder="メモ（任意）" value={dailyReviewAddForm.memo}
                    onChange={e => setDailyReviewAddForm(prev => ({ ...prev, memo: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                  <div className="flex gap-2">
                    <button onClick={() => setDailyReviewAddForm(null)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold ${darkMode ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>キャンセル</button>
                    <button onClick={() => {
                      if (!dailyReviewAddForm.category) { alert('カテゴリを選択してください'); return; }
                      if (!dailyReviewAddForm.amount) { alert('金額を入力してください'); return; }
                      const amt = Number(dailyReviewAddForm.amount);
                      const newTxn = {
                        id: Date.now(),
                        date: dailyReviewDate,
                        category: dailyReviewAddForm.category,
                        amount: dailyReviewAddForm.type === 'expense' ? -amt : amt,
                        type: dailyReviewAddForm.type,
                        paymentMethod: dailyReviewAddForm.paymentMethod,
                        cardId: dailyReviewAddForm.paymentMethod === 'credit' ? (dailyReviewAddForm.cardId || (creditCards[0] && String(creditCards[0].id))) : null,
                        memo: dailyReviewAddForm.memo,
                        settled: dailyReviewAddForm.paymentMethod === 'cash'
                      };
                      setTransactions(prev => [newTxn, ...prev]);
                      setDailyReviewTxns(prev => [...prev, newTxn]);
                      setDailyReviewAddForm(null);
                    }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>追加する</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setDailyReviewAddForm({ amount: '', category: '', type: 'expense', memo: '', paymentMethod: 'cash', cardId: creditCards[0] ? String(creditCards[0].id) : null })}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold border-2 transition-all mb-3 ${darkMode ? 'border-neutral-600 text-neutral-300' : 'border-neutral-300 text-neutral-600'}`}>
                  ＋ 前日分の取引を追加
                </button>
              )}

              <button onClick={() => { setShowDailyReview(false); setDailyReviewAddForm(null); }}
                className="w-full py-3 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: theme.accent }}>
                確認完了
              </button>
            </div>
          </div>
        </div>

  );
}
