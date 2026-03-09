import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, TrendingUp, X } from 'lucide-react';

const STEPS = [
  { id: 'when',     label: '時期',   icon: '📅' },
  { id: 'property', label: '物件',   icon: '🏠' },
  { id: 'loan',     label: 'ローン', icon: '🏦' },
  { id: 'running',  label: 'コスト', icon: '💴' },
  { id: 'rent',     label: '賃貸',   icon: '🔑' },
  { id: 'summary',  label: '確認',   icon: '✅' },
];

const DEFAULT_PARAMS = {
  purchaseAge:     35,          // ★ 購入予定年齢（新規追加）
  propertyPrice:   40000000,
  downPayment:     4000000,
  propertyType:    'new_eco',
  landRatio:       0.2,
  depreciationRate: 1.0,
  landAppreciationRate: 0,
  loanMonths:      360,
  interestRate:    0.5,
  rateType:        'variable',
  variableScenario:'neutral',
  managementFee:   20000,
  propertyTax:     120000,
  renovationCycles: 0,
  prepaymentYearly: 0,
  monthlyRent:     120000,
  renewalFee:      120000,
  rentInflationRate: 1,
  annualIncome:    6000000,
  compareYears:    30,
};

function NumInput({ label, value, onChange, prefix = '¥', suffix = '', hint, darkMode }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 4 }}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ fontSize: 13, color: sub }}>{prefix}</span>}
        <input
          type="text" inputMode="numeric"
          value={value.toLocaleString()}
          onChange={e => { const v = Number(e.target.value.replace(/[^0-9]/g, '')); if (!isNaN(v)) onChange(v); }}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
            fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', outline: 'none',
            background: darkMode ? '#2a2a2a' : '#fff',
            color: darkMode ? '#f5f5f5' : '#111',
          }}
        />
        {suffix && <span style={{ fontSize: 13, color: sub }}>{suffix}</span>}
      </div>
      {hint && <p style={{ fontSize: 11, color: sub, marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

function Seg({ label, options, value, onChange, darkMode }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 6 }}>{label}</label>}
      <div style={{ display: 'flex', gap: 4, background: darkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: 10, padding: 3 }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: value === o.value ? (darkMode ? '#444' : '#fff') : 'transparent',
              color: value === o.value ? (darkMode ? '#f5f5f5' : '#111827') : '#9ca3af',
              boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${darkMode ? '#2a2a2a' : 'rgba(0,0,0,0.06)'}` }}>
      <span style={{ color: sub }}>{label}</span>
      <span style={{ fontWeight: 700, color: accent || '#111827', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export default function HousingComparisonModal({ theme, darkMode, housingParams, setHousingParams, setShowHousingModal, userInfo }) {
  const [step, setStep]     = useState(0);
  const currentAge          = userInfo?.age ? Number(userInfo.age) : 30;
  const [params, setParams] = useState(() => ({
    ...DEFAULT_PARAMS,
    purchaseAge: Math.max(currentAge, housingParams?.purchaseAge ?? Math.max(currentAge + 3, 35)),
    ...(housingParams || {}),
  }));
  const set = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const loanAmount   = params.propertyPrice - params.downPayment;
  const monthlyLoan  = loanAmount > 0
    ? Math.round(loanAmount * (params.interestRate/100/12) * Math.pow(1+params.interestRate/100/12, params.loanMonths) / (Math.pow(1+params.interestRate/100/12, params.loanMonths)-1))
    : 0;
  const monthlyBuy   = monthlyLoan + params.managementFee + Math.round(params.propertyTax/12);
  const monthlyDiff  = monthlyBuy - params.monthlyRent;

  const bg     = theme?.chart  || (darkMode ? '#1c1c1e' : '#fff');
  const sub    = darkMode ? '#9ca3af' : '#6b7280';
  const blue   = theme?.accent  || '#3b82f6';
  const green  = theme?.green   || green;
  const red    = theme?.red     || red;
  const purple = theme?.purple  || purple;
  const amber  = theme?.orange  || '#f59e0b';

  // 購入年齢の選択肢（現在年齢+1 〜 60歳）
  const ageOptions = [];
  for (let a = currentAge + 1; a <= 60; a += (a < 40 ? 1 : 5)) ageOptions.push(a);

  const stepContent = [

    // -- STEP 0: 購入時期 ---------------------------------------------
    <div key="when" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '16px', background: darkMode ? 'rgba(10,132,255,0.1)' : '#eff6ff', borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: blue, marginBottom: 4 }}>📅 いつ購入する予定ですか？</p>
        <p style={{ fontSize: 11, color: sub, lineHeight: 1.6 }}>
          購入年齢を設定しておけば、それまでは賃貸として計算されます。<br/>
          資産タイムラインにも正しく反映されます。
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 8 }}>購入予定年齢</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {ageOptions.slice(0, 12).map(age => (
            <button key={age} onClick={() => set('purchaseAge', age)} style={{
              padding: '10px 4px', borderRadius: 10, border: `2px solid ${params.purchaseAge === age ? blue : (darkMode ? '#3a3a3a' : '#e5e7eb')}`,
              background: params.purchaseAge === age ? (darkMode ? '#0d1a2b' : '#eff6ff') : (darkMode ? '#252525' : '#f9fafb'),
              color: params.purchaseAge === age ? blue : sub,
              fontSize: 13, fontWeight: params.purchaseAge === age ? 800 : 500, cursor: 'pointer',
            }}>{age}歳</button>
          ))}
        </div>

        {/* 直接入力 */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: sub }}>または直接入力:</span>
          <input
            type="number" min={currentAge + 1} max={70}
            value={params.purchaseAge}
            onChange={e => set('purchaseAge', Number(e.target.value))}
            style={{
              width: 70, padding: '6px 10px', borderRadius: 8,
              border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
              background: darkMode ? '#2a2a2a' : '#f9fafb',
              color: darkMode ? '#f5f5f5' : '#111',
              fontSize: 15, fontWeight: 700, outline: 'none',
            }}
          />
          <span style={{ fontSize: 12, color: sub }}>歳</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: sub }}>
          現在 <strong style={{ color: darkMode ? '#f5f5f5' : '#111' }}>{currentAge}歳</strong> →
          <strong style={{ color: blue, marginLeft: 6 }}>{params.purchaseAge}歳で購入</strong>
          （あと{params.purchaseAge - currentAge}年）
        </p>
        <p style={{ fontSize: 11, color: sub, marginTop: 4 }}>
          それまでの{params.purchaseAge - currentAge}年間は賃貸コストとして計算されます
        </p>
      </div>
    </div>,

    // -- STEP 1: 物件 -------------------------------------------------
    <div key="property" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput darkMode={darkMode} label="物件価格" value={params.propertyPrice} onChange={v => set('propertyPrice', v)}
        hint={`頭金 ¥${params.downPayment.toLocaleString()} → 借入 ¥${loanAmount.toLocaleString()}`} />
      <NumInput darkMode={darkMode} label="頭金" value={params.downPayment} onChange={v => set('downPayment', v)}
        hint="物件価格の10〜20%が目安" />
      <Seg darkMode={darkMode} label="物件タイプ" value={params.propertyType} onChange={v => set('propertyType', v)}
        options={[{value:'new_eco',label:'新築省エネ'},{value:'new_other',label:'新築その他'},{value:'used',label:'中古'}]} />
      <p style={{ fontSize: 11, color: sub, marginTop: -8 }}>
        ローン控除：新築省エネ 35万/年・新築その他 21万/年・中古 14万/年
      </p>
      <Seg darkMode={darkMode} label="土地比率（資産価値に影響）" value={String(params.landRatio)} onChange={v => set('landRatio', Number(v))}
        options={[{value:'0.2',label:'マンション(20%)'},{value:'0.4',label:'郊外戸建(40%)'},{value:'0.6',label:'都市戸建(60%)'}]} />
      <Seg darkMode={darkMode} label="不動産価値シナリオ" value={String(params.landAppreciationRate)}
        onChange={v => { const r = Number(v); set('landAppreciationRate', r); set('depreciationRate', r>=1?0.5:r<=-1?2.0:1.0); }}
        options={[{value:'-1',label:'下落(-1%)'},{value:'0',label:'横ばい'},{value:'1',label:'上昇(+1%)'}]} />
    </div>,

    // -- STEP 2: ローン -----------------------------------------------
    <div key="loan" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '12px 16px', background: darkMode ? 'rgba(10,132,255,0.1)' : '#eff6ff', borderRadius: 12 }}>
        <p style={{ fontSize: 11, color: blue }}>借入額</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: blue, fontVariantNumeric: 'tabular-nums' }}>¥{loanAmount.toLocaleString()}</p>
      </div>
      <Seg darkMode={darkMode} label="返済期間" value={String(params.loanMonths)} onChange={v => set('loanMonths', Number(v))}
        options={[{value:'240',label:'20年'},{value:'300',label:'25年'},{value:'360',label:'30年'},{value:'420',label:'35年'}]} />
      <Seg darkMode={darkMode} label="金利タイプ" value={params.rateType} onChange={v => set('rateType', v)}
        options={[{value:'fixed',label:'固定金利'},{value:'variable',label:'変動金利'}]} />
      <NumInput darkMode={darkMode} label={params.rateType==='fixed'?'固定金利':'現在の変動金利'} value={params.interestRate}
        onChange={v => set('interestRate', v)} prefix="" suffix="%"
        hint="2024年現在：変動 0.4〜0.6%、固定 1.5〜2.0%が目安" />
      {params.rateType === 'variable' && (
        <Seg darkMode={darkMode} label="金利上昇シナリオ" value={params.variableScenario} onChange={v => set('variableScenario', v)}
          options={[{value:'optimistic',label:'楽観（現状維持）'},{value:'neutral',label:'中立（段階上昇）'},{value:'pessimistic',label:'悲観（急上昇）'}]} />
      )}
    </div>,

    // -- STEP 3: ランニングコスト ------------------------------------
    <div key="running" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput darkMode={darkMode} label="管理費・修繕積立（月額）" value={params.managementFee} onChange={v => set('managementFee', v)}
        hint="マンション：15,000〜30,000円が目安。戸建は0円でOK" />
      <NumInput darkMode={darkMode} label="固定資産税（年額）" value={params.propertyTax} onChange={v => set('propertyTax', v)}
        hint="物件価格の0.2〜0.3%が目安" />
      <Seg darkMode={darkMode} label="大規模修繕積立の上昇（15年後）" value={String(params.renovationCycles)} onChange={v => set('renovationCycles', Number(v))}
        options={[{value:'0',label:'なし'},{value:'5000',label:'+¥5,000/月'},{value:'10000',label:'+¥10,000/月'}]} />
      <NumInput darkMode={darkMode} label="年間繰り上げ返済額（任意）" value={params.prepaymentYearly} onChange={v => set('prepaymentYearly', v)}
        hint="毎年末に繰り上げ返済。0で繰り上げなし" />
      <div style={{ padding: '12px 16px', background: darkMode ? '#252525' : '#f9fafb', borderRadius: 12 }}>
        <p style={{ fontSize: 11, color: sub, marginBottom: 4 }}>月々の総支出（概算）</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#f5f5f5' : '#111', fontVariantNumeric: 'tabular-nums' }}>¥{monthlyBuy.toLocaleString()}</p>
        <p style={{ fontSize: 11, color: sub, marginTop: 2 }}>
          ローン¥{monthlyLoan.toLocaleString()} ＋ 管理費¥{params.managementFee.toLocaleString()} ＋ 固定資産税¥{Math.round(params.propertyTax/12).toLocaleString()}
        </p>
      </div>
    </div>,

    // -- STEP 4: 賃貸 -------------------------------------------------
    <div key="rent" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NumInput darkMode={darkMode} label="月額家賃" value={params.monthlyRent} onChange={v => set('monthlyRent', v)}
        hint="購入予定物件と同等の賃貸相場を入力" />
      <NumInput darkMode={darkMode} label="更新料（1回あたり）" value={params.renewalFee} onChange={v => set('renewalFee', v)}
        hint="一般的には家賃1ヶ月分（2年ごとに発生）" />
      <Seg darkMode={darkMode} label="家賃上昇率（年）" value={String(params.rentInflationRate)} onChange={v => set('rentInflationRate', Number(v))}
        options={[{value:'0',label:'変わらない'},{value:'1',label:'1%/年'},{value:'2',label:'2%/年'}]} />
      <div style={{ padding: '12px 14px', background: darkMode ? 'rgba(255,159,10,0.12)' : '#fffbeb', borderRadius: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: amber, marginBottom: 4 }}>💡 月々コスト比較</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: sub }}>購入（月）</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: blue, fontVariantNumeric: 'tabular-nums' }}>¥{monthlyBuy.toLocaleString()}</p>
          </div>
          <div style={{ fontSize: 18, color: sub, alignSelf: 'center' }}>vs</div>
          <div>
            <p style={{ fontSize: 10, color: sub }}>賃貸（月）</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: purple, fontVariantNumeric: 'tabular-nums' }}>¥{params.monthlyRent.toLocaleString()}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: sub }}>差額</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: monthlyDiff > 0 ? red : green, fontVariantNumeric: 'tabular-nums' }}>
              {monthlyDiff > 0 ? '+' : ''}{monthlyDiff < 0 ? '-' : ''}¥{Math.abs(monthlyDiff).toLocaleString()}
            </p>
          </div>
        </div>
        {monthlyDiff > 0 && (
          <p style={{ fontSize: 11, color: darkMode ? amber : '#92400e', marginTop: 6 }}>
            賃貸のほうが月¥{Math.abs(monthlyDiff).toLocaleString()}安い分を投資に回す想定でシミュレーションします
          </p>
        )}
      </div>
    </div>,

    // -- STEP 5: 確認 -------------------------------------------------
    <div key="summary" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '14px 16px', background: darkMode ? 'rgba(10,214,100,0.1)' : '#ecfdf5', borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: green, marginBottom: 10 }}>設定内容の確認</p>
        <InfoRow label="📅 購入予定年齢"   value={`${params.purchaseAge}歳（あと${params.purchaseAge-currentAge}年）`} accent={blue} />
        <InfoRow label="物件価格"          value={`¥${params.propertyPrice.toLocaleString()}`} />
        <InfoRow label="頭金"              value={`¥${params.downPayment.toLocaleString()}`} />
        <InfoRow label="借入額"            value={`¥${loanAmount.toLocaleString()}`} accent={red} />
        <InfoRow label="月々返済"          value={`¥${monthlyLoan.toLocaleString()}`} />
        <InfoRow label="金利"              value={`${params.rateType==='fixed'?'固定':'変動'} ${params.interestRate}%`} />
        <InfoRow label="返済期間"          value={`${params.loanMonths/12}年`} />
        <InfoRow label="月々総支出（購入）" value={`¥${monthlyBuy.toLocaleString()}`} />
        <InfoRow label="月々家賃（賃貸）"  value={`¥${params.monthlyRent.toLocaleString()}`} />
        <InfoRow label="月々差額"          value={`${monthlyDiff>0?'+':''}¥${monthlyDiff.toLocaleString()}`} accent={monthlyDiff>0?red:green} />
        <InfoRow label="比較期間"          value={`${params.compareYears}年`} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: 'block', marginBottom: 6 }}>比較期間</label>
        <Seg darkMode={darkMode} value={String(params.compareYears)} onChange={v => set('compareYears', Number(v))}
          options={[{value:'10',label:'10年'},{value:'20',label:'20年'},{value:'30',label:'30年'},{value:'40',label:'40年'}]} />
      </div>
      <NumInput darkMode={darkMode} label="購入時点の年収（ローン控除計算用）" value={params.annualIncome} onChange={v => set('annualIncome', v)}
        hint="控除は所得税から。年収2,000万超は対象外" />
    </div>,
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 480, background: bg, borderRadius: '20px 20px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, color: sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>シミュレーター</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: darkMode ? '#f5f5f5' : '#111' }}>🏠 持ち家 vs 賃貸</h2>
            </div>
            <button onClick={() => setShowHousingModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: darkMode ? '#2a2a2a' : '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color={sub} />
            </button>
          </div>

          {/* ステップインジケーター */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} onClick={() => i < step && setStep(i)} style={{ flex: 1, cursor: i < step ? 'pointer' : 'default' }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= step ? blue : (darkMode ? '#2a2a2a' : '#e5e7eb'), transition: 'background 0.3s' }} />
                <p style={{ fontSize: 9, color: i === step ? blue : sub, fontWeight: i === step ? 700 : 400, textAlign: 'center', marginTop: 3 }}>
                  {s.icon}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {stepContent[step]}
        </div>

        {/* フッター */}
        <div style={{ padding: '14px 20px', flexShrink: 0, display: 'flex', gap: 8, borderTop: `1px solid ${darkMode ? '#2a2a2a' : '#f3f4f6'}` }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '13px 18px', borderRadius: 12, border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`, background: 'none', fontSize: 14, fontWeight: 600, color: sub, cursor: 'pointer' }}>
              <ChevronLeft size={16} /> 戻る
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 12, border: 'none', background: blue, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }} onMouseOver={e=>e.currentTarget.style.opacity='0.85'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
              次へ <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => { setHousingParams(params); setShowHousingModal(false); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 12, border: 'none', background: green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <TrendingUp size={16} /> シミュレーション開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
