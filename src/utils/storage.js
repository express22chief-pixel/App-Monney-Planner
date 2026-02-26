/**
 * storage.js
 * データ保存・読込の抽象レイヤー。
 * Capacitor移行時はこのファイルの実装だけ差し替えればOK。
 *
 * [Capacitor移行手順]
 * 1. npm install @capacitor/preferences
 * 2. 下部コメントのcapacitorImplに切り替え
 * 3. save/loadをasyncに（呼び出し側もawait）
 */

// ─── localStorage 実装（現在使用中）
export function load(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[storage] 保存エラー:', key, error);
  }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

export function clearAll() {
  try { localStorage.clear(); } catch { /* noop */ }
}

// ─── Capacitor Preferences 実装（将来の移行用・コメントアウト中）
// import { Preferences } from '@capacitor/preferences';
// export async function load(key, defaultValue) {
//   const { value } = await Preferences.get({ key });
//   return value ? JSON.parse(value) : defaultValue;
// }
// export async function save(key, value) {
//   await Preferences.set({ key, value: JSON.stringify(value) });
// }
// export async function remove(key) { await Preferences.remove({ key }); }
// export async function clearAll() { await Preferences.clear(); }
