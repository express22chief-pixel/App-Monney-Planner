/**
 * services/storage.js
 * ストレージ抽象化レイヤー。
 *
 * 【設計方針】
 * - StorageAdapter インターフェースを定義し、実装を差し替え可能にする
 * - 現在は localStorageAdapter を使用
 * - Capacitor移行時は capacitorAdapter に1行変更するだけでOK
 *
 * 【Capacitor移行手順】
 * 1. npm install @capacitor/preferences
 * 2. activeAdapter を capacitorAdapter に変更
 * 3. useMoneyData の永続化 useEffect を async/await 対応に変更
 *    （StorageAdapter の save/load が Promise を返すようになるため）
 *
 * 【AdapterInterface（型定義コメント）】
 * interface StorageAdapter {
 *   load(key: string, defaultValue: any): any | Promise<any>;
 *   save(key: string, value: any): void | Promise<void>;
 *   remove(key: string): void | Promise<void>;
 *   clearAll(): void | Promise<void>;
 * }
 */

// --- localStorage 実装 ------------------------------------------------------
const localStorageAdapter = {
  load(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('[storage] 保存エラー:', key, err);
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },

  clearAll() {
    try { localStorage.clear(); } catch { /* noop */ }
  },
};

// --- Capacitor Preferences 実装（移行時にコメント解除） --------------------
// import { Preferences } from '@capacitor/preferences';
// const capacitorAdapter = {
//   async load(key, defaultValue) {
//     const { value } = await Preferences.get({ key });
//     return value !== null ? JSON.parse(value) : defaultValue;
//   },
//   async save(key, value) {
//     await Preferences.set({ key, value: JSON.stringify(value) });
//   },
//   async remove(key) { await Preferences.remove({ key }); },
//   async clearAll() { await Preferences.clear(); },
// };

// --- アクティブなアダプターをここで切り替える -------------------------------
const activeAdapter = localStorageAdapter;
// Capacitor移行時: const activeAdapter = capacitorAdapter;

// --- 公開API（アダプターを隠蔽） --------------------------------------------
export const load    = (key, defaultValue) => activeAdapter.load(key, defaultValue);
export const save    = (key, value)        => activeAdapter.save(key, value);
export const remove  = (key)               => activeAdapter.remove(key);
export const clearAll = ()                 => activeAdapter.clearAll();
