import React from 'react';

export default function SetupWizardModal(props) {
  const { theme, darkMode, setupStep, setSetupStep, creditCards, setCreditCards, setupSettlements, setSetupSettlements, setupSettlementDate, setSetupSettlementDate, setShowSetupWizard, setShowTutorial, setTutorialPage, transactions, setTransactions, setShowCardModal, setEditingCard } = props;

  return (
      {showSetupWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp`}>

            {/* ステップインジケーター */}
            <div className="flex gap-2 mb-6">
              {[1,2,3].map(s => (
                <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#2a2a2a' : '#e5e7eb' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: setupStep >= s ? '100%' : '0%', backgroundColor: theme.accent }} />
                </div>
              ))}
            </div>

            {/* STEP 1: カード登録 */}
            {setupStep === 1 && (
              <div>
                <div className="text-4xl mb-3">💳</div>
                <h2 className={`text-xl font-bold ${theme.text} mb-1`}>クレカを登録しよう</h2>
                <p className={`text-sm ${theme.textSecondary} mb-5`}>使っているクレジットカードの締め日・引き落とし日を設定します。あとで変更もできます。</p>
                {creditCards.length === 0 ? (
                  <div className={`rounded-2xl p-4 mb-4 text-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-sm ${theme.textSecondary}`}>まだカードが登録されていません</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {creditCards.map(card => (
                      <div key={card.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{card.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>締め日: {card.closingDay}日 / 翌{card.paymentMonth === 2 ? '々' : ''}月{card.paymentDay}日払い</p>
                        </div>
                        <button onClick={() => { setEditingCard(card); setShowCardModal(true); }} className="text-blue-400 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: darkMode ? '#1e3a5f' : '#dbeafe' }}>編集</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { setEditingCard(null); setShowCardModal(true); }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all mb-4 ${darkMode ? 'border-neutral-600 text-neutral-300' : 'border-neutral-200 text-neutral-600'}`}>
                  ＋ カードを追加
                </button>
                <div className="flex gap-3">
                  <button onClick={() => { setShowSetupWizard(false); setShowTutorial(true); setTutorialPage(0); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                    スキップ
                  </button>
                  <button onClick={() => setSetupStep(2)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>
                    次へ →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: 今月の引き落とし予定 */}
            {setupStep === 2 && (
              <div>
                <div className="text-4xl mb-3">📅</div>
                <h2 className={`text-xl font-bold ${theme.text} mb-1`}>今月の引き落とし予定</h2>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>今月クレカから引き落とされる予定の金額を登録しておきましょう。</p>
                <p className={`text-xs mb-5 px-3 py-2 rounded-xl ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-blue-50 text-blue-600'}`}>💡 先月の使用分が今月◯日に引き落とされる予定など</p>

                {setupSettlements.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {setupSettlements.map((s, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text}`}>{s.cardName}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>{s.date} / ¥{Number(s.amount).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setSetupSettlements(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {creditCards.length > 0 ? (
                  <div className={`rounded-2xl p-4 mb-4 space-y-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} block mb-1`}>カード</label>
                      <select id="setup-card" className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                        {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} block mb-1`}>引き落とし日</label>
                      <div className="flex gap-2">
                        <select value={setupSettlementDate.year} onChange={e => setSetupSettlementDate(p => ({...p, year: Number(e.target.value)}))}
                          className={`flex-1 px-2 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                          {[2025,2026,2027].map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>
                        <select value={setupSettlementDate.month} onChange={e => setSetupSettlementDate(p => ({...p, month: Number(e.target.value)}))}
                          className={`flex-1 px-2 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                          {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m}月</option>)}
                        </select>
                        <select value={setupSettlementDate.day} onChange={e => setSetupSettlementDate(p => ({...p, day: Number(e.target.value)}))}
                          className={`flex-1 px-2 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`}>
                          {Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={d}>{d}日</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} block mb-1`}>金額</label>
                      <input type="text" inputMode="numeric" id="setup-amount" placeholder="例: 45000"
                        className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? 'bg-neutral-700 text-white border border-neutral-600' : 'bg-white border border-neutral-200'} focus:outline-none`} />
                    </div>
                    <button onClick={() => {
                      const cardId = document.getElementById('setup-card').value;
                      const date = `${setupSettlementDate.year}-${String(setupSettlementDate.month).padStart(2,'0')}-${String(setupSettlementDate.day).padStart(2,'0')}`;
                      const amount = document.getElementById('setup-amount').value.replace(/[^0-9]/g, '');
                      if (!amount) { alert('金額を入力してください'); return; }
                      const card = creditCards.find(c => String(c.id) === String(cardId));
                      setSetupSettlements(prev => [...prev, { cardId, cardName: card ? card.name : '', date, amount }]);
                      document.getElementById('setup-amount').value = '';
                    }} className="w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>
                      ＋ 追加
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-4 mb-4 text-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-sm ${theme.textSecondary}`}>カードが未登録のためスキップします</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setSetupStep(1)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                    ← 戻る
                  </button>
                  <button onClick={() => setSetupStep(3)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>
                    次へ →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: 確認・完了 */}
            {setupStep === 3 && (
              <div>
                <div className="text-4xl mb-3">🎉</div>
                <h2 className={`text-xl font-bold ${theme.text} mb-1`}>準備完了！</h2>
                <p className={`text-sm ${theme.textSecondary} mb-5`}>以下の内容で登録します。</p>

                <div className={`rounded-2xl p-4 mb-4 space-y-3 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                  <div>
                    <p className={`text-xs font-bold ${theme.textSecondary} mb-2`}>💳 登録カード</p>
                    {creditCards.length === 0 ? (
                      <p className={`text-sm ${theme.textSecondary}`}>なし</p>
                    ) : creditCards.map(c => (
                      <p key={c.id} className={`text-sm ${theme.text}`}>・{c.name}（{c.closingDay}日締め / 翌{c.paymentMonth === 2 ? '々' : ''}月{c.paymentDay}日払い）</p>
                    ))}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${theme.textSecondary} mb-2`}>📅 今月の引き落とし予定</p>
                    {setupSettlements.length === 0 ? (
                      <p className={`text-sm ${theme.textSecondary}`}>なし</p>
                    ) : setupSettlements.map((s, i) => (
                      <p key={i} className={`text-sm ${theme.text}`}>・{s.cardName} {s.date} ¥{Number(s.amount).toLocaleString()}</p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSetupStep(2)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold ${darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                    ← 戻る
                  </button>
                  <button onClick={() => {
                    // 引き落とし予定を取引として登録
                    if (setupSettlements.length > 0) {
                      const newTxns = setupSettlements.map((s, i) => ({
                        id: Date.now() + i,
                        date: s.date,
                        category: 'クレジット引き落とし（' + s.cardName + '）',
                        amount: -Math.abs(Number(s.amount)),
                        type: 'expense',
                        paymentMethod: 'cash',
                        settled: new Date(s.date) <= new Date(),
                        isSettlement: true,
                        parentTransactionId: null,
                        cardId: String(s.cardId),
                        memo: '初期設定で登録'
                      }));
                      setTransactions(prev => [...newTxns, ...prev]);
                    }
                    setShowSetupWizard(false);
                    setShowTutorial(true);
                    setTutorialPage(0);
                  }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: theme.accent }}>
                    ✓ はじめる
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

  );
}
