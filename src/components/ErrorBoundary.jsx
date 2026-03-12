/**
 * components/ErrorBoundary.jsx
 * 未捕捉エラーをキャッチして表示するエラーバウンダリ。
 */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const bg   = isDark ? '#0d0d0d' : '#f2f2f7';
      const card = isDark ? '#1a1a1a' : '#ffffff';
      const txt  = isDark ? '#f5f5f5' : '#111111';
      const sub  = isDark ? '#888888' : '#666666';
      const bdr  = isDark ? '#2a2a2a' : '#e5e7eb';
      const cyan = '#00e5ff';

      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: bg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 20px', fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>

            {/* アイコン */}
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(255,69,58,0.12)',
              border: '1.5px solid rgba(255,69,58,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>
              ⚠️
            </div>

            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: '#ff453a', marginBottom: 8, textTransform: 'uppercase',
            }}>
              予期しないエラーが発生しました
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: txt, marginBottom: 8 }}>
              アプリを再起動してください
            </h2>

            <p style={{ fontSize: 13, color: sub, lineHeight: 1.6, marginBottom: 24 }}>
              データはデバイスに保存されているため、<br />
              再読み込みしても失われません。
            </p>

            {/* エラー詳細（折りたたみ） */}
            <details style={{
              background: card, borderRadius: 12,
              border: `1px solid ${bdr}`,
              padding: '10px 14px', marginBottom: 24,
              textAlign: 'left',
            }}>
              <summary style={{ fontSize: 11, color: sub, cursor: 'pointer', userSelect: 'none' }}>
                エラー詳細
              </summary>
              <pre style={{
                marginTop: 8, fontSize: 10, color: '#ff453a',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                lineHeight: 1.5, maxHeight: 160, overflowY: 'auto',
              }}>
                {this.state.error.toString()}
              </pre>
            </details>

            {/* ボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: cyan, border: 'none', cursor: 'pointer',
                  color: '#000', fontSize: 14, fontWeight: 800,
                }}
              >
                再読み込みする
              </button>
              <button
                onClick={() => this.setState({ error: null, errorInfo: null })}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: card, border: `1px solid ${bdr}`,
                  cursor: 'pointer', color: sub, fontSize: 13, fontWeight: 600,
                }}
              >
                このまま続ける（不安定な場合あり）
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
