/**
 * components/SplashScreen.jsx
 * 起動時のスプラッシュ画面。App.jsx から分離。
 */
import React from 'react';

export default function SplashScreen({ darkMode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ marginBottom: 28 }}>
          <svg width="110" height="110" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="splashBg" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#111111"/>
                <stop offset="100%" stopColor="#080808"/>
              </radialGradient>
              <filter id="splashGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="splashWave" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="115" fill="url(#splashBg)"/>
            <rect x="1" y="1" width="510" height="510" rx="114" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0.35"/>
            <line x1="64" y1="160" x2="448" y2="160" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <line x1="64" y1="256" x2="448" y2="256" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <line x1="64" y1="352" x2="448" y2="352" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <line x1="160" y1="64" x2="160" y2="448" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <line x1="256" y1="64" x2="256" y2="448" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <line x1="352" y1="64" x2="352" y2="448" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.1"/>
            <polygon points="80,340 80,420 432,420 432,300 370,260 310,310 230,180 150,260" fill="url(#splashWave)"/>
            <polyline points="80,340 150,260 230,180 310,310 370,260 432,300"
              stroke="#00e5ff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#splashGlow)"/>
            <rect x="100" y="88" width="180" height="108" rx="16" fill="#1a1a1a" stroke="#00e5ff" strokeWidth="2.5" strokeOpacity="0.5"/>
            <rect x="100" y="108" width="180" height="18" fill="#00e5ff" fillOpacity="0.12"/>
            <rect x="116" y="152" width="52" height="8" rx="4" fill="#00e5ff" fillOpacity="0.35"/>
            <circle cx="255" cy="148" r="8" fill="#00e5ff" fillOpacity="0.25"/>
            <circle cx="270" cy="148" r="8" fill="#00e5ff" fillOpacity="0.45"/>
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 26, fontWeight: 800, color: '#f5f5f5',
          letterSpacing: '-0.03em', marginBottom: 8,
        }}>MONEY<span style={{ color: '#00e5ff' }}>.</span>PLANNER</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
          お金の流れを、時間軸で管理する。
        </p>
      </div>
    </div>
  );
}
