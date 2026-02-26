import React from 'react';

export default function BenchmarkModal(props) {
  const { theme, darkMode, assetData, userInfo, calculateBenchmark, setShowBenchmark } = props;

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${theme.cardGlass} rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-slideUp`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {getAgeGroup() === '20s' ? '20代' : getAgeGroup() === '30s' ? '30代' : getAgeGroup() === '40s' ? '40代' : getAgeGroup() === '50s' ? '50代' : '60代以上'}平均との比較
              </h2>
              <button onClick={() => setShowBenchmark(false)} className={`text-2xl ${theme.textSecondary}`}>✕</button>
            </div>

            <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-xl p-4 mb-4`}>
              <p className={`text-xs ${theme.textSecondary} mb-2 uppercase tracking-wide`}>あなたの順位</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-5xl font-bold tabular-nums`} style={{ 
                  color: calculateBenchmark().isAboveAverage ? theme.green : theme.red 
                }}>
                  {(100 - calculateBenchmark().percentile).toFixed(1)}
                </p>
                <span className={`text-2xl font-bold ${theme.text}`}>%</span>
              </div>
              <p className={`text-sm ${theme.textSecondary} mt-1`}>
                {calculateBenchmark().isAboveAverage ? '同世代の上位に位置しています' : 'まだ伸びしろがあります'}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${theme.textSecondary}`}>総資産</span>
                  <span className={`text-xs font-semibold`} style={{ 
                    color: calculateBenchmark().isAboveAverage ? theme.green : theme.red 
                  }}>
                    {calculateBenchmark().isAboveAverage ? '+' : ''}{(calculateBenchmark().difference / 10000).toFixed(0)}万円
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>あなた</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().myTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>平均</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().avgTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme.textSecondary} mb-1`}>中央値</p>
                    <p className={`text-base font-bold ${theme.text} tabular-nums`}>
                      ¥{(calculateBenchmark().medianTotal / 10000).toFixed(0)}万
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-lg p-3`}>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>資産構成の比較</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>貯金</span>
                      <span className={theme.text}>¥{(assetData.savings / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.savings / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((assetData.savings / calculateBenchmark().benchmark.savings * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>投資</span>
                      <span className={theme.text}>¥{(assetData.investments / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.investments / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full bg-purple-500" style={{ width: `${Math.min((assetData.investments / calculateBenchmark().benchmark.investments * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>NISA</span>
                      <span className={theme.text}>¥{((assetData.nisa || 0) / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.nisa / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: theme.green, width: `${Math.min(((assetData.nisa || 0) / calculateBenchmark().benchmark.nisa * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textSecondary}>待機資金</span>
                      <span className={theme.text}>¥{((assetData.dryPowder || 0) / 10000).toFixed(0)}万 / ¥{(calculateBenchmark().benchmark.dryPowder / 10000).toFixed(0)}万</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: theme.accent, width: `${Math.min(((assetData.dryPowder || 0) / calculateBenchmark().benchmark.dryPowder * 100), 100)}%` }}></div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBenchmark(false)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover-scale"
              style={{ backgroundColor: theme.accent }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

  );
}
