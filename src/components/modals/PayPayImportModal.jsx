/**
 * components/modals/PayPayImportModal.jsx
 * PayPay CSV 一括インポートモーダル。
 *
 * 【支払い方法の分類】
 * - "クレジット XXXX"   → 外部クレカ（PayPay連携カード）
 * - "PayPayカード XXXX" → PayPayカード本体（クレカ扱い）
 * - それ以外             → 即時決済（PayPay残高 / ポイントなど）
 *
 * 【クレカ特定ロジック】
 * 1. creditCards に isPayPayLinked === true のカードがあれば自動適用
 * 2. 連携カードが未設定なら、CSV読み込み後にカード選択欄を表示
 * 3. 「どのカードでもない（残高払いと同様に扱う）」も選択可
 */
import React, { useState, useRef, useMemo } from 'react';
import { Upload, X, Check, ChevronDown, AlertCircle, CreditCard, Info } from 'lucide-react';

// --- 支払い方法の分類 ---------------------------------------------------------
function classifyPaymentMethod(rawMethod) {
  if (!rawMethod) return 'cash';
  const m = rawMethod.trim();
  // "クレジット XXXX" または "PayPayカード XXXX" はクレカ扱い
  if (m.startsWith('クレジット') || m.startsWith('PayPayカード')) return 'credit';
  return 'cash'; // PayPay残高、PayPayポイント等
}

// --- CSVパーサー --------------------------------------------------------------
function parsePayPayCsv(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const COL = {
    date:     headers.indexOf('取引日'),
    amount:   headers.indexOf('出金金額（円）'),
    content:  headers.indexOf('取引内容'),
    merchant: headers.indexOf('取引先'),
    method:   headers.indexOf('取引方法'),
    txId:     headers.indexOf('取引番号'),
  };

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 4) continue;
    if ((cols[COL.content] || '').trim() !== '支払い') continue;

    const rawAmount = (cols[COL.amount] || '').replace(/[",]/g, '').trim();
    const amount    = parseInt(rawAmount, 10);
    if (!amount || isNaN(amount)) continue;

    const rawDate = (cols[COL.date] || '').trim();
    const date    = rawDate.slice(0, 10).replace(/\//g, '-');
    const rawMethod = (cols[COL.method] || '').trim();

    results.push({
      date,
      amount,
      merchant:      (cols[COL.merchant] || '').trim() || '不明',
      rawMethod,
      paymentType:   classifyPaymentMethod(rawMethod),
      txId:          (cols[COL.txId] || '').trim() || String(Date.now() + i),
    });
  }
  return results;
}

function parseCsvLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      cols.push(cur); cur = '';
    } else { cur += ch; }
  }
  cols.push(cur);
  return cols;
}

// --- カテゴリ選択ドロップダウン -----------------------------------------------
function CategorySelect({ value, onChange, categories, darkMode, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 13,
          backgroundColor: value ? theme.accent + '22' : (darkMode ? '#262626' : '#f5f5f5'),
          color: value ? theme.accent : (darkMode ? '#a3a3a3' : '#737373'),
          border: `1.5px solid ${value ? theme.accent : 'transparent'}`,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || 'カテゴリを選択'}</span>
        <ChevronDown size={13} style={{ marginLeft: 4, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          backgroundColor: darkMode ? '#1C1C1E' : '#fff',
          border: `1px solid ${darkMode ? '#404040' : '#e5e7eb'}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => { onChange(cat); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 13,
                backgroundColor: value === cat ? theme.accent + '22' : 'transparent',
                color: value === cat ? theme.accent : (darkMode ? '#e5e5e5' : '#171717'),
                cursor: 'pointer', border: 'none',
              }}>{cat}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- カード選択ドロップダウン -------------------------------------------------
function CardSelect({ value, onChange, creditCards, darkMode, theme }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = value === 'cash'
    ? { label: '残高払いとして処理（引き落とし不要）', sub: null }
    : creditCards.find(c => String(c.id) === String(value))
      ? { label: creditCards.find(c => String(c.id) === String(value)).name, sub: null }
      : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
          backgroundColor: value ? (darkMode ? '#1e293b' : '#eff6ff') : (darkMode ? '#262626' : '#f5f5f5'),
          color: value ? theme.accent : (darkMode ? '#a3a3a3' : '#737373'),
          border: `1.5px solid ${value ? theme.accent + '66' : 'transparent'}`,
          cursor: 'pointer',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={14} />
          <span>{selected ? selected.label : 'カードを選択'}</span>
        </div>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          backgroundColor: darkMode ? '#1C1C1E' : '#fff',
          border: `1px solid ${darkMode ? '#404040' : '#e5e7eb'}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          overflow: 'hidden', marginTop: 4,
        }}>
          {creditCards.map(card => (
            <button key={card.id} onClick={() => { onChange(String(card.id)); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13,
                backgroundColor: String(value) === String(card.id) ? theme.accent + '22' : 'transparent',
                color: String(value) === String(card.id) ? theme.accent : (darkMode ? '#e5e5e5' : '#171717'),
                cursor: 'pointer', border: 'none',
              }}>
              <CreditCard size={13} />
              <span>{card.name}</span>
              {card.isPayPayLinked && (
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, backgroundColor: '#FF4B4B22', color: '#FF4B4B' }}>
                  PayPay連携
                </span>
              )}
            </button>
          ))}

          <div style={{ borderTop: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
            <button onClick={() => { onChange('cash'); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 12,
                backgroundColor: value === 'cash' ? theme.accent + '22' : 'transparent',
                color: value === 'cash' ? theme.accent : (darkMode ? '#a3a3a3' : '#9ca3af'),
                cursor: 'pointer', border: 'none',
              }}>
              残高払いとして処理（引き落とし不要）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- メインコンポーネント -----------------------------------------------------
export default function PayPayImportModal(props) {
  const {
    theme, darkMode,
    expenseCategories,
    creditCards,
    setShowPayPayImport,
    addTransactionsFromImport,
  } = props;

  // PayPay連携カードを自動検出
  const linkedCard = useMemo(
    () => creditCards.find(c => c.isPayPayLinked) || null,
    [creditCards]
  );

  const [step, setStep]             = useState('upload');
  const [parsedRows, setParsedRows] = useState([]);
  const [categories, setCategories] = useState({});   // txId → カテゴリ名
  const [cardIds, setCardIds]       = useState({});   // txId → cardId | 'cash'
  const [globalCard, setGlobalCard] = useState('');   // 全クレカ行に一括適用するカード
  const [excluded, setExcluded]     = useState(new Set()); // 追加しない行のtxId
  const [dragOver, setDragOver]     = useState(false);
  const [error, setError]           = useState('');
  const fileInputRef                = useRef(null);

  // クレカ行があるか
  const hasCreditRows = parsedRows.some(r => r.paymentType === 'credit');
  // 連携カード未設定でクレカ行がある → カード選択が必要
  const needsCardSelection = hasCreditRows && !linkedCard;

  // --- ファイル読み込み ----------------------------------------------------
  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('CSVファイルを選択してください'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parsePayPayCsv(e.target.result);
      if (rows.length === 0) {
        setError('支払い履歴が見つかりませんでした。PayPayの取引履歴CSVを選択してください。');
        return;
      }
      setParsedRows(rows);

      // 初期化
      const initCats  = {};
      const initCards = {};
      rows.forEach(r => {
        initCats[r.txId] = '';
        if (r.paymentType === 'credit') {
          // 連携カードがあれば自動設定
          initCards[r.txId] = linkedCard ? String(linkedCard.id) : '';
        } else {
          initCards[r.txId] = 'cash';
        }
      });
      setCategories(initCats);
      setCardIds(initCards);
      setGlobalCard(linkedCard ? String(linkedCard.id) : '');
      setExcluded(new Set());
      setStep('review');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  // 全クレカ行に一括カード適用
  const applyCardToAll = (cid) => {
    setGlobalCard(cid);
    setCardIds(prev => {
      const next = { ...prev };
      parsedRows.forEach(r => {
        if (r.paymentType === 'credit') next[r.txId] = cid;
      });
      return next;
    });
  };

  // 行の除外トグル
  const toggleExclude = (txId) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  // 全件に同じカテゴリ適用
  const applyToAll = (cat) => {
    const next = {};
    parsedRows.forEach(r => { next[r.txId] = cat; });
    setCategories(next);
  };

  // --- 追加実行 -------------------------------------------------------------
  const handleImport = () => {
    const activeRows = parsedRows.filter(r => !excluded.has(r.txId));
    const unsetCat  = activeRows.filter(r => !categories[r.txId]);
    const unsetCard = activeRows.filter(r => r.paymentType === 'credit' && !cardIds[r.txId]);
    if (unsetCat.length > 0)  { setError(`${unsetCat.length}件のカテゴリが未選択です`); return; }
    if (unsetCard.length > 0) { setError(`${unsetCard.length}件のクレカが未選択です`); return; }

    const txns = activeRows.map(r => {
      const isCredit   = r.paymentType === 'credit' && cardIds[r.txId] !== 'cash';
      const resolvedId = isCredit ? cardIds[r.txId] : null;
      return {
        date:          r.date,
        amount:        -r.amount,
        category:      categories[r.txId],
        memo:          r.merchant,
        type:          'expense',
        paymentMethod: isCredit ? 'credit' : 'cash',
        settled:       !isCredit,
        isSettlement:  false,
        isSplit:       false,
        splitMembers:  [],
        ...(isCredit ? { cardId: resolvedId } : {}),
      };
    });

    addTransactionsFromImport(txns);
    setShowPayPayImport(false);
  };

  const activeRows     = parsedRows.filter(r => !excluded.has(r.txId));
  const creditCount    = parsedRows.filter(r => r.paymentType === 'credit').length;
  const cashCount      = parsedRows.filter(r => r.paymentType === 'cash').length;
  const excludedCount  = excluded.size;
  const allCatSet      = activeRows.length > 0 && activeRows.every(r => categories[r.txId]);
  const allCardSet     = activeRows.filter(r => r.paymentType === 'credit').every(r => cardIds[r.txId]);
  const canImport      = activeRows.length > 0 && allCatSet && allCardSet;
  const unsetCatCount  = activeRows.filter(r => !categories[r.txId]).length;
  const unsetCardCount = activeRows.filter(r => r.paymentType === 'credit' && !cardIds[r.txId]).length;

  const S = { // inline styles shorthand
    bg:   darkMode ? '#111' : '#fff',
    sub:  darkMode ? '#1a1a1a' : '#fafafa',
    border: darkMode ? '#2a2a2a' : '#e5e7eb',
    text: darkMode ? '#f5f5f5' : '#111',
    muted: darkMode ? '#737373' : '#9ca3af',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowPayPayImport(false); }}
    >
      <div style={{
        backgroundColor: S.bg, borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        padding: '20px 20px 32px',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF4B4B' }}>
              <span style={{ fontSize: 18 }}>🔴</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.text }}>PayPay 取引読み込み</div>
              {step === 'review' && (
                <div style={{ fontSize: 12, color: S.muted, marginTop: 1 }}>
                  {activeRows.length}件追加 / {parsedRows.length}件中
                  {excludedCount > 0 && (
                    <span style={{ color: '#FF9F0A', marginLeft: 6 }}>（{excludedCount}件除外）</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setShowPayPayImport(false)}
            style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5', cursor: 'pointer' }}>
            <X size={18} color={S.muted} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: '#FF453A22', borderRadius: 10, marginBottom: 12 }}>
            <AlertCircle size={16} color="#FF453A" />
            <span style={{ fontSize: 13, color: '#FF453A' }}>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? theme.accent : (darkMode ? '#404040' : '#d1d5db')}`,
                borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                backgroundColor: dragOver ? theme.accent + '11' : S.sub, transition: 'all 0.2s',
              }}
            >
              <Upload size={36} color={dragOver ? theme.accent : S.muted} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: S.text, marginBottom: 6 }}>CSVファイルをドロップ</div>
              <div style={{ fontSize: 13, color: S.muted, marginBottom: 16 }}>または</div>
              <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: theme.accent, color: '#fff' }}>
                ファイルを選択
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', backgroundColor: linkedCard ? '#FF4B4B11' : S.sub, borderRadius: 12, border: `1px solid ${linkedCard ? '#FF4B4B33' : S.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🔴</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: linkedCard ? '#FF4B4B' : S.muted }}>
                    {linkedCard ? `PayPay連携カード: ${linkedCard.name}` : 'PayPay連携カード未設定'}
                  </div>
                  <div style={{ fontSize: 11, color: S.muted, marginTop: 1 }}>
                    {linkedCard
                      ? 'クレカ払いの取引に自動適用されます'
                      : '設定 → クレカ管理で連携カードを設定するか、読み込み時に選択できます'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '12px 14px', backgroundColor: S.sub, borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: S.muted, marginBottom: 8 }}>📋 CSVの取得方法</div>
              {['PayPayアプリを開く', '右下「アカウント」→「取引履歴」', '右上ダウンロードアイコン→「CSVダウンロード」'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, backgroundColor: theme.accent + '33', color: theme.accent }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: S.muted, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <>

            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: S.muted, whiteSpace: 'nowrap', width: 70 }}>全件カテゴリ:</span>
                <div style={{ flex: 1 }}>
                  <CategorySelect value="" onChange={applyToAll} categories={expenseCategories} darkMode={darkMode} theme={theme} />
                </div>
              </div>

              {needsCardSelection && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: '#FF4B4B11', borderRadius: 10, border: '1px solid #FF4B4B33' }}>
                  <Info size={14} color="#FF4B4B" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#FF4B4B', marginBottom: 4 }}>
                      クレカ {creditCount}件 — 引き落とし先カードを選択
                    </div>
                    <CardSelect value={globalCard} onChange={applyCardToAll} creditCards={creditCards} darkMode={darkMode} theme={theme} />
                  </div>
                </div>
              )}

              {linkedCard && hasCreditRows && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#FF4B4B11', borderRadius: 10, border: '1px solid #FF4B4B22' }}>
                  <span style={{ fontSize: 12 }}>🔴</span>
                  <span style={{ fontSize: 12, color: '#FF4B4B' }}>
                    クレカ払い {creditCount}件 → <b>{linkedCard.name}</b> を自動適用
                  </span>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {parsedRows.map((row) => {
                const isCredit = row.paymentType === 'credit';
                const cardIdVal = cardIds[row.txId];
                const isCash = cardIdVal === 'cash';
                const assignedCard = isCredit && !isCash
                  ? creditCards.find(c => String(c.id) === String(cardIdVal))
                  : null;

                return (
                  <div key={row.txId} style={{
                    padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                    backgroundColor: excluded.has(row.txId) ? (darkMode ? '#1a1a1a' : '#f5f5f5') : S.sub,
                    border: `1px solid ${excluded.has(row.txId) ? S.border : (categories[row.txId] ? theme.accent + '44' : S.border)}`,
                    opacity: excluded.has(row.txId) ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: excluded.has(row.txId) ? 0 : 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: excluded.has(row.txId) ? S.muted : S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: excluded.has(row.txId) ? 'line-through' : 'none' }}>
                          {row.merchant}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: S.muted }}>{row.date}</span>

                          {isCredit ? (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: isCash ? '#9ca3af22' : (assignedCard?.isPayPayLinked ? '#FF4B4B22' : theme.accent + '22'), color: isCash ? '#9ca3af' : (assignedCard?.isPayPayLinked ? '#FF4B4B' : theme.accent) }}>
                              {isCash ? '残高払いとして処理' : (assignedCard ? `💳 ${assignedCard.name}` : 'クレカ未選択')}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: '#10b98122', color: '#10b981' }}>
                              ✓ 即時決済
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: excluded.has(row.txId) ? S.muted : '#FF453A' }}>
                          -¥{row.amount.toLocaleString()}
                        </div>
                        <button
                          onClick={() => toggleExclude(row.txId)}
                          title={excluded.has(row.txId) ? '追加する' : '除外する'}
                          style={{
                            width: 24, height: 24, borderRadius: '50%', border: 'none',
                            backgroundColor: excluded.has(row.txId) ? '#10b98133' : '#FF453A22',
                            color: excluded.has(row.txId) ? '#10b981' : '#FF453A',
                            cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {excluded.has(row.txId) ? '＋' : '✕'}
                        </button>
                      </div>
                    </div>

                    {!excluded.has(row.txId) && <CategorySelect
                      value={categories[row.txId]}
                      onChange={(cat) => setCategories(prev => ({ ...prev, [row.txId]: cat }))}
                      categories={expenseCategories}
                      darkMode={darkMode}
                      theme={theme}
                    />}

                    {!excluded.has(row.txId) && isCredit && needsCardSelection && (
                      <div style={{ marginTop: 6 }}>
                        <CardSelect
                          value={cardIds[row.txId]}
                          onChange={(cid) => setCardIds(prev => ({ ...prev, [row.txId]: cid }))}
                          creditCards={creditCards}
                          darkMode={darkMode}
                          theme={theme}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              {(unsetCatCount > 0 || unsetCardCount > 0) && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#FF9F0A', marginBottom: 8 }}>
                  {unsetCatCount > 0 && `カテゴリ未選択 ${unsetCatCount}件`}
                  {unsetCatCount > 0 && unsetCardCount > 0 && '　'}
                  {unsetCardCount > 0 && `クレカ未選択 ${unsetCardCount}件`}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setStep('upload'); setError(''); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5', color: S.muted, border: 'none', cursor: 'pointer' }}>
                  戻る
                </button>
                <button onClick={handleImport} disabled={!canImport}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    backgroundColor: canImport ? theme.accent : (darkMode ? '#2a2a2a' : '#e5e7eb'),
                    color: canImport ? '#fff' : (darkMode ? '#525252' : '#9ca3af'),
                    border: 'none', cursor: canImport ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                  }}>
                  <Check size={16} />
                  {activeRows.length}件を追加する
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
