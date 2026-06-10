import { MaintenanceRecord, Vehicle } from '../types';
import { getRevisionStatus, RevisionStatus } from './statusHelper';

export interface MaintenanceStatusSummary {
  overdue: number;
  soon: number;
  ok: number;
  indefinite: number;
}

export const getMaintenancesWithRevision = (records: MaintenanceRecord[]): MaintenanceRecord[] => {
  return records.filter((record) => record.nextRevisionDate || record.nextRevisionMileage);
};

export const getStatusSummary = (
  records: MaintenanceRecord[],
  currentMileage?: number
): MaintenanceStatusSummary => {
  return getMaintenancesWithRevision(records).reduce<MaintenanceStatusSummary>(
    (summary, record) => {
      const status = getRevisionStatus(record.nextRevisionDate, record.nextRevisionMileage, currentMileage);

      if (status === 'ATRASADA') summary.overdue += 1;
      else if (status === 'PROXIMA') summary.soon += 1;
      else if (status === 'EM_DIA') summary.ok += 1;
      else summary.indefinite += 1;

      return summary;
    },
    { overdue: 0, soon: 0, ok: 0, indefinite: 0 }
  );
};

export const getVehicleStatus = (
  records: MaintenanceRecord[],
  currentMileage?: number
): RevisionStatus => {
  const summary = getStatusSummary(records, currentMileage);

  if (summary.overdue > 0) return 'ATRASADA';
  if (summary.soon > 0) return 'PROXIMA';
  if (summary.ok > 0) return 'EM_DIA';

  return 'INDEFINIDA';
};

export const getHealthScore = (
  records: MaintenanceRecord[],
  currentMileage?: number
): number => {
  const summary = getStatusSummary(records, currentMileage);
  const score = 100 - summary.overdue * 25 - summary.soon * 8;

  return Math.max(0, Math.min(100, score));
};

export const getUpcomingMaintenances = (
  records: MaintenanceRecord[],
  currentMileage?: number
): MaintenanceRecord[] => {
  return getMaintenancesWithRevision(records).sort((a, b) => {
    const statusA = getRevisionStatus(a.nextRevisionDate, a.nextRevisionMileage, currentMileage);
    const statusB = getRevisionStatus(b.nextRevisionDate, b.nextRevisionMileage, currentMileage);

    if (statusA === 'ATRASADA' && statusB !== 'ATRASADA') return -1;
    if (statusB === 'ATRASADA' && statusA !== 'ATRASADA') return 1;
    if (statusA === 'PROXIMA' && statusB === 'EM_DIA') return -1;
    if (statusB === 'PROXIMA' && statusA === 'EM_DIA') return 1;

    if (a.nextRevisionDate && b.nextRevisionDate) {
      return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
    }

    if (a.nextRevisionMileage && b.nextRevisionMileage) {
      return a.nextRevisionMileage - b.nextRevisionMileage;
    }

    if (a.nextRevisionDate) return -1;
    if (b.nextRevisionDate) return 1;

    return 0;
  });
};

export const getTotalSpent = (records: MaintenanceRecord[]): number => {
  return records.reduce((total, record) => total + record.cost, 0);
};

export const getLastMaintenance = (records: MaintenanceRecord[]): MaintenanceRecord | null => {
  return records.length > 0 ? records[0] : null;
};

export const getVehicleDisplayName = (vehicle: Vehicle): string => {
  return `${vehicle.brand} ${vehicle.model}`.trim();
};
