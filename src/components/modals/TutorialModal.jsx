import React from 'react';

export default function TutorialModal(props) {
  const { theme, darkMode, tutorialPage, setTutorialPage, setShowTutorial } = props;

  return (
        const slides = [
          {
            emoji: '💡',
            title: 'このアプリのコンセプト',
            subtitle: 'キャッシュフローで、お金を把握する',
            desc: '多くの家計簿は「使った金額」を記録するだけです。でもクレカ払いが多い現代、「実際にお金が動く日」と「使った日」がズれていて、月末に残高が合わない…ということはありませんか？このアプリはそれを解決します。',
            color: '#6366f1',
            visual: 'concept',
          },
          {
            emoji: '📊',
            title: 'キャッシュフロー管理',
            subtitle: '「いつ」お金が動くかを管理する',
            desc: 'クレカで買い物した瞬間に「支出」と「翌月の引き落とし予約」を同時に記録。カレンダーで未来の支払いが一目でわかり、「今月あといくら使えるか」が常に明確になります。',
            color: '#3b82f6',
            visual: 'cashflow',
          },
          {
            emoji: '👋',
            title: 'ようこそ！',
            subtitle: 'お金の流れを、シンプルに管理',
            desc: '収入・支出の記録からクレカ管理・資産管理まで、ひとつのアプリで完結します。残りのスライドで使い方を説明します。',
            color: '#10b981',
          },
          {
            emoji: '💳',
            title: 'クレカ設定を先に済ませよう',
            subtitle: '締め日・引き落とし日を登録',
            desc: '設定タブ →「クレジットカード」から、使っているカードを登録しましょう。締め日と引き落とし日を設定することで、クレカ払いの取引を追加するとその日程で引き落とし予約が自動で作られます。',
            color: '#a855f7',
            tips: ['複数枚のカードも個別に登録できます', '末日締めは「末日」を選んでください'],
          },
          {
            emoji: '📝',
            title: '取引の記録',
            subtitle: '支出・収入を素早く入力',
            desc: 'ホーム右下の「＋ 取引を追加」から入力します。クレジットカード払いを選ぶとカードを選択でき、登録した締め日・引き落とし日に基づいて引き落とし予約が自動生成されます。',
            color: '#ec4899',
            tips: ['💵 現金は即確定、💳 クレカは引き落とし日にCFへ反映', 'カレンダーの日付タップからも追加できます'],
          },
          {
            emoji: '🔄',
            title: '定期支払い',
            subtitle: '毎月の固定費を自動記録',
            desc: 'ホームの「定期支払い → ＋ 追加」で家賃・光熱費・サブスクなどを登録すると、毎月自動で取引が追加されます。投資積立・投資信託・積立保険も登録でき、月締め時に資産へ自動反映されます。',
            color: '#f59e0b',
            tips: ['🔄 固定費、📈 投資積立、📊 投資信託、🛡️ 積立保険', '日付指定・曜日指定どちらも設定できます'],
          },
          {
            emoji: '👥',
            title: '立替払い',
            subtitle: '複数人分の支払いを管理',
            desc: '取引入力で「👥 複数人分を立替払い」をONにすると、誰にいくら立て替えたか個別に記録できます。「÷均等割り」ボタンで自動計算も。精算した人はホームの「立替待ち」から個別に精算処理できます。',
            color: '#3b82f6',
            tips: ['立替分は回収するまで支出から除外されます', '人ごとに個別精算できます'],
          },
          {
            emoji: '💰',
            title: '月締め・資産管理',
            subtitle: '月末に収支を確定させよう',
            desc: '月末に「◯月の収支を確定する」ボタンを押すと収支が確定し、貯金・投資額が資産タブへ自動で反映されます。資産タブでは総資産・各カテゴリの推移をグラフで確認できます。',
            color: '#10b981',
            tips: ['投資積立・保険は月締め時に自動で資産に加算', '締めた月は編集できますが再締めが必要です'],
          },
          {
            emoji: '🛠️',
            title: 'データ管理',
            subtitle: 'いざというときのメンテナンス',
            desc: '設定タブ →「データ管理」に便利なツールがあります。「🔄 引き落とし予約日を一括更新」でカード設定変更後に既存データをまとめて更新できます。「🧹 孤立した引き落とし予約を削除」で不要なデータも整理できます。',
            color: '#6366f1',
            tips: ['カード設定を変更したら一括更新を忘れずに', 'データのエクスポートでバックアップも可能'],
          },
        ];
        const slide = slides[tutorialPage];
        const isLast = tutorialPage === slides.length - 1;

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <div className={`w-full max-w-md rounded-t-3xl animate-slideUp overflow-hidden`}
              style={{ backgroundColor: darkMode ? '#141414' : '#ffffff', paddingBottom: 'env(safe-area-inset-bottom)' }}>

              {/* プログレスバー */}
              <div className="flex gap-1 px-5 pt-5">
                {slides.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: darkMode ? '#2a2a2a' : '#e5e7eb' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: i < tutorialPage ? '100%' : i === tutorialPage ? '100%' : '0%',
                        backgroundColor: i <= tutorialPage ? slide.color : 'transparent'
                      }} />
                  </div>
                ))}
              </div>

              {/* スライドコンテンツ */}
              <div className="px-6 pt-6 pb-4">
                {/* 絵文字アイコン */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-4"
                  style={{ backgroundColor: slide.color + '20' }}>
                  {slide.emoji}
                </div>

                {/* タイトル */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-1`} style={{ color: slide.color }}>
                  {slide.subtitle}
                </p>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                  {slide.title}
                </h2>
                <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {slide.desc}
                </p>

                {/* Tipsリスト */}
                {slide.tips && (
                  <div className="space-y-1.5 mb-4">
                    {slide.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5" style={{ color: slide.color }}>●</span>
                        <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
                {slide.visual === 'concept' && (
                  <div className={`rounded-2xl p-4 mb-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold mb-3 text-center ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>一般的な家計簿 vs このアプリ</p>
                    <div className="flex gap-2">
                      <div className={`flex-1 rounded-xl p-3 ${darkMode ? 'bg-neutral-700' : 'bg-white'} border ${darkMode ? 'border-neutral-600' : 'border-neutral-200'}`}>
                        <p className="text-xs font-bold text-red-400 mb-2">😓 一般的な家計簿</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/15 カフェ</span><span className="text-red-400">-¥600</span></div>
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/20 洋服</span><span className="text-red-400">-¥8,000</span></div>
                          <div className={`text-[10px] mt-2 pt-2 border-t ${darkMode ? 'border-neutral-600 text-neutral-400' : 'border-neutral-200 text-neutral-400'}`}>💭 引き落としいつ？残高大丈夫？</div>
                        </div>
                      </div>
                      <div className={`flex-1 rounded-xl p-3 ${darkMode ? 'bg-neutral-700' : 'bg-white'} border-2`} style={{ borderColor: '#6366f1' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#6366f1' }}>😊 このアプリ</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/15 カフェ</span><span className="text-red-400">-¥600</span></div>
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/20 洋服</span><span className="text-red-400">-¥8,000</span></div>
                          <div className="flex justify-between text-xs"><span className="text-orange-400">2/27 💳引落</span><span className="text-orange-400">-¥8,600</span></div>
                          <div className={`text-[10px] mt-1 pt-1 border-t ${darkMode ? 'border-neutral-600' : 'border-neutral-200'}`} style={{ color: '#6366f1' }}>✅ 自動で予約記録！</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {slide.visual === 'cashflow' && (
                  <div className={`rounded-2xl p-4 mb-2 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold mb-3 text-center ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>クレカで¥10,000買い物した場合</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-right"><div className="text-xs font-bold" style={{ color: '#3b82f6' }}>1/20</div><div className={`text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>購入日</div></div>
                        <div className="flex-1 h-9 rounded-lg flex items-center px-3" style={{ backgroundColor: '#3b82f620' }}>
                          <span className="text-xs" style={{ color: '#3b82f6' }}>💳 支出 ¥10,000 を記録</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-right"><div className="text-xs font-bold text-orange-400">2/27</div><div className={`text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>引落日</div></div>
                        <div className="flex-1 h-9 rounded-lg flex items-center px-3" style={{ backgroundColor: '#f59e0b20' }}>
                          <span className="text-xs text-orange-400">🔔 引き落とし予約を自動生成</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-[11px] mt-3 text-center ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>カレンダーで未来の支払いが一目でわかる！</p>
                  </div>
                )}

                {/* コンセプト図 */}
                {slide.visual === 'concept' && (
                  <div className={`rounded-2xl p-4 mb-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold mb-3 text-center ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>一般的な家計簿 vs このアプリ</p>
                    <div className="flex gap-3">
                      <div className={`flex-1 rounded-xl p-3 ${darkMode ? 'bg-neutral-700' : 'bg-white'} border ${darkMode ? 'border-neutral-600' : 'border-neutral-200'}`}>
                        <p className="text-xs font-bold text-red-400 mb-2">😓 一般的な家計簿</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/15 カフェ</span><span className="text-red-400">-¥600</span></div>
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/20 洋服</span><span className="text-red-400">-¥8,000</span></div>
                          <div className={`text-xs mt-2 pt-2 border-t ${darkMode ? 'border-neutral-600 text-neutral-400' : 'border-neutral-200 text-neutral-500'}`}>💭 引き落とし日は？<br/>残高大丈夫？</div>
                        </div>
                      </div>
                      <div className={`flex-1 rounded-xl p-3 ${darkMode ? 'bg-neutral-700' : 'bg-white'} border-2`} style={{ borderColor: '#6366f1' }}>
                        <p className="text-xs font-bold mb-2" style={{ color: '#6366f1' }}>😊 このアプリ</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>1/15 カフェ</span><span className="text-red-400">-¥600</span></div>
                          <div className="flex justify-between text-xs"><span className={darkMode ? 'text-neutral-300' : 'text-neutral-600'}>2/27 💳引落</span><span className="text-orange-400">-¥8,600</span></div>
                          <div className={`text-xs mt-2 pt-2 border-t ${darkMode ? 'border-neutral-600' : 'border-neutral-200'}`} style={{ color: '#6366f1' }}>✅ 引き落とし日まで<br/>自動で記録！</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* キャッシュフロー図 */}
                {slide.visual === 'cashflow' && (
                  <div className={`rounded-2xl p-4 mb-4 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                    <p className={`text-xs font-bold mb-3 text-center ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>クレカ払い ¥10,000 の場合</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-14 text-center">
                          <div className="text-xs font-bold" style={{ color: '#3b82f6' }}>1/20</div>
                          <div className={`text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>購入日</div>
                        </div>
                        <div className="flex-1 h-8 rounded-lg flex items-center px-3" style={{ backgroundColor: '#3b82f620' }}>
                          <span className="text-xs" style={{ color: '#3b82f6' }}>💳 クレカ支出 ¥10,000 を記録</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                        <div className="w-px h-4" style={{ backgroundColor: '#3b82f640', marginLeft: '0px' }}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-14 text-center">
                          <div className="text-xs font-bold text-orange-400">2/27</div>
                          <div className={`text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>引落日</div>
                        </div>
                        <div className="flex-1 h-8 rounded-lg flex items-center px-3" style={{ backgroundColor: '#f59e0b20' }}>
                          <span className="text-xs text-orange-400">🔔 引き落とし予約 ¥10,000</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs mt-3 text-center ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>カレンダーで未来の支払いが一目でわかる！</p>
                  </div>
                )}
              </div>

              {/* ボタン */}
              <div className="flex gap-3 px-6 pb-6">
                {tutorialPage > 0 && (
                  <button
                    onClick={() => setTutorialPage(p => p - 1)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}
                  >
                    ← 戻る
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isLast) { setShowTutorial(false); }
                    else { setTutorialPage(p => p + 1); }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover-scale"
                  style={{ backgroundColor: slide.color }}
                >
                  {isLast ? '✓ はじめる' : `次へ (${tutorialPage + 1}/${slides.length})`}
                </button>
              </div>

              {/* スキップ */}
              {!isLast && (
                <button
                  onClick={() => setShowTutorial(false)}
                  className={`w-full pb-3 text-xs text-center ${darkMode ? 'text-neutral-600' : 'text-neutral-400'}`}
                >
                  スキップ
                </button>
              )}
            </div>
          </div>
        );

  );
}
