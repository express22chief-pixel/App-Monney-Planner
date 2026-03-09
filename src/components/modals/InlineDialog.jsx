import React, { useState, useEffect, useRef } from 'react';

/**
 * InlineDialog – window.prompt / window.confirm の置換コンポーネント
 *
 * Props:
 *   type:      'confirm' | 'input'
 *   title:     string
 *   message:   string
 *   defaultValue: string (inputのみ)
 *   inputType: 'number' | 'text' (inputのみ、デフォルト 'number')
 *   confirmLabel: string (デフォルト 'OK')
 *   cancelLabel:  string (デフォルト 'キャンセル')
 *   danger:    bool  (confirmボタンを赤くする)
 *   onConfirm: (value?) => void
 *   onCancel:  () => void
 *   darkMode:  bool
 *   theme:     object
 */
export default function InlineDialog({
  type = 'confirm',
  title,
  message,
  defaultValue = '',
  inputType = 'number',
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  danger = false,
  onConfirm,
  onCancel,
  darkMode,
  theme,
}) {
  const [value, setValue] = useState(String(defaultValue));
  const inputRef = useRef(null);

  useEffect(() => {
    if (type === 'input' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [type]);

  const handleConfirm = () => {
    if (type === 'input') {
      onConfirm(value);
    } else {
      onConfirm();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel?.();
  };

  const bg      = darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)';
  const card    = darkMode ? '#1c1c1e' : '#fff';
  const txt     = darkMode ? '#f5f5f5' : '#111';
  const sub     = darkMode ? '#8e8e93' : '#6b7280';
  const border  = darkMode ? '#2a2a2a' : '#e5e7eb';
  const inputBg = darkMode ? '#2c2c2e' : '#f2f2f7';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: bg, backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div
        className="w-full max-w-xs rounded-lg shadow-2xl animate-slideUp"
        style={{ background: card, border: `1px solid ${border}` }}
        onKeyDown={handleKeyDown}
      >

        <div className="px-5 pt-5 pb-3">
          {title && (
            <p className="text-base font-bold mb-1" style={{ color: txt }}>{title}</p>
          )}
          {message && (
            <p className="text-sm leading-relaxed" style={{ color: sub }}>{message}</p>
          )}
        </div>

        {type === 'input' && (
          <div className="px-5 pb-3">
            <input
              ref={inputRef}
              type={inputType}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-base font-bold tabular-nums focus:outline-none"
              style={{
                background: inputBg,
                color: txt,
                border: `1.5px solid ${darkMode ? '#3a3a3c' : '#d1d5db'}`,
              }}
            />
          </div>
        )}

        <div
          className="flex border-t"
          style={{ borderColor: border }}
        >
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 text-sm font-semibold transition-colors rounded-bl-2xl"
              style={{ color: sub }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 text-sm font-bold transition-colors rounded-br-2xl"
            style={{
              color: danger ? '#ef4444' : (theme?.accent || '#3b82f6'),
              borderLeft: onCancel ? `1px solid ${border}` : 'none',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
