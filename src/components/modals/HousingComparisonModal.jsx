import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Home, TrendingUp, X } from 'lucide-react';

const STEPS = [
  { id: 'property', label: '物件', icon: '🏠' },
  { id: 'loan',     label: 'ローン', icon: '🏦' },
  { id: 'running',  label: 'コスト', icon: '💴' },
  { id: 'rent',     label: '賃貸', icon: '🔑' },
  { id: 'other',    label: 'その他', icon: '⚙️' },
];

const DEFAULT_PARAMS = {
  // 物件
  propertyPrice:   40000000,
  downPayment:     4000000,
  propertyType:    'new_eco',   // new_eco / new_other / used
  landRatio:       0.3,
  depreciationRate:1.0,
  // ローン
  loanMonths:      360,          // 30年
  interestRate:    0.5,
  rateType:        'variable',   // fixed / variable
  variableScenario:'neutral',
  // ランニングコスト
  managementFee:   20000,        // 月額
  propertyTax:     120000,       // 年額
  // 賃貸
  monthlyRent:     120000,
  renewalFee:      120000,
  rentInflationRate:1.0,
  // その他
  annualIncome:    6000000,
  compareYears:    30,
};

function NumInput({ label, value, onChange, prefix = '¥', suffix = '', hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ fontSize: 13, color: '#9ca3af' }}>{prefix}</span>}
        <input
          type="text" inputMode="numeric"
          value={value.toLocaleString()}
          onChange={e => {
            const v = Number(e.target.value.replace(/[^0-9]/g, ''));
            if (!isNaN(v)) onChange(v);
          }}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', outline: 'none', background: '#fff' }}
        />
        {suffix && <span style={{ fontSize: 13, color: '#9ca3af' }}>{suffix}</span>}
      </div>
      {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: value === o.value ? '#fff' : 'transparent',
            color: value === o.value ? '#111827' : '#9ca3af',
            boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{o.label}</button>
      ))}
    </div>
  );
}

export default function HousingComparisonModal({ theme, darkMode, housingParams, setHousingParams, setShowHousingModal }) {
  const [step, setStep]     = useState(0);
  const [params, setParams] = useState(housingParams || DEFAULT_PARAMS);
  const set = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const loanAmount = params.propertyPrice - params.downPayment;

  const stepContent = [
    // -- STEP 0: 物件 ------------------------------------------------------
    <div key="property" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput label="物件価格" value={params.propertyPrice} onChange={v => set('propertyPrice', v)}
        hint={`頭金 ¥${params.downPayment.toLocaleString()} → 借入 ¥${loanAmount.toLocaleString()}`} />
      <NumInput label="頭金" value={params.downPayment} onChange={v => set('downPayment', v)}
        hint="物件価格の10〜20%が目安" />
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>物件タイプ</label>
        <SegmentControl
          value={params.propertyType}
          onChange={v => set('propertyType', v)}
          options={[
            { value: 'new_eco',   label: '新築省エネ' },
            { value: 'new_other', label: '新築その他' },
            { value: 'used',      label: '中古' },
          ]}
        />
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          ローン控除上限：新築省エネ 35万円/年、新築その他 21万円/年、中古 14万円/年
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>土地比率（資産価値に影響）</label>
        <SegmentControl
          value={String(params.landRatio)}
          onChange={v => set('landRatio', Number(v))}
          options={[
            { value: '0.2', label: 'マンション (20%)' },
            { value: '0.4', label: '郊外戸建 (40%)' },
            { value: '0.6', label: '都市戸建 (60%)' },
          ]}
        />
      </div>
    </div>,

    // -- STEP 1: ローン ----------------------------------------------------
    <div key="loan" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>借入額</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8', fontVariantNumeric: 'tabular-nums' }}>
          ¥{loanAmount.toLocaleString()}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>返済期間</label>
        <SegmentControl
          value={String(params.loanMonths)}
          onChange={v => set('loanMonths', Number(v))}
          options={[
            { value: '240', label: '20年' },
            { value: '300', label: '25年' },
            { value: '360', label: '30年' },
            { value: '420', label: '35年' },
          ]}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>金利タイプ</label>
        <SegmentControl
          value={params.rateType}
          onChange={v => set('rateType', v)}
          options={[
            { value: 'fixed',    label: '固定金利' },
            { value: 'variable', label: '変動金利' },
          ]}
        />
      </div>
      <NumInput label={params.rateType === 'fixed' ? '固定金利' : '現在の変動金利'} value={params.interestRate}
        onChange={v => set('interestRate', v)} prefix="" suffix="%" hint="2024年現在：変動 0.4〜0.6%、固定 1.5〜2.0%が目安" />
      {params.rateType === 'variable' && (
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>金利上昇シナリオ</label>
          <SegmentControl
            value={params.variableScenario}
            onChange={v => set('variableScenario', v)}
            options={[
              { value: 'optimistic',  label: '楽観（現状維持）' },
              { value: 'neutral',     label: '中立（段階上昇）' },
              { value: 'pessimistic', label: '悲観（急上昇）' },
            ]}
          />
          <div style={{ marginTop: 8, padding: '10px 12px', background: '#fef9c3', borderRadius: 10, fontSize: 11, color: '#854d0e' }}>
            {params.variableScenario === 'optimistic' && '現状（0.5%前後）が継続するシナリオ'}
            {params.variableScenario === 'neutral'    && '5年後に+1%、10年後に+2%まで段階的に上昇'}
            {params.variableScenario === 'pessimistic'&& '3年後から毎年+0.5%ずつ上昇（上限3%）'}
          </div>
        </div>
      )}
    </div>,

    // -- STEP 2: ランニングコスト ------------------------------------------
    <div key="running" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput label="管理費・修繕積立金（月額）" value={params.managementFee} onChange={v => set('managementFee', v)}
        hint="マンション：15,000〜30,000円が目安。戸建の場合は0円でOK" />
      <NumInput label="固定資産税（年額）" value={params.propertyTax} onChange={v => set('propertyTax', v)}
        hint="物件価格の0.2〜0.3%が目安。購入3年後から本格的に発生" />
      <div style={{ padding: '12px 16px', background: '#f9fafb', borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>月々の総支出（概算）</p>
        {(() => {
          const monthly = loanAmount > 0
            ? Math.round(loanAmount * (params.interestRate / 100 / 12) * Math.pow(1 + params.interestRate / 100 / 12, params.loanMonths) / (Math.pow(1 + params.interestRate / 100 / 12, params.loanMonths) - 1))
            : 0;
          const total = monthly + params.managementFee + Math.round(params.propertyTax / 12);
          return (
            <>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>¥{total.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                ローン返済 ¥{monthly.toLocaleString()} ＋ 管理費 ¥{params.managementFee.toLocaleString()} ＋ 固定資産税 ¥{Math.round(params.propertyTax / 12).toLocaleString()}
              </p>
            </>
          );
        })()}
      </div>
    </div>,

    // -- STEP 3: 賃貸 ------------------------------------------------------
    <div key="rent" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput label="月額家賃" value={params.monthlyRent} onChange={v => set('monthlyRent', v)}
        hint="購入予定物件と同等の賃貸相場を入力" />
      <NumInput label="更新料（1回あたり）" value={params.renewalFee} onChange={v => set('renewalFee', v)}
        hint="一般的には家賃1ヶ月分（2年ごとに発生）" />
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>家賃上昇率（年）</label>
        <SegmentControl
          value={String(params.rentInflationRate)}
          onChange={v => set('rentInflationRate', Number(v))}
          options={[
            { value: '0',   label: '変わらない' },
            { value: '1.0', label: '1%/年' },
            { value: '2.0', label: '2%/年' },
          ]}
        />
      </div>
      <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: 12 }}>
        <p style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>
          💡 購入との月々差額（¥{Math.max(0, (() => {
            const monthly = loanAmount > 0
              ? Math.round(loanAmount * (params.interestRate / 100 / 12) * Math.pow(1 + params.interestRate / 100 / 12, params.loanMonths) / (Math.pow(1 + params.interestRate / 100 / 12, params.loanMonths) - 1))
              : 0;
            return monthly + params.managementFee + Math.round(params.propertyTax / 12) - params.monthlyRent;
          })()).toLocaleString()}）を毎月インデックス投資に回す想定でシミュレーションします
        </p>
      </div>
    </div>,

    // -- STEP 4: その他 ----------------------------------------------------
    <div key="other" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput label="購入時点の年収" value={params.annualIncome} onChange={v => set('annualIncome', v)}
        hint="住宅ローン控除の計算に使用（控除は所得税から控除。年収2,000万超は対象外）" />
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>比較期間</label>
        <SegmentControl
          value={String(params.compareYears)}
          onChange={v => set('compareYears', Number(v))}
          options={[
            { value: '10', label: '10年' },
            { value: '20', label: '20年' },
            { value: '30', label: '30年' },
            { value: '40', label: '40年' },
          ]}
        />
      </div>
      <div style={{ padding: '12px 16px', background: '#ecfdf5', borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: '#065f46', fontWeight: 600, marginBottom: 6 }}>設定内容の確認</p>
        {[
          ['物件価格', `¥${params.propertyPrice.toLocaleString()}`],
          ['頭金',     `¥${params.downPayment.toLocaleString()}`],
          ['借入額',   `¥${loanAmount.toLocaleString()}`],
          ['金利',     `${params.rateType === 'fixed' ? '固定' : '変動'} ${params.interestRate}%`],
          ['返済期間', `${params.loanMonths / 12}年`],
          ['月額家賃（比較）', `¥${params.monthlyRent.toLocaleString()}`],
          ['比較期間', `${params.compareYears}年`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: 3, borderBottom: '1px solid #a7f3d0', marginBottom: 3 }}>
            <span style={{ color: '#6b7280' }}>{k}</span>
            <span style={{ fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッ-ー */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>シミュレーター</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>🏠 持ち家 vs 賃貸</h2>
            </div>
            <button onClick={() => setShowHousingModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#6b7280" />
            </button>
          </div>

          {/* ステップインジケーター */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} onClick={() => i < step && setStep(i)} style={{ flex: 1, cursor: i < step ? 'pointer' : 'default' }}>
                <div style={{ height: 4, borderRadius: 2, background: i <= step ? '#3b82f6' : '#e5e7eb', transition: 'background 0.3s' }} />
                <p style={{ fontSize: 10, color: i === step ? '#3b82f6' : '#9ca3af', fontWeight: i === step ? 700 : 400, textAlign: 'center', marginTop: 3 }}>
                  {s.icon} {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {stepContent[step]}
        </div>

        {/* フッターボタン */}
        <div style={{ padding: 20, flexShrink: 0, display: 'flex', gap: 8, borderTop: '1px solid #f3f4f6' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '13px 20px', borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              <ChevronLeft size={16} /> 戻る
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', borderRadius: 14, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              次へ <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => { setHousingParams(params); setShowHousingModal(false); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 0', borderRadius: 14, border: 'none', background: '#10b981', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <TrendingUp size={16} /> シミュレーション開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
