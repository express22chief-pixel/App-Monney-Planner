import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'inherit' }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, prefix = '¥', suffix = '', step = 10000, min = 0, darkMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {prefix && <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        step={step}
        min={min}
        style={{
          flex: 1, padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
          fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          background: darkMode ? '#2a2a2a' : '#f9fafb',
          color: darkMode ? '#f5f5f5' : '#111',
          outline: 'none',
        }}
      />
      {suffix && <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{suffix}</span>}
    </div>
  );
}

function Seg({ value, onChange, options, darkMode }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: darkMode ? '#2a2a2a' : '#f2f2f7', borderRadius: 8, padding: 3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700,
          background: value === o.value ? (darkMode ? '#444' : '#fff') : 'transparent',
          color: value === o.value ? (darkMode ? '#f5f5f5' : '#111') : '#9ca3af',
          boxShadow: value === o.value ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

export default function LifePlanSettingsModal({ lifePlan, setLifePlan, onClose, theme, darkMode }) {
  const [local, setLocal] = useState({ ...lifePlan });
  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const bg   = theme?.chart  || (darkMode ? '#1c1c1e' : '#fff');
  const txt  = darkMode ? '#f5f5f5' : '#111';
  const sub  = darkMode ? '#9ca3af' : '#6b7280';
  const bdr  = darkMode ? '#2a2a2a' : '#f0f0f0';
  const green = theme?.green  || '#10b981';
  const amber = theme?.orange || '#f59e0b';
  const red   = theme?.red    || '#ef4444';

  const save = () => {
    setLifePlan(local);
    onClose();
  };

  // 月次余剰の概算プレビュー
  const monthlyGross = (local.annualIncome * Math.pow(1 + local.incomeGrowthRate/100, 0)) / 12;
  const monthlyNet   = Math.round(monthlyGross * 0.8);
  const surplus      = monthlyNet - local.monthlyExpense;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, background: bg, borderRadius: '20px 20px 0 0',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: txt }}>ライフプラン設定</p>
            <p style={{ fontSize: 12, color: sub, marginTop: 2 }}>収入・支出・老後の前提を入力</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: txt }}>

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sub, marginBottom: 14 }}>現役フェーズ</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Row label="現在の年収" hint="税込み。手取りは約80%で計算します">
                  <NumInput darkMode={darkMode} value={local.annualIncome} onChange={v => set('annualIncome', v)} step={100000} />
                  <p style={{ fontSize: 11, color: sub }}>手取り月収 ≈ ¥{monthlyNet.toLocaleString()}</p>
                </Row>
                <Row label="昇給率" hint="年収の毎年の増加率">
                  <Seg darkMode={darkMode} value={local.incomeGrowthRate} onChange={v => set('incomeGrowthRate', v)}
                    options={[{value:0,label:'0%'},{value:1,label:'1%'},{value:2,label:'2%'},{value:3,label:'3%'}]} />
                </Row>
                <Row label="月間生活費" hint="住居費・食費・光熱費などすべて込み（ローン除く）">
                  <NumInput darkMode={darkMode} value={local.monthlyExpense} onChange={v => set('monthlyExpense', v)} />
                  {surplus >= 0
                    ? <p style={{ fontSize: 11, color: green, fontWeight: 600 }}>月間余剰 ≈ ¥{surplus.toLocaleString()}（積立・貯金に回ります）</p>
                    : <p style={{ fontSize: 11, color: red, fontWeight: 600 }}>⚠️ 収入が生活費を下回っています</p>
                  }
                </Row>
              </div>
            </div>

            <div style={{ height: 1, background: bdr }} />

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sub, marginBottom: 14 }}>リタイア</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Row label="リタイア年齢">
                  <Seg darkMode={darkMode} value={local.retirementAge} onChange={v => set('retirementAge', v)}
                    options={[{value:55,label:'55歳'},{value:60,label:'60歳'},{value:65,label:'65歳'},{value:70,label:'70歳'}]} />
                </Row>
                <Row label="想定寿命">
                  <Seg darkMode={darkMode} value={local.lifeExpectancy} onChange={v => set('lifeExpectancy', v)}
                    options={[{value:80,label:'80歳'},{value:85,label:'85歳'},{value:90,label:'90歳'},{value:95,label:'95歳'}]} />
                </Row>
              </div>
            </div>

            <div style={{ height: 1, background: bdr }} />

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sub, marginBottom: 14 }}>リタイア目標資産</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label="リタイア時の目標純資産" hint="この金額を達成できるかをグラフに反映します">
                  <NumInput darkMode={darkMode} value={local.retirementTargetAmount ?? 30000000} onChange={v => set('retirementTargetAmount', v)} step={1000000} />
                </Row>
                <p style={{ fontSize: 11, color: green, fontWeight: 600 }}>
                  ≈ {(() => { const v = local.retirementTargetAmount ?? 30000000; return v >= 100000000 ? `¥${(v/100000000).toFixed(1)}億` : `¥${(v/10000).toFixed(0)}万`; })()}（老後30年間の生活費 ¥{((local.retirementMonthlyExpense ?? 200000) * 12 * 30 / 10000).toFixed(0)}万の参考値）
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: bdr }} />

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sub, marginBottom: 14 }}>老後の収支</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Row label="老後の月収（年金・配当等）">
                  <NumInput darkMode={darkMode} value={local.retirementMonthlyIncome} onChange={v => set('retirementMonthlyIncome', v)} />
                  <p style={{ fontSize: 11, color: sub }}>国民年金のみの場合は約¥65,000。厚生年金込みで¥130,000〜¥200,000が目安</p>
                </Row>
                <Row label="老後の月間支出">
                  <NumInput darkMode={darkMode} value={local.retirementMonthlyExpense} onChange={v => set('retirementMonthlyExpense', v)} />
                  {(() => {
                    const cf = local.retirementMonthlyIncome - local.retirementMonthlyExpense;
                    return cf >= 0
                      ? <p style={{ fontSize: 11, color: green, fontWeight: 600 }}>月間黒字 ¥{cf.toLocaleString()}（資産は取り崩しません）</p>
                      : <p style={{ fontSize: 11, color: amber, fontWeight: 600 }}>月間不足 ¥{(-cf).toLocaleString()}を資産から補填します</p>;
                  })()}
                </Row>
              </div>
            </div>

          </div>
        </div>

        
        <div style={{ padding: '16px 20px', flexShrink: 0, borderTop: `1px solid ${bdr}` }}>
          <button onClick={save} style={{
            width: '100%', padding: '14px', background: theme.accent,
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}>
            保存してシミュレーション更新
          </button>
        </div>
      </div>
    </div>
  );
}
