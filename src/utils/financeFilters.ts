import { MaintenanceRecord } from '../types';

export const CURRENT_MONTH = 'CURRENT_MONTH';
export const CURRENT_YEAR = 'CURRENT_YEAR';
export const ALL_TIME = 'ALL_TIME';

export type FinancePeriod = typeof CURRENT_MONTH | typeof CURRENT_YEAR | typeof ALL_TIME;

export interface ExpenseSummary {
  total: number;
  average: number;
  count: number;
  highest: number;
}

const isSameMonth = (date: Date, referenceDate: Date): boolean => {
  return date.getFullYear() === referenceDate.getFullYear()
    && date.getMonth() === referenceDate.getMonth();
};

const isSameYear = (date: Date, referenceDate: Date): boolean => {
  return date.getFullYear() === referenceDate.getFullYear();
};

export const filterByPeriod = (
  records: MaintenanceRecord[],
  period: FinancePeriod,
  referenceDate = new Date()
): MaintenanceRecord[] => {
  if (period === ALL_TIME) {
    return records;
  }

  return records.filter((record) => {
    const recordDate = new Date(record.date);
    if (isNaN(recordDate.getTime())) {
      return false;
    }

    if (period === CURRENT_MONTH) {
      return isSameMonth(recordDate, referenceDate);
    }

    return isSameYear(recordDate, referenceDate);
  });
};

export const calculateExpenses = (records: MaintenanceRecord[]): ExpenseSummary => {
  const total = records.reduce((sum, record) => sum + record.cost, 0);
  const count = records.length;
  const highest = records.reduce((max, record) => Math.max(max, record.cost), 0);

  return {
    total,
    average: count > 0 ? total / count : 0,
    count,
    highest,
  };
};
