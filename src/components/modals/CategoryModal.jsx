import React from 'react';

export default function CategoryModal(props) {
  const { theme, darkMode, expenseCategories, incomeCategories, customCategories, setCustomCategories, monthlyBudget, setMonthlyBudget, newCategoryName, setNewCategoryName, newCategoryType, setNewCategoryType, addCustomCategory, setShowCategoryModal, editingCategoryName, setEditingCategoryName, editingCategoryValue, setEditingCategoryValue, handleRenameDefaultCategory, handleDeleteDefaultCategory, deleteCustomCategory } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col animate-slideUp`}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>カテゴリ管理</h2>
              <button
                onClick={() => { setShowCategoryModal(false); setEditingCategoryName(null); }}
                className={`text-2xl ${theme.textSecondary}`}
              >✕</button>
            </div>

            <div className="px-6 pb-3">
              <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5' }}>
                {(['expense', 'income']).map(type => (
                  <button
                    key={type}
                    onClick={() => { setNewCategoryType(type); setEditingCategoryName(null); }}
                    className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: newCategoryType === type ? (darkMode ? '#2a2a2a' : '#fff') : 'transparent',
                      color: newCategoryType === type ? (type === 'expense' ? theme.red : theme.green) : (darkMode ? '#737373' : '#a3a3a3'),
                      boxShadow: newCategoryType === type ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    {type === 'expense' ? '支出' : '収入'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-3">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>カテゴリ一覧</p>
              <div className="space-y-1.5">
                {(newCategoryType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES)
                  .filter(c => !(newCategoryType === 'expense' ? deletedExp : deletedInc).includes(c))
                  .map(origName => {
                    const displayName = (newCategoryType === 'expense' ? renamedExp : renamedInc)[origName] || origName;
                    const isEditing = editingCategoryName === origName + '_default';
                    return (
                      <div key={origName} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${darkMode ? 'bg-neutral-700 text-neutral-500' : 'bg-neutral-200 text-neutral-400'}`}>標準</span>
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingCategoryValue}
                            onChange={e => setEditingCategoryValue(e.target.value)}
                            onBlur={() => {
                              handleRenameDefaultCategory(origName, editingCategoryValue, newCategoryType);
                              setEditingCategoryName(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.target.blur();
                              if (e.key === 'Escape') setEditingCategoryName(null);
                            }}
                            className={`flex-1 px-2.5 py-1 rounded-lg text-sm font-medium border ${darkMode ? 'bg-neutral-700 text-white border-blue-500' : 'bg-white border-blue-400 text-neutral-900'} focus:outline-none`}
                          />
                        ) : (
                          <span className={`flex-1 text-sm font-medium ${theme.text}`}>
                            {displayName}
                            {(newCategoryType === 'expense' ? renamedExp : renamedInc)[origName] && (
                              <span className={`ml-1.5 text-[9px] ${theme.textSecondary}`}>(元: {origName})</span>
                            )}
                          </span>
                        )}
                        <button
                          onClick={() => { setEditingCategoryName(origName + '_default'); setEditingCategoryValue(displayName); }}
                          className={`p-1.5 rounded-lg transition-all text-xs ${darkMode ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`}
                        >✏️</button>
                        {origName !== 'その他' && (
                          <button
                            onClick={() => handleDeleteDefaultCategory(origName, newCategoryType)}
                            className="p-1.5 rounded-lg text-xs text-red-400 hover:text-red-500 transition-all"
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                {(customCategories[newCategoryType] || []).length > 0 && (
                  <div className={`h-px my-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                )}
                {(customCategories[newCategoryType] || []).map(cat => (
                  <div key={cat} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0"
                      style={{ backgroundColor: theme.accent + '25', color: theme.accent }}
                    >カスタム</span>
                    <span className={`flex-1 text-sm font-medium ${theme.text}`}>{cat}</span>
                    <button
                      onClick={() => deleteCustomCategory(cat, newCategoryType)}
                      className="p-1.5 rounded-lg text-xs text-red-400 hover:text-red-500 transition-all"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`px-6 pb-6 pt-3 border-t ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>新しいカテゴリを追加</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例：サブスク"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'} focus:outline-none focus:border-blue-500`}
                />
                <button
                  onClick={addCustomCategory}
                  className="px-4 py-2.5 rounded-xl font-bold text-white text-sm hover-scale"
                  style={{ backgroundColor: theme.accent }}
                >追加</button>
              </div>
            </div>
          </div>
        </div>
      )}


  );
}
