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
              <radialGradient id="splashBgGrad" cx="30%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#111111"/>
                <stop offset="100%" stopColor="#080808"/>
              </radialGradient>
              <filter id="splashGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="splashSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="12" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="splashWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0"/>
              </linearGradient>
              <linearGradient id="splashCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a1a1a"/>
                <stop offset="100%" stopColor="#111111"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="112" fill="url(#splashBgGrad)"/>
            <g opacity="0.06">
              <line x1="0" y1="128" x2="512" y2="128" stroke="#00e5ff" strokeWidth="0.5"/>
              <line x1="0" y1="256" x2="512" y2="256" stroke="#00e5ff" strokeWidth="0.5"/>
              <line x1="0" y1="384" x2="512" y2="384" stroke="#00e5ff" strokeWidth="0.5"/>
              <line x1="128" y1="0" x2="128" y2="512" stroke="#00e5ff" strokeWidth="0.5"/>
              <line x1="256" y1="0" x2="256" y2="512" stroke="#00e5ff" strokeWidth="0.5"/>
              <line x1="384" y1="0" x2="384" y2="512" stroke="#00e5ff" strokeWidth="0.5"/>
            </g>
            <g transform="translate(82, 148) rotate(-6, 174, 90)">
              <rect width="348" height="212" rx="18" fill="url(#splashCardGrad)" stroke="#00e5ff" strokeWidth="1.2" strokeOpacity="0.25"/>
              <rect x="0" y="54" width="348" height="36" fill="#00e5ff" opacity="0.07"/>
              <rect x="28" y="82" width="44" height="34" rx="6" fill="none" stroke="#00e5ff" strokeWidth="1.2" strokeOpacity="0.3"/>
              <line x1="28" y1="99" x2="72" y2="99" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.2"/>
              <line x1="50" y1="82" x2="50" y2="116" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.2"/>
            </g>
            <path d="M 62 310 L 62 268 L 118 230 L 174 272 L 230 198 L 286 244 L 342 186 L 398 222 L 450 258 L 450 310 Z" fill="url(#splashWaveGrad)"/>
            <path d="M 62 268 L 118 230 L 174 272 L 230 198 L 286 244 L 342 186 L 398 222 L 450 258"
              stroke="#00e5ff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" filter="url(#splashSoftGlow)"/>
            <path d="M 62 268 L 118 230 L 174 272 L 230 198 L 286 244 L 342 186 L 398 222 L 450 258"
              stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#splashGlow)"/>
            <circle cx="230" cy="198" r="7" fill="#080808" stroke="#00e5ff" strokeWidth="2.5" filter="url(#splashGlow)"/>
            <circle cx="342" cy="186" r="7" fill="#080808" stroke="#00e5ff" strokeWidth="2.5" filter="url(#splashGlow)"/>
            <line x1="62" y1="192" x2="62" y2="330" stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 4"/>
            <text x="388" y="350" fontFamily="Georgia, serif" fontSize="52" fontWeight="700" fill="#00e5ff" opacity="0.18" letterSpacing="-2">¥</text>
            <line x1="62" y1="340" x2="450" y2="340" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.15"/>
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
