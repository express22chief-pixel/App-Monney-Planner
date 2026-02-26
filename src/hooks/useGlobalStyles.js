/**
 * useGlobalStyles.js
 * iOS向けズーム防止 + グローバルアニメーションCSSをDOMに注入するフック。
 * Capacitor移行後も同様に機能する（WebViewでそのまま使える）。
 */
import { useEffect } from 'react';

export function useGlobalStyles() {
  useEffect(() => {
    // viewport meta を maximum-scale=1 に更新
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      document.head.appendChild(vp);
    }
    vp.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    const styleId = 'ios-zoom-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        input, select, textarea {
          font-size: 16px !important;
        }
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          select, textarea, input {
            font-size: 16px !important;
          }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .hover-scale {
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease;
        }
        .hover-scale:active {
          transform: scale(0.95);
          opacity: 0.85;
        }
        button {
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button:active {
          transform: scale(0.96);
          opacity: 0.82;
        }
        .glass, .glass-dark {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .transition-all {
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .duration-200 {
          transition-duration: 220ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .duration-300 {
          transition-duration: 320ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
}
