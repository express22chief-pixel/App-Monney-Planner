/**
 * hooks/usePersistence.js
 * ドメインデータをストレージへ永続化する副作用を一箇所に集約。
 *
 * 【責務】
 * - useMoneyData の state 変更を監視してストレージに保存する
 * - ストレージ操作は必ずここ経由で行う（useMoneyData内に分散させない）
 *
 * 【Capacitor移行時】
 * - save が async になる場合は各 useEffect 内を async/await に変更するだけ
 * - useMoneyData 側は変更不要
 */
import { useEffect } from 'react';
import { save } from '../services/storage';

/**
 * @param {object} state - useMoneyDataの全state
 */
export function usePersistence(state) {
  const {
    transactions,
    assetData,
    monthlyHistory,
    lifeEvents,
    userInfo,
    simulationSettings,
    darkMode,
    monthlyBudget,
    customCategories,
    recurringTransactions,
    creditCards,
    splitPayments,
    dismissedClosingAlerts,
    isDemoMode,
  } = state;

  // デモモード中はドメインデータを保存しない（isDemoModeフラグのみ保存）
  const isDemo = isDemoMode;

  useEffect(() => { if (!isDemo) save('transactions',          transactions);          }, [transactions, isDemo]);
  useEffect(() => { if (!isDemo) save('assetData',             assetData);             }, [assetData, isDemo]);
  useEffect(() => { if (!isDemo) save('monthlyHistory',        monthlyHistory);        }, [monthlyHistory, isDemo]);
  useEffect(() => { if (!isDemo) save('lifeEvents',            lifeEvents);            }, [lifeEvents, isDemo]);
  useEffect(() => { if (!isDemo && userInfo) save('userInfo',  userInfo);              }, [userInfo, isDemo]);
  useEffect(() => { if (!isDemo) save('simulationSettings',    simulationSettings);    }, [simulationSettings, isDemo]);
  useEffect(() => {               save('darkMode',              darkMode);              }, [darkMode]);
  useEffect(() => { if (!isDemo) save('monthlyBudget',         monthlyBudget);         }, [monthlyBudget, isDemo]);
  useEffect(() => { if (!isDemo) save('customCategories',      customCategories);      }, [customCategories, isDemo]);
  useEffect(() => { if (!isDemo) save('recurringTransactions', recurringTransactions); }, [recurringTransactions, isDemo]);
  useEffect(() => { if (!isDemo) save('creditCards',           creditCards);           }, [creditCards, isDemo]);
  useEffect(() => { if (!isDemo) save('splitPayments',         splitPayments);         }, [splitPayments, isDemo]);
  useEffect(() => {               save('dismissedClosingAlerts',dismissedClosingAlerts);}, [dismissedClosingAlerts]);

  useEffect(() => { if (!isDemo) save('wallets', state.wallets); }, [state.wallets, isDemo]);
  useEffect(() => { if (!isDemo && state.housingParams) save('housingParams', state.housingParams); }, [state.housingParams, isDemo]);
  useEffect(() => { if (!isDemo && state.lifePlan) save('lifePlan', state.lifePlan); }, [state.lifePlan, isDemo]);
  useEffect(() => { if (!isDemo) save('transactionTemplates', state.transactionTemplates); }, [state.transactionTemplates, isDemo]);
  useEffect(() => { if (!isDemo) save('walletAdjustments', state.walletAdjustments); }, [state.walletAdjustments, isDemo]);
}