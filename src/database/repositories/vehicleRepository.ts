import { withDbRecovery } from '../db';
import { Vehicle } from '../../types';

export const createVehicle = (brand: string, model: string, year: number, plate: string, currentMileage?: number): number => {
  return withDbRecovery((db) => {
    const createdAt = new Date().toISOString();

    const result = db.runSync(
      'INSERT INTO vehicle (brand, model, year, plate, currentMileage, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      brand, model, year, plate, currentMileage ?? null, createdAt
    );

    return result.lastInsertRowId;
  });
};

export const updateVehicle = (id: number, brand: string, model: string, year: number, plate: string, currentMileage?: number): void => {
  withDbRecovery((db) => {
    db.runSync(
      'UPDATE vehicle SET brand = ?, model = ?, year = ?, plate = ?, currentMileage = ? WHERE id = ?',
      brand, model, year, plate, currentMileage ?? null, id
    );
  });
};

export const getFirstVehicle = (): Vehicle | null => {
  return withDbRecovery((db) => {
    const vehicle = db.getFirstSync<Vehicle>('SELECT * FROM vehicle LIMIT 1');
    return vehicle ?? null;
  });
};

export const getVehicles = (): Vehicle[] => {
  return withDbRecovery((db) => {
    return db.getAllSync<Vehicle>('SELECT * FROM vehicle ORDER BY id DESC');
  });
};

export const getVehicleById = (id: number): Vehicle | null => {
  return withDbRecovery((db) => {
    const vehicle = db.getFirstSync<Vehicle>('SELECT * FROM vehicle WHERE id = ?', id);
    return vehicle ?? null;
  });
};

export const deleteVehicle = (id: number): void => {
  withDbRecovery((db) => {
    db.runSync('DELETE FROM vehicle WHERE id = ?', id);
  });
};
