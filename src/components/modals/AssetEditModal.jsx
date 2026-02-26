import React from 'react';

export default function AssetEditModal(props) {
  const { theme, darkMode, assetData, setAssetData, setShowAssetEditModal } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>資産額を編集</h2>
              <button onClick={() => setShowAssetEditModal(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>貯金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.savings}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, savings: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.savings.toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>投資額（課税口座）</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.investments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, investments: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{assetData.investments.toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>NISA投資額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.nisa || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, nisa: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.nisa || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1 flex items-center gap-1`}>
                  <Droplets size={14} style={{ color: theme.accent }} />
                  投資待機資金
                </label>
                <p className={`text-[11px] ${theme.textSecondary} mb-2 leading-relaxed`}>
                  💡 投資タイミングを待っている現金。株安・暴落時などに素早く投資に回すために別管理する資金です。
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assetData.dryPowder || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAssetData({ ...assetData, dryPowder: Number(value) });
                  }}
                  className={`w-full px-4 py-3 rounded-xl tabular-nums transition-all duration-200 ${
                    darkMode ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-white border border-neutral-200'
                  } focus:outline-none focus:border-blue-500`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1 tabular-nums`}>¥{(assetData.dryPowder || 0).toLocaleString()}</p>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>総資産</span>
                  <span className={`text-lg font-bold ${theme.text} tabular-nums`}>
                    ¥{((isNaN(assetData.savings) ? 0 : assetData.savings) + (isNaN(assetData.investments) ? 0 : assetData.investments) + (isNaN(assetData.nisa) ? 0 : (assetData.nisa || 0)) + (isNaN(assetData.dryPowder) ? 0 : (assetData.dryPowder || 0))).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowAssetEditModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
                style={{ backgroundColor: theme.accent }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}


  );
}
