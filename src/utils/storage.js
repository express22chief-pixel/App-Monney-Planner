/**
 * utils/storage.js
 * 後方互換レイヤー。
 *
 * ストレージの実装は services/storage.js に移動しました。
 * このファイルは既存のimportパスを壊さないための再エクスポートです。
 *
 * 【新規コードは必ず services/storage.js を直接 import してください】
 * import { load, save } from '../services/storage';
 */
export { load, save, remove, clearAll } from '../services/storage';
