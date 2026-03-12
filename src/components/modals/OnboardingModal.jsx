import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';

export default function OnboardingModal(props) {
  const {
    theme, darkMode,
    userInfo, setUserInfo,
    setShowOnboarding, setShowSetupWizard,
    assetData, setAssetData,
    setSetupStep, setSetupSettlements,
    startDemo,
  } = props;

  const [mode, setMode] = useState(null);

  const txt  = darkMode ? '#f5f5f5' : '#111';
  const sub  = darkMode ? '#aaaaaa' : '#666';
  const card = darkMode ? '#161616' : '#ffffff';
  const bg   = darkMode ? '#0d0d0d' : '#f2f2f7';
  const bdr  = darkMode ? '#2a2a2a' : '#e5e7eb';
  const cyan = '#00e5ff';

  const canStartSim = userInfo?.age && userInfo?.age > 0
    && assetData.savings >= 0 && assetData.investments >= 0;

  if (mode === null) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: darkMode ? '#080808' : '#f2f2f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#000',
              border: `1.5px solid ${cyan}`, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <polyline points="2,22 8,14 13,18 20,8 26,10" stroke={cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <rect x="2" y="2" width="24" height="24" rx="2" stroke={cyan} strokeWidth="0.4" strokeDasharray="2 3" opacity="0.3" fill="none"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 22, fontWeight: 800, color: txt, letterSpacing: '-0.03em', marginBottom: 6,
            }}>Money Planner</h1>
            <p style={{ fontSize: 13, color: sub }}>お金の流れを、時間軸で管理する。</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>

            <button onClick={() => props.startDemo()}
              style={{
                width: '100%', padding: '18px 20px', borderRadius: 14,
                background: darkMode ? '#0a1a1a' : '#f0fdfe',
                border: `1.5px solid ${cyan}`,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
              <span style={{ fontSize: 24 }}>🎮</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: cyan, marginBottom: 2 }}>まずデモで触ってみる</p>
                <p style={{ fontSize: 11, color: sub }}>架空データで全機能を体験。登録不要・30秒で開始</p>
              </div>
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMode('sim')}
                style={{
                  flex: 1, padding: '16px 14px', borderRadius: 14,
                  background: card, border: `1px solid ${bdr}`,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                <p style={{ fontSize: 20, marginBottom: 6 }}>📈</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: txt, marginBottom: 2 }}>シミュレーションを見たい</p>
                <p style={{ fontSize: 10, color: sub }}>年齢・年収・貯金額の3項目で即シミュ</p>
              </button>

              <button onClick={() => setMode('kakeibo')}
                style={{
                  flex: 1, padding: '16px 14px', borderRadius: 14,
                  background: card, border: `1px solid ${bdr}`,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                <p style={{ fontSize: 20, marginBottom: 6 }}>💳</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: txt, marginBottom: 2 }}>家計を記録したい</p>
                <p style={{ fontSize: 10, color: sub }}>クレカ登録から始める本格管理</p>
              </button>
            </div>

            {/* データ引き継ぎ：目立つカードとして表示 */}
            <button
              onClick={() => setMode('import')}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: card, border: `1px solid ${bdr}`,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <span style={{ fontSize: 20 }}>📥</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: txt, marginBottom: 1 }}>以前のデータを引き継ぐ</p>
                <p style={{ fontSize: 10, color: sub }}>エクスポートしたJSONファイルから復元</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (mode === 'sim') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: darkMode ? '#080808' : '#f2f2f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <button onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 12, marginBottom: 20 }}>
            ← 戻る
          </button>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 4 }}>📈 シミュレーション</h2>
          <p style={{ fontSize: 12, color: sub, marginBottom: 24 }}>3項目を入力するだけで30年の資産推移を計算します</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>年齢</label>
              <input
                type="number" placeholder="32"
                value={userInfo?.age || ''}
                onChange={e => setUserInfo(prev => ({ ...(prev || {}), age: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${bdr}`, background: card,
                  color: txt, fontSize: 16, fontWeight: 700, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>年収（税込）</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" inputMode="numeric" placeholder="6000000"
                  value={userInfo?.annualIncome || ''}
                  onChange={e => {
                    const v = e.target.value.replace(new RegExp('[^0-9]', 'g'), '');
                    setUserInfo(prev => ({ ...(prev || {}), annualIncome: v }));
                  }}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${bdr}`, background: card,
                    color: txt, fontSize: 16, fontWeight: 700, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {userInfo?.annualIncome > 0 && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: sub }}>
                    ¥{Math.round(userInfo.annualIncome / 10000)}万
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>現在の貯金額</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" inputMode="numeric" placeholder="1000000"
                  value={assetData.savings || ''}
                  onChange={e => {
                    const v = Number(e.target.value.replace(new RegExp('[^0-9]', 'g'), ''));
                    setAssetData(prev => ({ ...prev, savings: v }));
                  }}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${bdr}`, background: card,
                    color: txt, fontSize: 16, fontWeight: 700, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {assetData.savings > 0 && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: sub }}>
                    ¥{Math.round(assetData.savings / 10000)}万
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: sub, marginTop: 4 }}>投資額・NISAは後でいつでも追加できます</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!userInfo?.age) return;
              const income = Number(userInfo.annualIncome) || 6000000;
              props.setLifePlan && props.setLifePlan(prev => ({
                ...prev,
                currentAge: Number(userInfo.age),
                annualIncome: income,
              }));
              setShowOnboarding(false);
              props.setActiveTab && props.setActiveTab('simulation');
            }}
            disabled={!userInfo?.age}
            style={{
              width: '100%', padding: '16px', borderRadius: 12,
              background: userInfo?.age ? cyan : (darkMode ? '#222' : '#e5e7eb'),
              color: userInfo?.age ? '#000' : sub,
              border: 'none', cursor: userInfo?.age ? 'pointer' : 'default',
              fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
            }}
          >
            シミュレーションを見る →
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'kakeibo') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: darkMode ? '#080808' : '#f2f2f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <button onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 12, marginBottom: 20 }}>
            ← 戻る
          </button>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 4 }}>💳 家計記録</h2>
          <p style={{ fontSize: 12, color: sub, marginBottom: 24 }}>基本情報だけ入力してすぐ始められます</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>お名前</label>
              <input
                type="text" placeholder="例：翔太"
                value={userInfo?.name || ''}
                onChange={e => setUserInfo(prev => ({ ...(prev || {}), name: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${bdr}`, background: card,
                  color: txt, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>年齢</label>
              <input
                type="number" placeholder="32"
                value={userInfo?.age || ''}
                onChange={e => setUserInfo(prev => ({ ...(prev || {}), age: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${bdr}`, background: card,
                  color: txt, fontSize: 16, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 6 }}>
                現在の貯金額 <span style={{ fontWeight: 400, color: sub }}>（省略可）</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" inputMode="numeric" placeholder="0"
                  value={assetData.savings || ''}
                  onChange={e => {
                    const v = Number(e.target.value.replace(new RegExp('[^0-9]', 'g'), ''));
                    setAssetData(prev => ({ ...prev, savings: v }));
                  }}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${bdr}`, background: card,
                    color: txt, fontSize: 16, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {assetData.savings > 0 && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: sub }}>
                    ¥{Math.round(assetData.savings / 10000)}万
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!userInfo?.age) return;
              setShowOnboarding(false);
              setShowSetupWizard(true);
              setSetupStep(1);
              setSetupSettlements([]);
            }}
            disabled={!userInfo?.age}
            style={{
              width: '100%', padding: '16px', borderRadius: 12,
              background: userInfo?.age ? cyan : (darkMode ? '#222' : '#e5e7eb'),
              color: userInfo?.age ? '#000' : sub,
              border: 'none', cursor: userInfo?.age ? 'pointer' : 'default',
              fontSize: 14, fontWeight: 800,
            }}
          >
            クレカを登録して始める →
          </button>

        </div>
      </div>
    );
  }

  if (mode === 'import') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: darkMode ? '#080808' : '#f2f2f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <button onClick={() => setMode(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 12, marginBottom: 20 }}>
            ← 戻る
          </button>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 4 }}>📥 データを引き継ぐ</h2>
          <p style={{ fontSize: 12, color: sub, marginBottom: 24, lineHeight: 1.6 }}>
            以前にエクスポートしたJSONファイルを選択してください。<br />
            全データが復元されます。
          </p>

          <div style={{
            padding: '16px', borderRadius: 12,
            background: darkMode ? 'rgba(0,229,255,0.06)' : 'rgba(59,130,246,0.06)',
            border: `1px solid ${darkMode ? 'rgba(0,229,255,0.2)' : 'rgba(59,130,246,0.2)'}`,
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 11, color: darkMode ? '#7dd3fc' : '#3b82f6', lineHeight: 1.7 }}>
              💡 <strong>エクスポートファイルの場所</strong><br />
              設定タブ → 「データをエクスポート」で作成したJSONファイルです。
              メールやクラウドストレージに保存しておくと、機種変更時に使えます。
            </p>
          </div>

          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const d = JSON.parse(ev.target.result);
                    if (d.transactions)          props.setTransactions(d.transactions);
                    if (d.recurringTransactions) props.setRecurringTransactions(d.recurringTransactions);
                    if (d.creditCards)           props.setCreditCards(d.creditCards);
                    if (d.monthlyBudget)         props.setMonthlyBudget(d.monthlyBudget);
                    if (d.simulationSettings)    props.setSimulationSettings(d.simulationSettings);
                    if (d.userInfo)              props.setUserInfo(d.userInfo);
                    if (d.assetData)             props.setAssetData(d.assetData);
                    if (d.monthlyHistory)        props.setMonthlyHistory(d.monthlyHistory);
                    if (d.lifeEvents)            props.setLifeEvents(d.lifeEvents);
                    if (d.lifePlan)              props.setLifePlan(d.lifePlan);
                    if (d.wallets)               props.setWallets && props.setWallets(d.wallets);
                    if (d.customCategories)      props.setCustomCategories(d.customCategories);
                    setShowOnboarding(false);
                  } catch {
                    setMode('importError');
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            style={{
              width: '100%', padding: '16px', borderRadius: 12,
              background: cyan, border: 'none', cursor: 'pointer',
              color: '#000', fontSize: 14, fontWeight: 800,
            }}
          >
            JSONファイルを選択して復元する
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'importError') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: darkMode ? '#080808' : '#f2f2f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>😕</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 8 }}>読み込めませんでした</h2>
          <p style={{ fontSize: 12, color: sub, marginBottom: 24, lineHeight: 1.6 }}>
            有効なJSONファイルではないか、<br />破損している可能性があります。
          </p>
          <button
            onClick={() => setMode('import')}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: cyan, border: 'none', cursor: 'pointer',
              color: '#000', fontSize: 14, fontWeight: 800,
            }}
          >
            もう一度試す
          </button>
          <button
            onClick={() => setMode(null)}
            style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 12 }}
          >
            最初に戻る
          </button>
        </div>
      </div>
    );
  }

  return null;
}
