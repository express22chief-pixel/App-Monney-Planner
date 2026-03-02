/**
 * components/SplashScreen.jsx
 * 起動時のスプラッシュ画面。App.jsx から分離。
 */
import React from 'react';

export default function SplashScreen({ darkMode }) {
  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-600 to-purple-600'} flex items-center justify-center z-50`}>
      <div className="text-center animate-fadeIn">
        <div className="mb-6 animate-pulse-once">
          <svg width="120" height="120" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   style={{ stopColor: '#0A84FF', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0CD664', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="115" fill="url(#grad)" />
            <g transform="translate(256, 256)">
              <path d="M-140,-40 L-80,-60 L-20,20 L40,-80 L100,40 L140,0"
                stroke="white" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"
                fill="none" opacity="0.9" />
              <path d="M-140,-40 L-80,-60 L-20,20 L40,-80 L100,40 L140,0 L140,120 L-140,120 Z"
                fill="white" opacity="0.15" />
              <circle cx="-140" cy="-40" r="8" fill="white" />
              <circle cx="-80"  cy="-60" r="8" fill="white" />
              <circle cx="-20"  cy="20"  r="8" fill="white" />
              <circle cx="40"   cy="-80" r="8" fill="white" />
              <circle cx="100"  cy="40"  r="8" fill="white" />
              <circle cx="140"  cy="0"   r="8" fill="white" />
            </g>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Money Planner</h1>
        <p className="text-white text-opacity-80 text-sm">あなたの未来をデザインする</p>
      </div>
    </div>
  );
}
