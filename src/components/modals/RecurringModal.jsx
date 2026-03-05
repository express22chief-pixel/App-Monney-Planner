import React from 'react';

export default function RecurringModal(props) {
  const { theme, darkMode, showRecurringModal, setShowRecurringModal, editingRecurring, setEditingRecurring, addOrUpdateRecurring, creditCards, expenseCategories, incomeCategories } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {editingRecurring ? '定期支払いを編集' : '定期支払いを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowRecurringModal(false);
                  setEditingRecurring(null);
                }}
                className={`text-2xl ${theme.textSecondary}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>名称</label>
                <input
                  type="text"
                  placeholder="例：家賃"
                  value={editingRecurring?.name || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="80000"
                  value={editingRecurring?.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEditingRecurring({ ...editingRecurring, amount: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                  ¥{(editingRecurring?.amount || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>カテゴリ</label>
                <select
                  value={editingRecurring?.category || ''}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="">選択してください</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 繰り-しタイプ選択 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>繰り返しのルール</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'monthly-date', weekday: null, weekNumber: null })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'monthly-date' || !editingRecurring?.recurrenceType
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    月（日付指定）
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'monthly-weekday', day: null, weekNumber: 1, weekday: 'monday' })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'monthly-weekday'
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    月（曜日指定）
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, recurrenceType: 'weekly', day: null, weekday: 'monday' })}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                      editingRecurring?.recurrenceType === 'weekly'
                        ? 'bg-blue-500 text-white'
                        : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    週
                  </button>
                </div>
              </div>
              
              {/* 日付指定（月・日付指定の場合） */}
              {(!editingRecurring?.recurrenceType || editingRecurring?.recurrenceType === 'monthly-date') && (
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>日付</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    value={editingRecurring?.day || ''}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, day: Number(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    } focus:outline-none focus:border-blue-500`}
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>毎月{editingRecurring?.day || '?'}日</p>
                </div>
              )}
              
              {/* 曜日指定（月・曜日指定 or -の場合） */}
              {(editingRecurring?.recurrenceType === 'monthly-weekday' || editingRecurring?.recurrenceType === 'weekly') && (
                <div>
                  {editingRecurring?.recurrenceType === 'monthly-weekday' && (
                    <div className="mb-3">
                      <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>第何週</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, -1].map(num => (
                          <button
                            key={num}
                            onClick={() => setEditingRecurring({ ...editingRecurring, weekNumber: num })}
                            className={`py-2 rounded-lg text-sm font-medium transition-all ${
                              editingRecurring?.weekNumber === num
                                ? 'bg-blue-500 text-white'
                                : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {num === -1 ? '最終' : `第${num}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>曜日</label>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { key: 'sunday', label: '日' },
                      { key: 'monday', label: '月' },
                      { key: 'tuesday', label: '火' },
                      { key: 'wednesday', label: '水' },
                      { key: 'thursday', label: '木' },
                      { key: 'friday', label: '金' },
                      { key: 'saturday', label: '土' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setEditingRecurring({ ...editingRecurring, weekday: key })}
                        className={`py-2 rounded-lg text-xs font-medium transition-all ${
                          editingRecurring?.weekday === key
                            ? 'bg-blue-500 text-white'
                            : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 繰り返しの間- */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  繰り返しの間隔: {editingRecurring?.recurrenceType === 'weekly' ? `${editingRecurring?.interval || 1}週` : `${editingRecurring?.interval || 1}ヶ月`}
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={editingRecurring?.interval || 1}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, interval: Number(e.target.value) })}
                  className="w-full"
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {editingRecurring?.recurrenceType === 'weekly' 
                    ? `毎${editingRecurring?.interval || 1}週`
                    : `毎${editingRecurring?.interval || 1}ヶ月`
                  }
                </p>
              </div>
              
              {/* 開始日 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>開始日</label>
                <input
                  type="date"
                  value={editingRecurring?.startDate || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEditingRecurring({ ...editingRecurring, startDate: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-base appearance-none transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                  style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                />
              </div>
              
              {/* 終了日 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.textSecondary}`}>終了日</label>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, endDate: editingRecurring?.endDate ? null : new Date().toISOString().slice(0, 10) })}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      editingRecurring?.endDate ? 'bg-blue-500 text-white' : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {editingRecurring?.endDate ? '設定中' : '無期限'}
                  </button>
                </div>
                {editingRecurring?.endDate && (
                  <input
                    type="date"
                    value={editingRecurring.endDate}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, endDate: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    } focus:outline-none focus:border-blue-500`}
                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                  />
                )}
              </div>
              
              {/* 休日の処理 */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>当日が休日の場合</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'none', label: '何もしない' },
                    { key: 'before', label: '前営業日' },
                    { key: 'after', label: '翌営業日' },
                    { key: 'skip', label: 'スキップ' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setEditingRecurring({ ...editingRecurring, holidayRule: key })}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        (editingRecurring?.holidayRule || 'none') === key
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>


              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>種類</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'expense', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'expense' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'expense' ? theme.red : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'expense' ? '#fff' : theme.textSecondary
                    }}
                  >
                    固定費
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'investment', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'investment' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'investment' ? theme.purple : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'investment' ? '#fff' : theme.textSecondary
                    }}
                  >
                    投資積立
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'fund', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'fund' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'fund' ? theme.green : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'fund' ? '#fff' : theme.textSecondary
                    }}
                  >
                    投資信託
                  </button>
                  <button
                    onClick={() => setEditingRecurring({ ...editingRecurring, type: 'insurance', paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      editingRecurring?.type === 'insurance' ? 'scale-105 shadow-md' : 'hover-scale'
                    }`}
                    style={{
                      backgroundColor: editingRecurring?.type === 'insurance' ? '#3b82f6' : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                      color: editingRecurring?.type === 'insurance' ? '#fff' : theme.textSecondary
                    }}
                  >
                    🛡️ 積立保険
                  </button>
                </div>
              </div>

              {/* -払い方法（全種類で選択可） */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>支払い方法</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { key: 'cash', label: '💵 現金・振替' },
                    { key: 'credit', label: '💳 クレジット' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setEditingRecurring({ ...editingRecurring, paymentMethod: key, cardId: key === 'credit' ? (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) : null })}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: (editingRecurring?.paymentMethod || 'cash') === key ? theme.accent : (darkMode ? '#1C1C1E' : '#f5f5f5'),
                        color: (editingRecurring?.paymentMethod || 'cash') === key ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                      }}
                    >{label}</button>
                  ))}
                </div>
                {(editingRecurring?.paymentMethod === 'credit') && creditCards.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {creditCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => setEditingRecurring({ ...editingRecurring, cardId: card.id })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? theme.accent : (darkMode ? '#2a2a2a' : '#f0f0f0'),
                          color: (editingRecurring?.cardId || (creditCards[0] && creditCards[0].id)) === card.id ? '#fff' : (darkMode ? '#d4d4d4' : '#737373'),
                        }}
                      >{card.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!editingRecurring?.name || !editingRecurring?.amount || !editingRecurring?.category || !editingRecurring?.day) {
                    alert('全ての項目を入力してください');
                    return;
                  }
                  addOrUpdateRecurring(editingRecurring);
                }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                {editingRecurring?.id ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>


  );
}
