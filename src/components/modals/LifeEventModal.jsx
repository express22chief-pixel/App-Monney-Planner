import React from 'react';

export default function LifeEventModal(props) {
  const { theme, darkMode, editingLifeEvent, setEditingLifeEvent, addOrUpdateLifeEvent, setShowLifeEventModal } = props;

  return (
      {showLifeEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardGlass} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {editingLifeEvent ? 'イベントを編集' : 'ライフイベントを追加'}
              </h2>
              <button
                onClick={() => {
                  setShowLifeEventModal(false);
                  setEditingLifeEvent(null);
                }}
                className={`text-2xl ${theme.textSecondary}`}
              >
                ✕
              </button>
            </div>

            {!editingLifeEvent && (
              <div className="mb-4">
                <p className={`text-sm ${theme.textSecondary} mb-3`}>テンプレートを選択</p>
                <div className="grid grid-cols-2 gap-2">
                  {lifeEventTemplates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        setEditingLifeEvent({
                          name: template.name,
                          amount: template.estimatedAmount,
                          icon: template.icon,
                          date: new Date().toISOString().slice(0, 7)
                        });
                      }}
                      className={`p-3 rounded-lg text-left transition-all duration-200 hover-scale ${
                        darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <p className={`text-xs font-semibold ${theme.text}`}>{template.name}</p>
                      {template.estimatedAmount > 0 && (
                        <p className={`text-xs ${theme.textSecondary} tabular-nums`}>
                          ¥{(template.estimatedAmount / 10000).toFixed(0)}万
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingLifeEvent && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>アイコン</label>
                  <div className="grid grid-cols-6 gap-2">
                    {eventIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setEditingLifeEvent({ ...editingLifeEvent, icon })}
                        className={`text-2xl p-2 rounded-lg transition-all duration-200 hover-scale ${
                          editingLifeEvent.icon === icon
                            ? 'bg-blue-500 scale-110'
                            : darkMode ? 'bg-neutral-800' : 'bg-neutral-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>イベント名</label>
                  <input
                    type="text"
                    value={editingLifeEvent.name || ''}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    }`}
                    placeholder="例：結婚"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予定金額</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingLifeEvent.amount || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditingLifeEvent({ ...editingLifeEvent, amount: Number(value) });
                    }}
                    className={`w-full px-4 py-2 rounded-lg tabular-nums ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    }`}
                    placeholder="3000000"
                  />
                  <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>
                    ¥{(editingLifeEvent.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>予定時期</label>
                  <input
                    type="month"
                    value={editingLifeEvent.date || ''}
                    onChange={(e) => setEditingLifeEvent({ ...editingLifeEvent, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                    }`}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!editingLifeEvent.name || !editingLifeEvent.date) {
                      alert('イベント名と予定時期を入力してください');
                      return;
                    }
                    addOrUpdateLifeEvent(editingLifeEvent);
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >
                  {editingLifeEvent.id ? '更新' : '追加'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

  );
}
