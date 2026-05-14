import { withDbRecovery } from '../db';
import { MaintenanceRecord } from '../../types';

export const createMaintenanceRecord = (
  vehicleId: number,
  serviceType: string,
  date: string,
  mileage: number,
  cost: number,
  notes: string = '',
  nextRevisionDate?: string,
  nextRevisionMileage?: number
): number => {
  return withDbRecovery((db) => {
    const createdAt = new Date().toISOString();

    const result = db.runSync(
      'INSERT INTO maintenance_record (vehicleId, serviceType, date, mileage, cost, notes, nextRevisionDate, nextRevisionMileage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      vehicleId, serviceType, date, mileage, cost, notes, nextRevisionDate ?? null, nextRevisionMileage ?? null, createdAt
    );

    return result.lastInsertRowId;
  });
};

export const getMaintenanceRecords = (vehicleId: number): MaintenanceRecord[] => {
  return withDbRecovery((db) => {
    return db.getAllSync<MaintenanceRecord>(
      'SELECT * FROM maintenance_record WHERE vehicleId = ? ORDER BY date DESC',
      vehicleId
    );
  });
};

export const getMaintenanceById = (id: number): MaintenanceRecord | null => {
  return withDbRecovery((db) => {
    const record = db.getFirstSync<MaintenanceRecord>(
      'SELECT * FROM maintenance_record WHERE id = ?',
      id
    );
    return record ?? null;
  });
};

export const deleteMaintenanceRecord = (id: number): void => {
  withDbRecovery((db) => {
    db.runSync('DELETE FROM maintenance_record WHERE id = ?', id);
  });
};

export const getMaintenanceRecordById = getMaintenanceById;
