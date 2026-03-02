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
  } = state;

  useEffect(() => { save('transactions',          transactions);          }, [transactions]);
  useEffect(() => { save('assetData',             assetData);             }, [assetData]);
  useEffect(() => { save('monthlyHistory',         monthlyHistory);        }, [monthlyHistory]);
  useEffect(() => { save('lifeEvents',            lifeEvents);            }, [lifeEvents]);
  useEffect(() => { if (userInfo) save('userInfo', userInfo);             }, [userInfo]);
  useEffect(() => { save('simulationSettings',    simulationSettings);    }, [simulationSettings]);
  useEffect(() => { save('darkMode',              darkMode);              }, [darkMode]);
  useEffect(() => { save('monthlyBudget',         monthlyBudget);         }, [monthlyBudget]);
  useEffect(() => { save('customCategories',      customCategories);      }, [customCategories]);
  useEffect(() => { save('recurringTransactions', recurringTransactions); }, [recurringTransactions]);
  useEffect(() => { save('creditCards',           creditCards);           }, [creditCards]);
  useEffect(() => { save('splitPayments',         splitPayments);         }, [splitPayments]);
  useEffect(() => { save('dismissedClosingAlerts',dismissedClosingAlerts);}, [dismissedClosingAlerts]);

  useEffect(() => { save('transactionTemplates', state.transactionTemplates); }, [state.transactionTemplates]);
}